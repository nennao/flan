export const MACROS = ['carbs', 'fat', 'protein'];

export const MACRO_CAL_MAP = {
    carbs: 4,
    fat: 9,
    protein: 4,
};

export const MEAL_PLAN_BY_DAY = {
    Mon: 'low carb',
    Tue: 'med carb',
    Wed: 'high carb',
    Thu: 'low carb',
    Fri: 'med carb',
    Sat: 'high carb',
    Sun: 'low carb',
};

export const MEAL_PLAN_CALS = {
    'low carb': 1700,
    'med carb': 1900,
    'high carb': 2200,
};

export const MEAL_PLAN_MACROS = {
    'low carb': {carbs: 10, fat: 65, protein: 25},
    'med carb': {carbs: 30, fat: 45, protein: 25},
    'high carb': {carbs: 55, fat: 20, protein: 25},
};


export const DUMMY_PLAN_RESPONSE = {
    "startDate": "2020-06-08",
    "endDate": "2020-06-14",
    "days": [{
        "date": "2020-06-08",
        "planType": "low carb",
        "elements": [{
            "type": "lunch",
            "name": "ramsled eggs",
            "calories": 300,
            "macros": {carbs: 5, fat: 35, protein: 60},
            }, {
            "type": "dinner",
            "name": "pepper-soup",
            "calories": 150,
            "macros": {carbs: 5, fat: 15, protein: 80},
            }, {
            "type": "dinner",
            "name": "low carb bread",
            "calories": 250,
            "macros": {carbs: 10, fat: 20, protein: 70},
            }],
        }, {
        "date": "2020-06-09",
        "planType": "med carb",
        "elements": [{
            "type": "lunch",
            "name": "calzo-dilla",
            "calories": 700,
            "macros": {carbs: 35, fat: 35, protein: 30},
            }, {
            "type": "dinner",
            "name": "pad thai",
            "calories": 400,
            "macros": {carbs: 40, fat: 35, protein: 25},
            }, {
            "type": "snacks",
            "name": "almonds",  // TODO need qty/serving size
            "calories": 200,
            "macros": {carbs: 10, fat: 70, protein: 20},
            }],
        }, {
        "date": "2020-06-10",
        "planType": "high carb",
        "elements": [{
            "type": "breakfast",
            "name": "oaternights",
            "calories": 600,
            "macros": {carbs: 70, fat: 20, protein: 10},
            }, {
            "type": "lunch",
            "name": "calzo-dilla",
            "calories": 700,
            "macros": {carbs: 35, fat: 35, protein: 30},
            }, {
            "type": "dinner",
            "name": "bacony pasta",
            "calories": 600,
            "macros": {carbs: 60, fat: 15, protein: 25},
            }],
        },{
        "date": "2020-06-11",
        "planType": "low carb",
        "elements": [{
            "type": "lunch",
            "name": "ramsled eggs",
            "calories": 300,
            "macros": {carbs: 5, fat: 35, protein: 60},
            }, {
            "type": "dinner",
            "name": "pepper-soup",
            "calories": 150,
            "macros": {carbs: 5, fat: 15, protein: 80},
            }, {
            "type": "dinner",
            "name": "low carb bread",
            "calories": 250,
            "macros": {carbs: 10, fat: 20, protein: 70},
            }],
        }, {
        "date": "2020-06-12",
        "planType": "med carb",
        "elements": [{
            "type": "lunch",
            "name": "calzo-dilla",
            "calories": 700,
            "macros": {carbs: 35, fat: 35, protein: 30},
            }, {
            "type": "dinner",
            "name": "pad thai",
            "calories": 400,
            "macros": {carbs: 40, fat: 35, protein: 25},
            }, {
            "type": "snacks",
            "name": "almonds",
            "calories": 200,
            "macros": {carbs: 10, fat: 70, protein: 20},
            }],
        }, {
        "date": "2020-06-13",
        "planType": "high carb",
        "elements": [{
            "type": "breakfast",
            "name": "oaternights",
            "calories": 600,
            "macros": {carbs: 70, fat: 20, protein: 10},
            }, {
            "type": "lunch",
            "name": "calzo-dilla",
            "calories": 700,
            "macros": {carbs: 35, fat: 35, protein: 30},
            }, {
            "type": "dinner",
            "name": "bacony pasta",
            "calories": 600,
            "macros": {carbs: 60, fat: 15, protein: 25},
            }],
        }, {
        "date": "2020-06-14",
        "planType": "low carb",
        "elements": [{
            "type": "lunch",
            "name": "ramsled eggs",
            "calories": 300,
            "macros": {carbs: 5, fat: 35, protein: 60},
            }, {
            "type": "dinner",
            "name": "pepper-soup",
            "calories": 150,
            "macros": {carbs: 5, fat: 15, protein: 80},
            }, {
            "type": "dinner",
            "name": "low carb bread",
            "calories": 250,
            "macros": {carbs: 10, fat: 20, protein: 70},
            }],
        },
    ]
};