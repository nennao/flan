#!/usr/bin/env python
from flask import Flask, send_from_directory, redirect, request
from functools import wraps
import logging
import psycopg2

app = Flask(__name__)
db = psycopg2.connect(dbname="flan", user="svc-flan-api", password="a6d0ff99cfb8637f6a07a7d12e914b32")
logging.basicConfig(format="%(asctime) %(name) %(levelname): %(message)")
log = logging.getLogger("flan-api")
log.setLevel(logging.INFO)


# database stuff
def transaction(fn):
    @functools.wraps(fn)
    def wrapper(*a, **k):
        try:
            fn(*a, **k):
            log.info("Committing transaction")
            db.commit()
        except:
            log.info("Rolling back transaction")
            db.rollback()
    return wrapper


def sql(query, args):
    with db.cursor() as cursor:
        cursor.execute(query, args)
        try:
            return cursor.fetch_all()

VIEWS = ('home', 'planner')  # TODO any reason why doing this is wrong?


@app.route("/")
def index():
    return redirect("/app/home")


@app.route('/app/<path:path>')
def web_root(path):
    path = 'index.html' if path in VIEWS else path
    return send_from_directory("web", path)


@app.route("/api/")
@transaction(db)
def api():
    return str(sql("select * from recipes"))


if __name__ == '__main__':
    app.run(debug=True)
