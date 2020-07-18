#!/usr/bin/env python
import sys
import cmd
import shlex

from model import Plan
from services import log, app
from db import sql, transaction



@transaction
def create_recipe(name, ingredients):
    """
    name: str
    ingredients: (name, amount)
    """

    ## create new recipe
    recipe_id = sql(f"insert into recipes(name) values('{name}') returning id")[0][0]

    ## create all ingredients
    for i in ingredients:
        food_id = sql(f"select id from foods where name = '{i[0]}'")[0][0]
        sql(f"insert into ingredients values({recipe_id}, {food_id}, {i[1]})")


@transaction
def create_food(name):
    sql(f"insert into foods(name) values('{name}')")


def getline(prompt):
    sys.stdout.write(prompt)
    sys.stdout.flush()
    return input()


class CommandLine2(cmd.Cmd):
    intro = """==== FLAN ===="""

    ## CRUD commands and some aliases
    def do_create(self, args):
        return self.do_mk(args)
    def do_list(self, args):
        return self.do_ls(args)

    def do_mk(self, args):
        args = shlex.split(args)
        resource = args[0]
        if resource == "food":
            name = args[1]
            create_food(name)

        elif resource == "recipe":
            recipe_name = getline("Recipe name: ")
            ingredients = []
            while True:
                x = getline("Food + amount: ")
                if not x:
                    break
                x = shlex.split(x)
                if len(x) != 2:
                    raise Exception("Expected two values: food name and food amount")
                ingredients.append(x)
            create_recipe(recipe_name, ingredients)
        else:
            log.error(f"Unknown resource: {resource}")

    def do_update(self, args):
        pass

    def do_ls(self, resource, *args):
        self.do_sql(f"select name from {resource}")

    def do_get(self, args):
        args = shlex.split(args)
        resource = args[0]
        if resource == "recipe":
            recipe_name = args[1].strip()
            self.do_sql(f"""select r.name, f.name, i.amount from recipes r
                            join ingredients i on r.id = i.recipe_id
                            join foods f on f.id = i.food_id
                            where r.name = '{recipe_name}'""")

    def do_rm(self, args):
        pass
    
    ## generic SQL escape hatch
    def do_sql(self, args):
        with transaction():
            lines = sql(args)
            table_width = 12
            if lines is not None:
                for l in lines:
                    print(" ".join(map(lambda x: x[:table_width].rjust(table_width), map(str, l))))
    
    # overrides
    def onecmd(self, line):
        with app.app_context() as ctx:
            return super().onecmd(line)


class CommandLine(cmd.Cmd):
    def do_plan(self, line):
        args = shlex.split(line)

    @transaction
    def do_add(self, line):
        args = shlex.split(line)
        name = args[0]
        tags = args[1:]
        self.add_single(name, tags)

    @staticmethod
    def add_single(name, tags):
        recipe_id = sql(f"insert into recipes(name) values('{name}') returning id")[0][0]
        tag_query = f"""insert into recipe_tags(recipe_id, value) values {
            ','.join(('(' + str(recipe_id) + ",'" + t + "')") for t in tags)
        }"""
        sql(tag_query)

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
            self.add_single(name, tags)

    # overrides
    def onecmd(self, line):
        with app.app_context() as ctx:
            return super().onecmd(line)


if __name__ == "__main__":
    CommandLine().onecmd(" ".join(sys.argv[1:]))
