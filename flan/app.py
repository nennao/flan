#!/usr/bin/env python
import os

from flask import send_from_directory, redirect, request, jsonify

from services import app, log
from db import sql, transaction


# frontend
@app.route("/")
def index():
    return redirect("/app/home")

@app.route('/app/<path:path>')
def web_root(path):
    VIEWS = ("home", "planner")
    path = 'index.html' if path in VIEWS else path
    return send_from_directory("web", path)


# backend
@app.route("/api/")
@transaction
def api():
    return str(sql("select * from recipes"))

@app.route("/api/generatePlan/", methods=["POST"])
@transaction
def generate_plan():
    log.info(request.json)
    return jsonify({ "message": "thanks m8", "original": { "hello": "world" } })


if __name__ == '__main__':
        app.run(debug=True)
