from flask import Flask, render_template, request, jsonify, redirect, url_for, abort, session
from datetime import datetime
from util.DButil import create_connection, get_connection, release_connection
import os
# https://itunes.apple.com/search?term={album_name}&country=US&media=music&entity=album&limit=1

"""
TODO 
+ Save cookies till the next day to prevent players from replaying the same day
+ Make the info button work
+ Make the contact button send an email to me
+ Confirm that you want to know the correct answer
"""

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")


connection_pool = create_connection(os.environ.get("POSTGRES_HOST"), os.environ.get("POSTGRES_DATABASE"),
                                    os.environ.get("POSTGRES_USER"), os.environ.get("POSTGRES_PASSWORD"))


def load_puzzles():
    conn = get_connection(connection_pool)
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, date, answer FROM puzzles")
        rows = cursor.fetchall()

    puzzles = []
    for row in rows:
        puzzle = {
            'id': row[0],
            'date': row[1],
            'answer': row[2]
        }
        puzzles.append(puzzle)

    release_connection(connection_pool, conn)
    return puzzles


def save_puzzle(puzzle):
    conn = get_connection(connection_pool)
    with conn.cursor() as cursor:
        date = puzzle["date"]
        answer = puzzle["answer"]
        cursor.execute(
            "INSERT INTO puzzles (date, answer) VALUES (%s, %s)", (date, answer))
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
            "SELECT answer FROM puzzles WHERE date <= %s ORDER BY date DESC LIMIT 1", (time,))
        last = cursor.fetchone()

    release_connection(connection_pool, conn)
    return last


@app.route('/')
def home():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    result = load_puzzles_last(current_time)
    print(result)
    if result is not None:
        answer = result[0]
        cover_src = f"static/{answer}.img"
    else:
        # Default cover source if no matching row found
        cover_src = "static/default.img"
    return render_template('index.html', cover_src="https://i.imgur.com/1WWcfWL.jpeg")


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
    now = datetime.now()
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
    response = {'message': 'Item removed successfully'}
    return jsonify(response)


@app.route('/control_panel_login', methods=['GET', 'POST'])
def control_panel_login():
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
        return redirect(url_for('control_panel_login'))

    queued_puzzles = load_puzzles()
    if request.method == 'POST':
        date_and_time = request.form['date']
        answer = request.form['answer']
        puzzle = {
            'date': date_and_time,
            'answer': answer
        }
        save_puzzle(puzzle)

        return redirect(url_for('control_panel'))

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
