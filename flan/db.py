import os
import uuid

import psycopg2
from flask import g
from functools import wraps

from services import app, log


def _connect_db():
    return psycopg2.connect(
        host="localhost",
        port="5433",
        dbname="flan",
        user="svc-flan-api",
        password="a6d0ff99cfb8637f6a07a7d12e914b32"
    )

def _db():
    if not hasattr(g, "db"):
        g.dbid = uuid.uuid4()
        log.info(f"Opened new DB connection: {g.dbid}")
        g.db = _connect_db()
    return g.db

@app.teardown_appcontext
def _close_db(exc):
    if hasattr(g, "db"):
        log.info(f"Closing DB connection: {g.dbid}")
        g.db.close()

def transaction(fn):
    @wraps(fn)
    def wrapper(*a, **k):
        try:
            retval = fn(*a, **k)
            log.info("Committing transaction")
            _db().commit()
            return retval
        except:
            log.exception("Rolling back transaction")
            _db().rollback()
            raise
    return wrapper


def sql(query, args=()):
    with _db().cursor() as cursor:
        cursor.execute(query, args)
        return cursor.fetchall()