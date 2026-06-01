from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import time
from pathlib import Path
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

DATA_DIR = 'data'
UPLOAD_DIR = os.path.join(DATA_DIR, 'uploads')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


def load_json(path, default=None):
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return default
    return default


def save_json(path, value):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(value, f, indent=2)


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route('/api/signup', methods=['POST'])
def signup():
    payload = request.json or {}
    username = payload.get('username', '').strip()
    password = payload.get('password', '').strip()
    if not username or not password:
        return jsonify({'ok': False, 'error': 'Username and password are required.'}), 400

    users = load_json(USERS_FILE, []) or []
    if any(u['username'] == username for u in users):
        return jsonify({'ok': False, 'error': 'This username is already taken.'}), 400

    users.append({'username': username, 'password': password})
    save_json(USERS_FILE, users)
    return jsonify({'ok': True, 'user': {'username': username}, 'token': username})


@app.route('/api/login', methods=['POST'])
def login():
    payload = request.json or {}
    username = payload.get('username', '').strip()
    password = payload.get('password', '').strip()
    if not username or not password:
        return jsonify({'ok': False, 'error': 'Username and password are required.'}), 400

    users = load_json(USERS_FILE, []) or []
    user = next((u for u in users if u['username'] == username and u['password'] == password), None)
    if not user:
        return jsonify({'ok': False, 'error': 'Invalid credentials.'}), 401

    return jsonify({'ok': True, 'user': {'username': username}, 'token': username})


@app.route('/api/upload-photo', methods=['POST'])
def upload_photo():
    if 'photo' not in request.files:
        return jsonify({'ok': False, 'error': 'No file uploaded.'}), 400

    photo = request.files['photo']
    if photo.filename == '':
        return jsonify({'ok': False, 'error': 'No file selected.'}), 400

    filename = f"{int(time.time() * 1000)}_{secure_filename(photo.filename)}"
    save_path = os.path.join(UPLOAD_DIR, filename)
    photo.save(save_path)
    return jsonify({'ok': True, 'url': f'/uploads/{filename}'})


@app.route('/api/save', methods=['POST'])
def save_data():
    data = request.json
    key = data.get('key')
    val = data.get('val')
    if not key or val is None:
        return jsonify({'error': 'Missing key or val'}), 400

    filepath = os.path.join(DATA_DIR, f'{key}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(val, f, indent=2)
    return jsonify({'ok': True})


@app.route('/api/load', methods=['GET'])
def load_data():
    key = request.args.get('key')
    if not key:
        return jsonify({'error': 'Missing key'}), 400

    filepath = os.path.join(DATA_DIR, f'{key}.json')
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify({'data': data})
    except Exception:
        return jsonify({'data': None})


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(port=3001, debug=True)


