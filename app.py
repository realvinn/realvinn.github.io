from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import csv
import os

app = Flask(__name__)
CORS(app)  # Enable CORS to allow cross-origin requests

def load_songs():
    songs = []
    csv_file_path = os.path.join(os.path.dirname(__file__), 'songs.csv')
    with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if len(row) >= 3:
                songs.append({"song_number": row[0], "title": row[1], "artist": row[2]})
    return songs

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/songs')
def get_songs():
    return jsonify(load_songs())

if __name__ == '__main__':
    app.run(debug=True)