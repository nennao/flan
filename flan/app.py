#!/usr/bin/env python
import os
from datetime import datetime, timedelta

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
    # create a new plan


    user_id = 1 ## james
    begin_date = datetime.now()
    end_date = begin_date + timedelta(days=3)
    id = sql("insert into plans(draft, begin_date, end_date, user_id) values(%s, %s, %s, %s) returning id", (True, begin_date, end_date, user_id))
    ## TODO: insert plan elements
    log.info(f"New plan: id {id[0][0]}")

    return jsonify({"id": id})


if __name__ == '__main__':
        app.run(debug=True)
