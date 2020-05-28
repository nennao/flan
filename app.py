#!/usr/bin/env python
from flask import Flask, send_from_directory, redirect

app = Flask(__name__)

VIEWS = ('home', 'planner')  # TODO any reason why doing this is wrong?


@app.route("/")
def index():
    return redirect("/app/home")


@app.route('/app/<path:path>')
def web_root(path):
    path = 'index.html' if path in VIEWS else path
    return send_from_directory("web", path)


@app.route("/api/")
def api():
    return "api-response :)"


if __name__ == '__main__':
    app.run(debug=True)
