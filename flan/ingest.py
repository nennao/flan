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
    unique_units = set(parse_quantity(u)[0] for u in all_units)
    
    # insert into units table
    ingest_units(unique_units)
    
    # insert foods, get measurements
    measurements = ingest_foods({i[1] for i in ingr})

    # insert ingredients
    recipe_ids = { i[1]: i[0] for i in sql("select id, name from recipes") }
    food_ids = { i[1]: i[0] for i in sql("select id, name from foods") }
    unit_ids = { i[1]: (i[0], i[2]) for i in sql("select id, unit, measure from units") }
    ingredients_string = []
    for recipe, food, amt in ingr:
        recipe_id = recipe_ids[recipe]
        food_id = food_ids[food]
        unit, amount = parse_quantity(amt)
        unit_id, unit_measure = unit_ids[unit]
        ingredients_string.append(f"({recipe_id}, {food_id}, {unit_id}, {amount})")

        if unit_measure != 'mass' and not ((food, unit) in measurements or (unit_measure == 'volume' and (food, 'rho') in measurements)):
            assert ((food, unit) in measurements or (unit_measure == 'volume' and (food, 'rho') in measurements)), f"missing - food:{food}, unit:{unit}"

    ingredients_string = ",".join(ingredients_string)
    sql(f"insert into ingredients(recipe_id, food_id, unit_id, amount) values {ingredients_string}")

    # insert measurements
    measures = [f"({food_ids[food]}, {unit_ids[unit][0]}, {grams})" for ((food, unit), grams) in measurements.items()]
    measures_string = ','.join(measures)
    sql(f"insert into measurements(food_id, unit_id, grams) values {measures_string}")


def ingest_units(units):
    masses = {'g'}
    densities = {'rho'}
    volumes = {'ml', 'tbsp', 'tsp', 'cup'}
    items = {'#', 'medium', 'large'}
    units = units | masses | densities | volumes | items
    measure_map = dict(
        **{m: 'mass' for m in masses},
        **{d: 'density' for d in densities},
        **{v: 'volume' for v in volumes},
        **{i: 'unit' for i in items}
    )

    unit_names = ",".join(f"('{u}', '{measure_map.get(u, 'unit')}')" for u in units)
    sql(f"insert into units(unit, measure) values {unit_names}")


def ingest_foods(foods):
    foods = sorted(foods)

    with open('data/ignore_calories.txt') as f:
        ignore = {l.strip().lower() for l in f.readlines()}

    measures = {}
    with open("data/measures.csv") as f:
        for food, unit, api_unit in [l.strip().split(',') for l in f.readlines()[1:]]:
            formatted = api_unit.replace('{comma}', ',').replace('{quote}', '"')
            if food in measures:
                measures[food].append((unit, formatted))
            else:
                measures[food] = [(unit, formatted)]

    files = {f.replace('.json', '').lower(): f for f in os.listdir('data/nutritionix') if f.endswith('.json')}

    food_values = []
    measurements = {}

    for food in foods:
        food_l = food.lower()
        protein, fat, carbs, fibre = 0, 0, 0, 0
        if food_l in files:
            data = json.loads(open(f'data/nutritionix/{files[food_l]}').read())
            data = data["foods"][0]
            if food_l in measures:
                _add_food_to_measurements(food, measurements, measures[food_l], data['alt_measures'])
            if food_l not in ignore:
                weight_g = data["serving_weight_grams"]
                protein, fat, carbs, fibre = [100 * (data.get(macro_key, 0) or 0) / weight_g for macro_key in
                                              ["nf_protein", "nf_total_fat", "nf_total_carbohydrate", "nf_dietary_fiber"]]

        food_values.append(f"('{food}',{protein}, {fat}, {carbs}, {fibre})")
    food_values = ",".join(food_values)
    sql(f"insert into foods(name, protein, fat, carbs, fibre) values {food_values}")
    return measurements


def _add_food_to_measurements(food, measurements, measure, alt_measures):
    vol_ml_map = {'ml': 1, 'tbsp': 15, 'tsp': 5, 'cup': 240}  # todo need 'official' conversion tables?

    res = {}
    for unit, api_unit in measure:
        key = 'rho' if (unit == 'rho' and api_unit in vol_ml_map) else api_unit
        if key not in res:
            for alt in alt_measures:
                if alt['measure'] == api_unit and alt['qty'] == 1:
                    res[key] = alt['serving_weight'] / (vol_ml_map[api_unit] if key == 'rho' else 1)
                    break
        measurements[(food, unit)] = res[key]


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