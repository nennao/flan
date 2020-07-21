#!/usr/bin/env python
import sys
import cmd
import shlex
import random

from model import Plan
from services import log, app
from db import sql, transaction


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

        with open("plan.csv", 'w') as file:
            file.write("-,MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY\n")
            meal_types = ('BREAKFAST', 'LUNCH', 'DINNER')
            for p in zip(meal_types, *plan):
                file.write(','.join(p) + '\n')

    @transaction
    def do_add(self, line):
        args = shlex.split(line)
        name = args[0]
        tags = args[1:]
        self._add_single(name, tags)

    @transaction
    def do_add_many(self, line):
        while True:
            x = getline("Recipe [tags...]: ")
            if not x:
                break

            x = x.split()
            if len(x) < 1:
                print("Error: must provide recipe name at least")

            name = x[0]
            tags = x[1:]
            self._add_single(name, tags)

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
