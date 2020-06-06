#!/usr/bin/env python
from flask import Flask, send_from_directory, redirect, request, g, jsonify
from functools import wraps
import logging
import psycopg2

app = Flask(__name__)
logging.basicConfig(format="%(asctime)s %(name)s %(levelname)s: %(message)s")
log = logging.getLogger("flan-api")
log.setLevel(logging.INFO)


# database stuff
def connect_db():
    return psycopg2.connect(
        host="localhost",
        port="5433",
        dbname="flan",
        user="svc-flan-api",
        password="a6d0ff99cfb8637f6a07a7d12e914b32"
    )

def db():
    if not hasattr(g, "db"):
        log.info("Opened new DB connection")
        g.db = connect_db()
    return g.db

@app.teardown_appcontext
def close_db(exc):
    if hasattr(g, "db"):
        g.db.close()

def transaction(fn):
    @wraps(fn)
    def wrapper(*a, **k):
        try:
            retval = fn(*a, **k)
            log.info("Committing transaction")
            db().commit()
            return retval
        except:
            log.exception("Rolling back transaction")
            db().rollback()
            raise
    return wrapper


def sql(query, args=()):
    with db().cursor() as cursor:
        cursor.execute(query, args)
        return cursor.fetchall()

# frontend
@app.route("/")
def index():
    return redirect("/app/home")

@app.route('/app/<path:path>')
def web_root(path):
    VIEWS = ("home", "planner")
    path = 'index.html' if path in VIEWS else path
    return send_from_directory("web", path)


@app.route("/api/")
@transaction
def api():
    return str(sql("select * from recipes"))

@app.route("/api/generatePlan/", methods=["POST"])
@transaction
def generate_plan():
    log.info(request.json)
    return jsonify({ "message": "thanks m8", "original": request.json })


if __name__ == '__main__':
    app.run(debug=True)
