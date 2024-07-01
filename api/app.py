import os
import requests
import urllib.parse
import pytz
import redis
from flask import Flask, render_template, request, jsonify, redirect, url_for, abort, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timedelta
from util.DButil import create_connection, get_connection, release_connection
from util.puzzleUtil import album_list
from psycopg2.errors import UniqueViolation


"""
TODO 
+ Confirm that you want to know the correct answer when clicking on the idk button
+ Make the alerts() popups
+ When I add something to the control_panel, it should be added to the suggestions
- Save cookies till the next day to prevent players from replaying the same day
- Make the contact button send an email to me
- View the correct answer and a timer after the user finishes
- View the statistics (finished within x seconds and with y guesses left)
- Show the recommendations correctly
- Make it "daily"
"""

pool = redis.connection.BlockingConnectionPool.from_url(
    os.environ.get("REDIS_URL"))
app = Flask(__name__)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="redis://",
    storage_options={"connection_pool": pool},
    strategy="fixed-window"
)
app.secret_key = os.environ.get("SECRET_KEY")
tz = pytz.timezone("Egypt")


connection_pool = create_connection(os.environ.get("POSTGRES_HOST"), os.environ.get("POSTGRES_DATABASE"),
                                    os.environ.get("POSTGRES_USER"), os.environ.get("POSTGRES_PASSWORD"))


default = {
    "cover": "https://i.imgur.com/1WWcfWL.jpeg",
    "answer": "Blonde",
    "album": "https://music.apple.com/us/album/blonde/1146195596"
}
cache = {
    "date": None,
    "cover_src": default["cover"],
    "answer": default["answer"],
    "puzzles": [],
    "album_url": default["album"]
}


def update_cache():
    current_time = datetime.now(tz).strftime("%Y-%m-%d")
    result = load_puzzles_last(current_time)
    if result is not None:
        answer = result[0]
        cover_src = result[1]
        album_url = result[2]
    else:
        # Default cover source if no matching row found
        answer = default["answer"]
        cover_src = default["cover"]
        album_url = default["album"]

    cache["date"] = current_time
    cache["cover_src"] = cover_src
    cache["answer"] = answer
    cache["album_url"] = album_url
    cache["puzzles"] = load_puzzles()


def load_puzzles():
    conn = get_connection(connection_pool)
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT id, date, answer, cover_url FROM puzzles ORDER BY date DESC")
        rows = cursor.fetchall()

    puzzles = []
    for row in rows:
        puzzle = {
            'id': row[0],
            'date': row[1],
            'answer': row[2],
            'cover_url': row[3]
        }
        puzzles.append(puzzle)

    release_connection(connection_pool, conn)
    return puzzles


def save_puzzle(date, answer, cover_url, album_url):
    if not cover_url:
        res = requests.get(
            f"https://itunes.apple.com/search?term={urllib.parse.quote(answer)}&country=US&media=music&entity=album&limit=1")
        data = res.json()

        if data["resultCount"] > 0:
            result = data["results"][0]
            cover_url = result["artworkUrl100"].replace("100x100", "1000x1000")
        else:
            cover_url = default["cover"]
            album_url = default["album"]
            answer = default["answer"]

    conn = get_connection(connection_pool)

    with conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO puzzles (date, answer, cover_url, album_url) VALUES (%s, %s, %s, %s)", (date, answer, cover_url, album_url))
        conn.commit()
    release_connection(connection_pool, conn)


def delete_puzzle(id):
    conn = get_connection(connection_pool)
    with conn.cursor() as cursor:
        cursor.execute(
            "DELETE FROM puzzles WHERE id = %s",
            (id,)
        )
        conn.commit()

    release_connection(connection_pool, conn)


def load_puzzles_last(time):
    conn = get_connection(connection_pool)
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT answer, cover_url, album_url FROM puzzles WHERE date <= %s ORDER BY date DESC LIMIT 1", (time,))
        last = cursor.fetchone()

    release_connection(connection_pool, conn)
    return last


def save_email(name, email, message, time):
    conn = get_connection(connection_pool)
    with conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO emails (subject, email, content, date, is_read) VALUES (%s, %s, %s, %s, %s)", (name, email, message, time, False, ))
        conn.commit()
    release_connection(connection_pool, conn)


def load_emails():
    conn = get_connection(connection_pool)
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT subject, content, date, is_read FROM emails ORDER BY date DESC")
        emails = cursor.fetchall()

    release_connection(connection_pool, conn)
    return emails


def time_until_midnight():
    now = datetime.now(tz)
    tomorrow = now + timedelta(days=1)
    midnight = tz.localize(datetime(
        year=tomorrow.year, month=tomorrow.month, day=tomorrow.day, hour=0, minute=0, second=0))
    time_left = midnight - now
    return time_left.seconds


@app.route('/')
def home():
    current_time = datetime.now(tz).strftime("%Y-%m-%d")
    if cache["date"] != current_time:
        update_cache()

    cover_src = cache["cover_src"]
    answer = cache["answer"]
    album_url = cache["album_url"]
    print(album_url)
    return render_template('index.html', cover_src=cover_src, answer=answer, puzzles=album_list, album_url=album_url, timeLeft=time_until_midnight(), current_date=current_time)


@app.route('/remove', methods=['POST'])
def remove():
    data = request.get_json()
    delete_puzzle(data["id"])
    update_cache()
    response = {'message': 'Item removed successfully'}
    return jsonify(response)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'logged_in' in session:
        return redirect(url_for('control_panel'))

    if request.method == 'POST':
        if request.form['password'] == os.environ.get("ADMIN_PASSWORD"):
            session['logged_in'] = True
            next_page = session.get('next_page', url_for('control_panel'))
            session.pop('next_page', None)
            return redirect(next_page)
        else:
            return 'Invalid password', 401

    return '''
        <form method="post">
            <input type="password" name="password" placeholder="Password">
            <input type="submit" value="Login">
        </form>
    '''


@app.route('/control_panel', methods=['GET', 'POST'])
def control_panel():
    if 'logged_in' not in session or not session['logged_in']:
        session['next_page'] = request.url
        return redirect(url_for('login'))

    if not cache["puzzles"]:
        update_cache()

    if request.method == 'POST':
        date = request.form['date']
        answer = request.form['answer']
        cover_url = request.form['cover-url']
        album_url = request.form['album-url']

        try:
            save_puzzle(date, answer, cover_url, album_url)
            update_cache()
        except UniqueViolation:
            return 'Duplicate date', 400

        return redirect(url_for('control_panel'))

    queued_puzzles = cache["puzzles"]
    return render_template('control_panel.html', queued_puzzles=queued_puzzles)


@app.errorhandler(429)
def rate_limit_exceeded(e):
    return '''<h1>You can send only 3 emails per day</h1><h2>Come back tommorrow</h2>''', 429


@app.route('/contact', methods=['POST'])
@limiter.limit("3/day")
def contact():
    name = request.form['name']
    email = request.form['email']
    message = request.form['message']
    time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    save_email(name, email, message, time)
    return '<h1>Email sent!</h1>'


@app.route('/emails', methods=['GET'])
def emails():
    if 'logged_in' not in session or not session['logged_in']:
        session['next_page'] = request.url
        return redirect(url_for('login'))

    emails = load_emails()
    return render_template("email.html", emails=emails)


""" API
def get_autocomplete_suggestions(search_term):
    suggestions = ["blond", "blonde", "bloray", "blorax"]
    matching_suggestions = [suggestion for suggestion in suggestions if search_term.lower() in suggestion.lower()]
    return matching_suggestions


@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    search_term = request.args.get('term')  # Get the search term from the query parameter
    suggestions = get_autocomplete_suggestions(search_term)
    return suggestions
"""
