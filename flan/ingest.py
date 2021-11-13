#!/usr/bin/env python
import os
import json

from services import log
from db import sql, transaction


def format_recipe_name(name):
    return name.replace("_", " ").title()


def format_food_name(name):
    return name.replace("_", " ").title()


def parse_quantity(quantity):
    try:
        # find the first character in 'quantity' that isn't a digit or a decimal point
        end = next(p[0] for p in enumerate(quantity) if not (p[1] == '.' or p[1].isdigit()))
        unit = quantity[end:].strip()
        amount = float(quantity[:end].strip())
        return unit, amount
    except StopIteration:
        return '#', float(quantity)


def ingest_recipes():
    # read recipes
    recipes = list(map(lambda s: s.strip().split(","), open("data/recipes.csv").readlines()[1:]))
    for r in recipes:
        r[0] = format_recipe_name(r[0])
    
    # insert recipes
    recipes_insert = ",".join(
        f"('{n[0]}', {int(n[1])})" for n in recipes
    )
    sql(f"insert into recipes(name, batch) values {recipes_insert}")

    # insert tags
    recipe_ids = { i[1]: i[0] for i in sql("select id, name from recipes") }
    tags_insert = ",".join(",".join(f"({recipe_ids[r[0]]},'{tag}')" for tag in r[2].split("|")) for r in recipes)

    sql(f"insert into recipe_tags(recipe_id, value) values {tags_insert}")


def ingest_ingredients():
    # read ingredients
    ingr = list(map(lambda s: s.strip().split(","), open("data/ingredients.csv").readlines()[1:]))
    for i in ingr:
        i[0] = format_recipe_name(i[0])
        i[1] = format_food_name(i[1])
    
    # process some units
    all_units = set(i[2].strip() for i in ingr)
    unique_unit = set(parse_quantity(u)[0] for u in all_units)
    
    # insert into units table
    unit_names = ",".join(f"('{u}')" for u in unique_unit)
    sql(f"insert into units(unit) values {unit_names}")
    
    # insert foods
    ingest_foods({i[1] for i in ingr})

    # insert ingredients
    recipe_ids = { i[1]: i[0] for i in sql("select id, name from recipes") }
    food_ids = { i[1]: i[0] for i in sql("select id, name from foods") }
    unit_ids = { i[1]: i[0] for i in sql("select id, unit from units") }
    ingredients_string = []
    for i in ingr:
        recipe_id = recipe_ids[i[0]]
        food_id = food_ids[i[1]]
        unit, amount = parse_quantity(i[2])
        unit_id = unit_ids[unit]
        ingredients_string.append(f"({recipe_id}, {food_id}, {unit_id}, {amount})")
    ingredients_string = ",".join(ingredients_string)
    sql(f"insert into ingredients(recipe_id, food_id, unit_id, amount) values {ingredients_string}")


def ingest_foods(foods):
    foods = sorted(foods)
    root = os.path.join(os.getcwd(), 'data')  # find data folder, assume running from project root  # todo use relative paths?
    with open(os.path.join(root, 'ignore_calories.txt')) as f:
        ignore = {l.strip().lower() for l in f.readlines()}
    files = {f.replace('.json', '').lower(): f for f in os.listdir(os.path.join(root, 'nutritionix')) if f.endswith('.json')}
    food_values = []
    for food in foods:
        food_l = food.lower()
        protein, fat, carbs, fibre = 0, 0, 0, 0
        if (food_l not in ignore) and (food_l in files):
            data = json.loads(open(os.path.join(root, 'nutritionix', files[food_l])).read())
            data = data["foods"][0]
            weight_g = data["serving_weight_grams"]
            protein, fat, carbs, fibre = [100 * (data.get(macro_key, 0) or 0) / weight_g for macro_key in
                                          ["nf_protein", "nf_total_fat", "nf_total_carbohydrate", "nf_dietary_fiber"]]

        food_values.append(f"('{food}',{protein}, {fat}, {carbs}, {fibre})")
    food_values = ",".join(food_values)
    sql(f"insert into foods(name, protein, fat, carbs, fibre) values {food_values}")


# def ingest_nutritionix():
#     for file in os.listdir("data/nutritionix"):
#         # check the name matches the food name
#         data = json.loads(open("data/nutritionix/"+file).read())
#         try:
#             food_name = data["foods"][0]["food_name"]
#             intended_name = " ".join(s.lower() for s in file.split(".")[0].split())
#             if food_name != intended_name:
#                 raise Exception()
#         except:
#             pass


def check_nutritionix():
    path = os.getcwd()[:-5] + '/data/nutritionix/'
    for i, file in enumerate(sorted(f for f in os.listdir(path) if f.endswith('.json'))):
        # check the name matches the food name
        print(i, file)
        try:
            data = json.loads(open(path+file).read())
            if len(data["foods"]) != 1:
                print('WARNING, foods len is', len(data["foods"]))
            food = data["foods"][0]
            food_name = food["food_name"]
            intended_name = " ".join(s.lower() for s in file.split(".")[0].split())
            if food_name != intended_name:
                print('MISMATCH', file, food_name, intended_name)
            weight_g = food["serving_weight_grams"]
            carbs = food["nf_total_carbohydrate"]
            protein = food["nf_protein"]
            fat = food["nf_total_fat"]
            fiber = food["nf_dietary_fiber"]
            print(weight_g, 'g', '  ', 'carbs', carbs, 'protein', protein, 'fat', fat, 'fiber', fiber)
        except Exception as e:
            print('ERROR', e.args)
            break
        print()


def ingest_users():
    sql("insert into users(name) values ('tester')")