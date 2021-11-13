#!/usr/bin/env python
import sys
import cmd
import shlex
import random

from services import log, app
from db import sql, reset_db, transaction

from ingest import ingest_recipes, ingest_ingredients

def getline(prompt):
    sys.stdout.write(prompt)
    sys.stdout.flush()
    return input()


class CommandLine(cmd.Cmd):
    def do_plan(self, line):
        args = shlex.split(line)
        all_breakfasts = [ _[0] for _ in sql("""select r.name from recipes r join recipe_tags t on r.id = t.recipe_id where t.value = 'breakfast'""") ]
        all_lunches = [ _[0] for _ in sql("""select r.name from recipes r join recipe_tags t on r.id = t.recipe_id where t.value = 'lunch'""") ]
        all_dinners = [ _[0] for _ in sql("""select r.name from recipes r join recipe_tags t on r.id = t.recipe_id where t.value = 'dinner'""") ]

        _format = lambda name: ' '.join([ s.capitalize() for s in name.split('_') ])

        plan = [ [
            _format(random.choice(all_breakfasts)),
            _format(random.choice(all_lunches)),
            _format(random.choice(all_dinners))
        ] for _ in range(7) ]

        # with open("plan.csv", 'w') as file:
        file = sys.stderr
        file.write("-,MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY\n")
        meal_types = ('BREAKFAST', 'LUNCH', 'DINNER')
        for p in zip(meal_types, *plan):
            file.write(','.join(p) + '\n')

    def do_spag(self, line):
        print("FLAN SPAG")
        print("For testing the ingesting")
        data = sql("""select r.name, r.batch, t.value from recipes r
            join recipe_tags t on r.id = t.recipe_id
            where r.name ilike 'Spag bol'""")
        for d in data:
            print(" >>> ", " is ".join(map(str, d)))
        print("Ingredients")
        data = sql("""select f.name, u.unit, i.amount, f.carbs from recipes r 
            join ingredients i  on r.id = i.recipe_id
            join foods f        on f.id = i.food_id
            join units u        on u.id = i.unit_id
            where r.name ilike 'Spag bol'""")
        for d in data:
            print(" > ", " ".join(map(str, d)))

    @transaction
    def do_ingest(self, line):
        ingest_recipes()
        ingest_ingredients()

    def do_clear(self, line):
        reset_db()
        sql(open("scripts/00.sql").read())

    @transaction
    def do_sql(self, line):
        print(line)
        for data in sql(line):
            print(data)

    @staticmethod
    def _add_single(name, tags):
        recipe_id = sql(f"insert into recipes(name) values('{name}') returning id")[0][0]
        tag_query = f"""insert into recipe_tags(recipe_id, value) values {
            ','.join(('(' + str(recipe_id) + ",'" + t + "')") for t in tags)
        }"""
        sql(tag_query)

    # overrides
    def onecmd(self, line):
        with app.app_context() as ctx:
            return super().onecmd(line)


if __name__ == "__main__":
    CommandLine().onecmd(" ".join(sys.argv[1:]))
