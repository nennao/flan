#!/usr/bin/env python
import os
import random
from datetime import datetime, timedelta

from flask import send_from_directory, redirect, request, jsonify

from services import app, log
from db import sql, transaction


DATE_FORMAT = "%Y-%m-%d"


dummy_plan = {
    "startDate": "2020-06-08",
    "endDate": "2020-06-14",
    "days": [
        {
            "date": "2020-06-08",
            "planType": "low carb",
            "elements": [{
                "type": "lunch",
                "name": "Ramsled",
                "calories": 300,
                "macros": {"carbs": 5, "fat": 35, "protein": 60}
            }, {
                "type": "dinner",
                "name": "Spag Bol",
                "calories": 150,
                "macros": {"carbs": 5, "fat": 15, "protein": 80}
            }]
        }
    ]
}


def get_dummy_plan(data):
    meal_map = {
        'breakfast': ['Ramsled', 'Oaternights', 'Avocado Toast', 'Eggs Woodhouse', 'Eggs Benedict', 'Eggs Royale',
                      'Smoothie', 'Fluffy Pancakes', 'Crepes', 'Scones'],
        'lunch': ['Jollof Rice', 'Stuffed Jacket Potato', 'Lemony Salmon', 'Grilled Cheese', 'Bagel', 'Mega Sandwich',
                  'Crepes', 'Calzodilla', 'Caesar Salad', 'Burrito', 'Salad'],
        'dinner': ['Stir Fry', 'Pad Thai', 'Eggs Okoye', 'Jollof Rice', 'Pepper Soup', 'Jambalaya', 'Bacony Pasta',
                   'Spag Bol', 'Lettuce Curry Boats', 'Ramen', 'Rice Bowls', 'Stuffed Jacket Potato', 'Lemony Salmon',
                   'Popcorn Chicken', 'Nachos', 'Creamy Linguine', 'Mexican Grilled Chicken', 'Caesar Salad',
                   'Duck Confit', 'Burrito', 'Thai Red Curry', 'Pork Apple Burger', 'Sweet Chilli Beef',
                   'Sweet Potato Dal', 'Mexican Beef', 'Sirloin Steak', 'Sea Bream', 'Honey Soy Duck', 'Paella',
                   'Tandoori Rice', 'Hoisin Pork', 'Chicken Satay Skewers', 'Salad'],
    }
    return {
        "startDate": data["startDate"],
        "endDate": data["endDate"],
        "days": [
            {
                "date": d["date"],
                "planType": d["planType"],
                "elements": [
                    {
                        "type": m,
                        "name": random.choice(meal_map[m]),
                        "calories": 100,
                        "macros": {"carbs": 35, "fat": 35, "protein": 30}
                    } for m in ['breakfast', 'lunch', 'dinner']
                ],
            } for d in data["days"]
        ]
    }


# frontend
@app.route("/")
def index():
    return redirect("/app/home")

@app.route('/app/<path:path>')
def web_root(path):
    VIEWS = ("home", "planner")
    path = 'index.html' if path in VIEWS else path
    return send_from_directory(os.path.join(os.getcwd(), "web"), path)


# backend
@app.route("/api/savePlan/", methods=["POST"])
@transaction
def save_plan():
    plan = request.json

    user_id = 1
    start_date = datetime.strptime(plan["startDate"], DATE_FORMAT)
    end_date = datetime.strptime(plan["endDate"], DATE_FORMAT)
    # TODO: check for colliding plans

    # insert the new plan
    plan_id = sql("insert into plans(begin_date, end_date, user_id) values(%s, %s, %s) returning id", (start_date, end_date, user_id))[0][0]

    # insert plan elements
    for day in plan["days"]:
        date = datetime.strptime(day["date"], DATE_FORMAT)
        plantype = day["planType"]
        for element in day["elements"]:
            # type, name, calories, macros { protein, fat, carbs }
            etype = element["type"]
            recipe_name = element["name"]
            
            # look up the recipe?
            recipe_id = sql("select id from recipes where name = %s", (recipe_name,))[0][0]

            # insert the new element
            sql("insert into plan_elements(el_date, el_type, plan_type, plan_id, recipe_id) values(%s, %s, %s, %s, %s)", (
                date, etype, plantype, plan_id, recipe_id))

    new_plan = _get_plans(user_id, (plan_id,))[0]
    return jsonify(new_plan)


# @app.route("/api/deletePlan/<int:id>", methods=["POST"])
# @transaction
# def delete_plan():
#     pass


def _get_plans(user_id, plan_ids=None):
    rho = sql("select id from units where unit = 'rho'")[0][0]
    plan_id_cond = f"""and p.id in ({', '.join(map(str, plan_ids))})""" if plan_ids else ""
    fields = (
        'p.id',
        'p.begin_date',
        'p.end_date',
        'e.el_date',
        'e.id',
        'e.plan_type',
        'e.el_type',
        'r.name',
        'r.batch',
        'f.name',
        'i.amount',
        'u.unit',
        'u.measure',
        'm.grams',
        'f.fat',
        'f.protein',
        'f.carbs'
    )
    plan_data = sql(f"""
        select {', '.join(fields)} from plans p
            join plan_elements e on p.id = e.plan_id
            join recipes r on r.id = e.recipe_id
            join ingredients i on r.id = i.recipe_id
            join foods f on f.id = i.food_id
            join units u on u.id = i.unit_id
            full join measurements m on ((m.food_id = f.id) and 
                                        ((m.unit_id = u.id) or ((u.measure = 'volume') and (m.unit_id = {rho}))))

        where
            p.user_id = {user_id} 
            {plan_id_cond}

        order by p.id, e.el_date, e.id
    """)

    # print()
    # print('plan_data')
    # print_data = [fields] + [tuple(str(s) for s in d) for d in plan_data]
    # print(tabulate(print_data))
    # print()

    plans = []
    if len(plan_data):

        def _adjust_macros(p):
            vol_ml_map = {'ml': 1, 'tbsp': 15, 'tsp': 5, 'cup': 240}  # todo need 'official' conversion tables?

            if p['u.unit'] == 'g':
                grams = p['i.amount']
            elif p['u.measure'] == 'volume':
                grams = vol_ml_map[p['u.unit']] * p['i.amount'] * p['m.grams']
            elif p['u.measure'] == 'unit':
                grams = p['i.amount'] * p['m.grams']
            else:
                raise Exception('cant handle unit')

            grams /= p['r.batch']

            return tuple(m*grams/100 for m in [p['f.fat'], p['f.protein'], p['f.carbs']])

        def new_element(p):
            return {
                "id": p['e.id'],
                "type": p['e.el_type'],
                "name": p['r.name'],
                "calories": 0.0,
                "macros": {
                    "fat": 0.0,
                    "protein": 0.0,
                    "carbs": 0.0
                }
            }

        def new_day(p):
            return {
                "date": p['e.el_date'].strftime(DATE_FORMAT),
                "planType": p['e.plan_type'],
                "elements": []
            }

        def new_plan(p):
            return {
                "id": p['p.id'],
                "startDate": p['p.begin_date'].strftime(DATE_FORMAT),
                "endDate": p['p.end_date'].strftime(DATE_FORMAT),
                "days": []
            }

        p = dict(zip(fields, plan_data[0]))
        current_plan = new_plan(p)
        current_day = new_day(p)
        current_element = new_element(p)

        for p in plan_data:
            p = dict(zip(fields, p))
            if p['p.id'] != current_plan["id"]:  # new plan + new date + new element
                current_day["elements"].append(current_element)
                current_plan["days"].append(current_day)
                plans.append(current_plan)
                current_element = new_element(p)
                current_day = new_day(p)
                current_plan = new_plan(p)

            elif p['e.el_date'].strftime(DATE_FORMAT) != current_day["date"]:  # new date + new element
                current_day["elements"].append(current_element)
                current_plan["days"].append(current_day)
                current_element = new_element(p)
                current_day = new_day(p)

            elif p['e.id'] != current_element["id"]:  # new element
                current_day["elements"].append(current_element)
                current_element = new_element(p)

            fat, protein, carbs = _adjust_macros(p)
            current_element["calories"] += 9*fat + 4*protein + 4*carbs
            current_element["macros"]["fat"] += fat  # these macros are in g
            current_element["macros"]["protein"] += protein
            current_element["macros"]["carbs"] += carbs

        current_day["elements"].append(current_element)
        current_plan["days"].append(current_day)
        plans.append(current_plan)

    return plans

@app.route("/api/getPlans/", methods=["GET"])
@transaction
def get_plans():
    user_id = 1
    plans = _get_plans(user_id)
    return jsonify({
        "userId": user_id,
        "plans": plans
    })


@app.route("/api/generatePlan/", methods=["POST"])
@transaction
def generate_plan():
    data = request.json
    return jsonify(get_dummy_plan(data))


def tabulate(table):
    # table = [(t[0],) + t[3:] for t in table]
    zipped = list(zip(*table))
    lens = [1 + max(*(len(d) for d in z)) for z in zipped]
    header = '|'.join(t.rjust(lens[i]) for i, t in enumerate(table[0]))
    divider = '|'.join(''.rjust(lens[i], '-') for i, t in enumerate(table[0]))
    body = ['|'.join(t.rjust(lens[i]) for i, t in enumerate(row)) for row in table[1:]]
    return '\n'.join([header, divider] + body)


if __name__ == '__main__':
    app.run()
