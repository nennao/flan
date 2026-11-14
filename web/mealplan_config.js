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

export const macroPercentToGrams = (macro, pc, cals) => Math.round((pc / 100) * cals / MACRO_CAL_MAP[macro]);
