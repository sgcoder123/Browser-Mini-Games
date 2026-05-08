from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='.', static_url_path='')


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:filename>')
def serve_file(filename):
    if os.path.exists(filename):
        return send_from_directory('.', filename)
    return send_from_directory('.', 'index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)