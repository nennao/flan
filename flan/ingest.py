#!/usr/bin/env python
import os
import json

from services import log, app
from db import sql, transaction

def main():
    with app.app_context(), transaction():
        # ingest_recipes()
        ingest_ingredients()
    # ingest_nutritionix()

def format_recipe_name(name):
    return name.replace("_", " ").title()

def format_food_name(name):
    return name.replace("_", " ").title()

def ingest_recipes():
    # read recipes
    recipes = list(map(lambda s: s.strip().split(","), open("data/recipes.csv").readlines()[1:]))
    for r in recipes:
        r[0] = format_recipe_name(r[0])
    
    # insert recipes
    names = ",".join(f"('{n}')" for n in set(r[0] for r in recipes))
    sql(f"insert into recipes(name) values {names}")

    # insert tags
    ids = { i[1]: i[0] for i in sql("select id, name from recipes") }
    tags = ",".join(f"({ids[r[0]]},'{r[1]}')" for r in recipes)
    sql(f"insert into recipe_tags(recipe_id, value) values {tags}")

def ingest_ingredients():
    # read ingredients
    ingr = list(map(lambda s: s.strip().split(","), open("data/ingredients.csv").readlines()[1:]))
    for i in ingr:
        i[0] = format_recipe_name(i[0])
        i[1] = format_food_name(i[1])
    
    # process some units
    units = set(i[2] for i in ingr)
    postfix = set("#")
    for u in units:
        try:
            postfix_start = u.index(next(_ for _ in u if not (_ == "." or _.isdigit())))
            postfix.add(u[postfix_start:])
            # amount = u[:postfix_start]
            # print(amount)
        except StopIteration:
            continue

    print(postfix)
    
    return
    
    # insert foods
    food_names = ",".join(f"('{n}')" for n in set(i[1] for i in ingr))
    sql(f"insert into foods(name) values {food_names}")


    # insert ingredients
    recipe_ids = { i[1]: i[0] for i in sql("select id, name from recipes") }
    food_ids = { i[1]: i[0] for i in sql("select id, name from foods") }
    ingredients = ",".join(f"({recipe_ids[i[0]]},{food_ids[i[1]]},'{i[2]}')" for i in ingr)
    sql(f"insert into ingredients(recipe_id, food_id, amount) values {ingredients}")


def ingest_nutritionix():
    for file in os.listdir("data/nutritionix"):
        # check the name matches the food name
        data = json.loads(open("data/nutritionix/"+file).read())
        try:
            food_name = data["foods"][0]["food_name"]
            intended_name = " ".join(s.lower() for s in file.split(".")[0].split())
            if food_name != intended_name:
                raise Exception()
        except:
            pass


if __name__ == "__main__":
    main()