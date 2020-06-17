#!/usr/bin/env python
import os
from datetime import datetime, timedelta

from flask import send_from_directory, redirect, request, jsonify

from services import app, log
from db import sql, transaction



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
                    # "calories": 300,
                    # "macros": {"carbs": 5, "fat": 35, "protein": 60},
                    "qty": 1,
                    "unit": "serving",
                    "ingredients": [{
                        "name": "eggs",
                        "qty": 2,
                        "basis": {
                            "qty": 1,
                            "unit": None,
                            "calories": 80,  # TODO is calories necessary? can be calc'd from macros
                            "macros": {"carbs": 1, "fat": 2.222, "protein": 14},
                        },
                    }, {
                        "name": "butter",
                        "qty": 0.08,
                        "basis": {
                            "qty": 100,
                            "unit": "g",
                            "calories": 750,
                            "macros": {"carbs": 9.375, "fat": 45.833, "protein": 75},
                        },
                    }, {
                        "name": "creme fresh",
                        "qty": 0.25,
                        "basis": {
                            "qty": 100,
                            "unit": "g",
                            "calories": 320,
                            "macros": {"carbs": 4, "fat": 14.222, "protein": 44},
                        },
                    }],
                }, {
                    "type": "dinner",
                    "name": "pepper-soup",
                    "calories": 150,
                    "macros": {"carbs": 5, "fat": 15, "protein": 80},
                    "qty": 1,
                    "unit": "serving",
                }, {
                    "type": "dinner",
                    "name": "low carb bread",
                    "calories": 250,
                    "macros": {"carbs": 10, "fat": 20, "protein": 70},
                    "qty": 80,
                    "unit": "g",
                }],
            }, {
            "date": "2020-06-09",
            "planType": "med carb",
            "elements": [{
                "type": "lunch",
                "name": "calzo-dilla",
                "calories": 700,
                "macros": {"carbs": 35, "fat": 35, "protein": 30},
                "qty": 1.5,
                "unit": "serving",
                }, {
                "type": "dinner",
                "name": "pad thai",
                "calories": 400,
                "macros": {"carbs": 40, "fat": 35, "protein": 25},
                "qty": 1,
                "unit": "serving",
                }, {
                "type": "snacks",
                "name": "almonds",
                "calories": 200,
                "macros": {"carbs": 10, "fat": 70, "protein": 20},
                "qty": 30,
                "unit": "g",
                }],
            }, {
            "date": "2020-06-10",
            "planType": "high carb",
            "elements": [{
                "type": "breakfast",
                "name": "oaternights",
                "calories": 600,
                "macros": {"carbs": 70, "fat": 20, "protein": 10},
                "qty": 1,
                "unit": "serving",
                }, {
                "type": "lunch",
                "name": "calzo-dilla",
                "calories": 700,
                "macros": {"carbs": 35, "fat": 35, "protein": 30},
                "qty": 1.5,
                "unit": "serving",
                }, {
                "type": "dinner",
                "name": "bacony pasta",
                "calories": 600,
                "macros": {"carbs": 60, "fat": 15, "protein": 25},
                "qty": 0.4,
                "unit": "pot",
                }],
            },{
            "date": "2020-06-11",
            "planType": "low carb",
            "elements": [{
                "type": "lunch",
                "name": "ramsled eggs",
                "calories": 300,
                "macros": {"carbs": 5, "fat": 35, "protein": 60},
                "qty": 1,
                "unit": "serving",
                }, {
                "type": "dinner",
                "name": "pepper-soup",
                "calories": 150,
                "macros": {"carbs": 5, "fat": 15, "protein": 80},
                "qty": 1,
                "unit": "serving",
                }, {
                "type": "dinner",
                "name": "low carb bread",
                "calories": 250,
                "macros": {"carbs": 10, "fat": 20, "protein": 70},
                "qty": 80,
                "unit": "g",
                }],
            }, {
            "date": "2020-06-12",
            "planType": "med carb",
            "elements": [{
                "type": "lunch",
                "name": "calzo-dilla",
                "calories": 700,
                "macros": {"carbs": 35, "fat": 35, "protein": 30},
                "qty": 1.5,
                "unit": "serving",
                }, {
                "type": "dinner",
                "name": "pad thai",
                "calories": 400,
                "macros": {"carbs": 40, "fat": 35, "protein": 25},
                "qty": 1,
                "unit": "serving",
                }, {
                "type": "snacks",
                "name": "almonds",
                "calories": 200,
                "macros": {"carbs": 10, "fat": 70, "protein": 20},
                "qty": 30,
                "unit": "g",
                }],
            }, {
            "date": "2020-06-13",
            "planType": "high carb",
            "elements": [{
                "type": "breakfast",
                "name": "oaternights",
                "calories": 600,
                "macros": {"carbs": 70, "fat": 20, "protein": 10},
                "qty": 1,
                "unit": "serving",
                }, {
                "type": "lunch",
                "name": "calzo-dilla",
                "calories": 700,
                "macros": {"carbs": 35, "fat": 35, "protein": 30},
                "qty": 1.5,
                "unit": "serving",
                }, {
                "type": "dinner",
                "name": "bacony pasta",
                "calories": 600,
                "macros": {"carbs": 60, "fat": 15, "protein": 25},
                "qty": 0.4,
                "unit": "pot",
                }],
            }, {
            "date": "2020-06-14",
            "planType": "low carb",
            "elements": [{
                "type": "lunch",
                "name": "ramsled eggs",
                "calories": 300,
                "macros": {"carbs": 5, "fat": 35, "protein": 60},
                "qty": 1,
                "unit": "serving",
                }, {
                "type": "dinner",
                "name": "pepper-soup",
                "calories": 150,
                "macros": {"carbs": 5, "fat": 15, "protein": 80},
                "qty": 1,
                "unit": "serving",
                }, {
                "type": "dinner",
                "name": "low carb bread",
                "calories": 250,
                "macros": {"carbs": 10, "fat": 20, "protein": 70},
                "qty": 80,
                "unit": "g",
                }],
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
@app.route("/api/")
@transaction
def api():
    return str(sql("select * from recipes"))

@app.route("/api/savePlan/", methods=["POST"])
@transaction
def save_plan():
    # return jsonify({"message": "success"})
    return jsonify(dummy_plan)

@app.route("/api/getPlans/", methods=["GET"])
@transaction
def get_plans():
    return jsonify({
        "userId": 1,
        "plans": [
            dummy_plan,
            dummy_plan
        ]
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
        app.run(debug=True)
