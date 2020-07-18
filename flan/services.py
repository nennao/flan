from flask import Flask
import logging

app = Flask("flan")
logging.basicConfig(format="%(asctime)s %(name)s %(levelname)s: %(message)s")
log = logging.getLogger("flan-api")
log.setLevel(logging.WARNING)