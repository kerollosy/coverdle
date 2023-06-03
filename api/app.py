from flask import Flask, render_template, request, jsonify, redirect, url_for, abort, session
import requests
import urllib.parse
from datetime import datetime
from util.DButil import create_connection, get_connection, release_connection
from util.puzzleUtil import album_list
import os
from psycopg2.errors import UniqueViolation
import pytz

"""
TODO 
+ Save cookies till the next day to prevent players from replaying the same day
+ Make the contact button send an email to me
+ Confirm that you want to know the correct answer when clicking on the idk button
+ Make the alerts() popups
+ View the correct answer and a timer after the user finishes
+ View the statistics (finished within x seconds and with y guesses left)
- Show the recommendations correctly
- Make it "daily"
"""

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")
tz = pytz.timezone("Egypt")


connection_pool = create_connection(os.environ.get("POSTGRES_HOST"), os.environ.get("POSTGRES_DATABASE"),
                                    os.environ.get("POSTGRES_USER"), os.environ.get("POSTGRES_PASSWORD"))


default = {"cover": "https://i.imgur.com/1WWcfWL.jpeg", "answer": "blond"}
cache = {"date": None,
         "cover_src": default["cover"], "answer": default["answer"], "puzzles": []}


def update_cache():
    current_time = datetime.now(tz).strftime("%Y-%m-%d")
    result = load_puzzles_last(current_time)
    if result is not None:
        answer = result[0]
        cover_src = result[1]
    else:
        # Default cover source if no matching row found
        cover_src = default["cover"]
        answer = default["answer"]

    cache["date"] = current_time
    cache["cover_src"] = cover_src
    cache["answer"] = answer
    cache["puzzles"] = load_puzzles()


def load_puzzles():
    conn = get_connection(connection_pool)
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT id, date, answer, url FROM puzzles ORDER BY date ASC")
        rows = cursor.fetchall()

    puzzles = []
    for row in rows:
        puzzle = {
            'id': row[0],
            'date': row[1],
            'answer': row[2],
            'url': row[3]
        }
        puzzles.append(puzzle)

    release_connection(connection_pool, conn)
    return puzzles


def save_puzzle(date, answer, url):
    if not url:
        res = requests.get(
            f"https://itunes.apple.com/search?term={urllib.parse.quote(answer)}&country=US&media=music&entity=album&limit=1")
        data = res.json()

        if data["resultCount"] > 0:
            result = data["results"][0]
            url = result["artworkUrl100"].replace("100x100", "1000x1000")
        else:
            url = default["cover"]

    conn = get_connection(connection_pool)

    with conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO puzzles (date, answer, url) VALUES (%s, %s, %s)", (date, answer, url))
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
            "SELECT answer, url FROM puzzles WHERE date <= %s ORDER BY date DESC LIMIT 1", (time,))
        last = cursor.fetchone()

    release_connection(connection_pool, conn)
    return last


@app.route('/')
def home():
    current_time = datetime.now(tz).strftime("%Y-%m-%d")
    if cache["date"] != current_time:
        update_cache()

    cover_src = cache["cover_src"]
    answer = cache["answer"].title()

    print(cover_src)
    print(datetime.now(tz))
    return render_template('index.html', cover_src=cover_src, answer=answer, puzzles=album_list)


def authenticate(username, password):
    if username == "admin" and password == "password":
        return True
    return False


def authenticate_required(f):
    def decorated_function(*args, **kwargs):
        auth = request.authorization
        # Check if the request is coming from the server IP address
        if request.remote_addr == '127.0.0.1' or request.remote_addr == 'localhost':
            return f(*args, **kwargs)  # Allow access without authentication
        if not auth or not authenticate(auth.username, auth.password):
            abort(401)  # Unauthorized
        return f(*args, **kwargs)
    return decorated_function


def get_remaining_time(year, month, day, hour, minute):
    now = datetime.now(tz)
    target_date = datetime(year, month, day, hour, minute)
    remaining_time = target_date - now
    # Ensure the remaining time is not negative
    return max(remaining_time.total_seconds(), 0)


# Endpoint to get the remaining time
@app.route('/remaining_time')
@authenticate_required
def remaining_time():
    return jsonify({'time': int(get_remaining_time(2023, 5, 26, 8+12, 51))})


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
        if request.form['password'] == os.environ.get("CONTROL_PANEL_PASSWORD"):
            session['logged_in'] = True
            return redirect(url_for('control_panel'))
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
        return redirect(url_for('login'))

    if not cache["puzzles"]:
        update_cache()

    if request.method == 'POST':
        date = request.form['date']
        answer = request.form['answer']
        url = request.form['link']

        try:
            save_puzzle(date, answer, url)
            update_cache()
        except UniqueViolation:
            return 'Duplicate date', 400

        return redirect(url_for('control_panel'))

    queued_puzzles = cache["puzzles"]
    return render_template('control_panel.html', queued_puzzles=queued_puzzles)


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
