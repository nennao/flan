#!/usr/bin/env python
import os
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
                "name": "ramsled eggs",
                "calories": 300,
                "macros": {"carbs": 5, "fat": 35, "protein": 60}
            }, {
                "type": "dinner",
                "name": "guacamole",
                "calories": 150,
                "macros": {"carbs": 5, "fat": 15, "protein": 80}
            }]
        }
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
            sql("insert into plan_elements(date, type, plan_type, plan_id, recipe_id) values(%s, %s, %s, %s, %s)", (
                date, etype, plantype, plan_id, recipe_id))

    # TODO: return the newly created plan
    return "", 204


# @app.route("/api/deletePlan/<int:id>", methods=["POST"])
# @transaction
# def delete_plan():
#     pass


@app.route("/api/getPlans/", methods=["GET"])
@transaction
def get_plans():
    user_id = 1
    plan_data = sql("""select
            p.id,
            p.begin_date,
            p.end_date,
            e.date,
            e.id,
            e.plan_type,
            e.type,
            r.name,
            f.calories,
            f.fat,
            f.protein,
            f.carbs

        from
            plans p
            join plan_elements e on p.id = e.plan_id
            join recipes r on r.id = e.recipe_id
            join ingredients i on r.id = i.recipe_id
            join foods f on f.id = i.food_id

        where
            p.user_id = %s

        order by p.id, e.date, e.id
    """, (user_id,))

    plans = []
    if len(plan_data):
        def new_element(p):
            return {
                "id": p[4],
                "type": p[6],
                "name": p[7],
                "calories": 0.0,
                "macros": {
                    "fat": 0.0,
                    "protein": 0.0,
                    "carbs": 0.0
                }
            }
        
        def new_day(p):
            return {
                "date": p[3].strftime(DATE_FORMAT),
                "planType": p[5],
                "elements": []
            }

        def new_plan(p):
            return {
                "id": p[0],
                "startDate": p[1].strftime(DATE_FORMAT),
                "endDate": p[2].strftime(DATE_FORMAT),
                "days": []
            }
        
        current_plan = new_plan(plan_data[0])
        current_day = new_day(plan_data[0])
        current_element = new_element(plan_data[0])

        for p in plan_data:
            if p[4] != current_element["id"]: # new element
                current_day["elements"].append(current_element)
                current_element = new_element(p)
            
            elif p[3].strftime(DATE_FORMAT) != current_day["date"]: # new date + new element
                current_day["elements"].append(current_element)
                current_plan["days"].append(current_day)
                current_element = new_element(p)
                current_day = new_day(p)
            
            elif p[0] != current_plan["id"]: # new plan + new date + new element
                current_day["elements"].append(current_element)
                current_plan["days"].append(current_day)
                plans.append(current_plan)
                current_element = new_element(p)
                current_day = new_day(p)
                current_plan = new_plan(p)

            current_element["calories"] += p[8]
            current_element["macros"]["fat"] += p[9]
            current_element["macros"]["protein"] += p[10]
            current_element["macros"]["carbs"] += p[11]

        current_day["elements"].append(current_element)
        current_plan["days"].append(current_day)
        plans.append(current_plan)

    return jsonify({
        "userId": user_id,
        "plans": plans
    })


@app.route("/api/generatePlan/", methods=["POST"])
@transaction
def generate_plan():
    # create a new plan
    # user_id = 1 ## james
    # begin_date = datetime.now()
    # end_date = begin_date + timedelta(days=3)
    # id = sql("insert into plans(draft, begin_date, end_date, user_id) values(%s, %s, %s, %s) returning id", (True, begin_date, end_date, user_id))
    # ## TODO: insert plan elements
    # log.info(f"New plan: id {id[0][0]}")
    # return jsonify({"id": id})

    return jsonify(dummy_plan)


if __name__ == '__main__':
    app.run()
