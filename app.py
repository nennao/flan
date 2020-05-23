#!/usr/bin/env python
from flask import Flask, send_from_directory, redirect

app = Flask(__name__)


@app.route("/")
def index():
    return redirect("/app/index.html")


@app.route('/app/<path:path>')
def web_root(path):
    return send_from_directory("web", path)


@app.route("/api/")
def api():
    return "api-response :)"


if __name__ == '__main__':
    app.run()
