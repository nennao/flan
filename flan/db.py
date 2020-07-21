import os
import uuid
import contextlib
from functools import wraps

import psycopg2
from flask import g

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

def transaction(fn=None):
    """
    Decorator if there's an argument
    Otherwise, context manager
    """
    @wraps(fn)
    def decorator(*a, **k):
        try:
            retval = fn(*a, **k)
            log.info("Committing transaction")
            _db().commit()
            return retval
        except:
            log.exception("Rolling back transaction")
            _db().rollback()
            raise
    
    @contextlib.contextmanager
    def context_manager():
        try:
            yield
        except:
            log.exception("Rolling back transaction")
            _db().rollback()
            raise
        else:
            log.info("Committing transaction")
            _db().commit()
    
    if fn is None:
        return context_manager()
    else:
        return decorator


def sql(query, args=()):
    with _db().cursor() as cursor:
        cursor.execute(query, args)
        if cursor.description is not None:
            return cursor.fetchall()
        return None