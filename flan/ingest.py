#!/usr/bin/env python
from services import log, app
from db import sql, transaction

def main():
    with app.app_context():
        try:
            ingest_recipes()
        except:
            pass

        try:
            ingest_ingredients()
        except:
            pass

def format_recipe_name(name):
    return name.replace("_", " ").title()

@transaction
def ingest_recipes():
    recipes = list(map(lambda s: s.strip().split(","), open("recipes.csv").readlines()[1:]))
    for r in recipes:
        r[0] = format_recipe_name(r[0])

    names = ",".join(f"('{format_recipe_name(n)}')" for n in set(r[0] for r in recipes))
    sql(f"insert into recipes(name) values {names}")
    ids = { i[1]: i[0] for i in sql("select id, name from recipes") }
    tags = ",".join(f"({ids[r[0]]},'{r[1]}')" for r in recipes)
    sql(f"insert into recipe_tags(recipe_id, value) values {tags}")


def ingest_ingredients():
    pass

if __name__ == "__main__":
    main()