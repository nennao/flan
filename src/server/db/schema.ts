/**
 * Baseline schema: an exact reproduction of the legacy `feature/mvp`
 * `scripts/00.sql` (tables, column types, nullability and constraint names).
 *
 * Known weaknesses are kept deliberately (see docs/LEGACY_ASSESSMENT.md §5.1)
 * and will be fixed by separate, reviewed hardening migrations:
 * no primary key on `ingredients` or `measurements`, few NOT NULLs, no
 * foreign-key indexes, and no servings column on `plan_elements`.
 *
 * Constraint names match the Postgres defaults the legacy DB was created with
 * (e.g. `recipes_name_key`, `ingredients_recipe_id_fkey`) rather than Drizzle's
 * own naming, so the two schemas can be compared directly.
 */
import {
  date,
  foreignKey,
  integer,
  pgTable,
  real,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique("recipes_name_key"),
  /** Number of servings the recipe makes. */
  batch: integer("batch"),
});

export const recipeTags = pgTable(
  "recipe_tags",
  {
    id: serial("id").primaryKey(),
    recipeId: integer("recipe_id"),
    value: varchar("value", { length: 100 }),
  },
  (t) => [
    foreignKey({
      name: "recipe_tags_recipe_id_fkey",
      columns: [t.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete("cascade"),
  ],
);

/** Macronutrients are grams per 100 g. kcal is always derived, never stored. */
export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique("foods_name_key"),
  protein: real("protein"),
  fat: real("fat"),
  carbs: real("carbs"),
  fibre: real("fibre"),
});

/** `measure` is one of mass | volume | unit | density (the `rho` pseudo-unit). */
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  unit: varchar("unit", { length: 16 }),
  measure: varchar("measure", { length: 16 }),
});

/** Grams per 1 unit of a food; for `rho`, density in g/ml. No primary key (legacy). */
export const measurements = pgTable(
  "measurements",
  {
    foodId: integer("food_id"),
    unitId: integer("unit_id"),
    grams: real("grams"),
  },
  (t) => [
    foreignKey({
      name: "measurements_food_id_fkey",
      columns: [t.foodId],
      foreignColumns: [foods.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "measurements_unit_id_fkey",
      columns: [t.unitId],
      foreignColumns: [units.id],
    }).onDelete("cascade"),
  ],
);

/** `amount` is for the whole batch, in `unit_id` units. No primary key (legacy). */
export const ingredients = pgTable(
  "ingredients",
  {
    recipeId: integer("recipe_id"),
    foodId: integer("food_id"),
    unitId: integer("unit_id"),
    amount: real("amount"),
  },
  (t) => [
    foreignKey({
      name: "ingredients_recipe_id_fkey",
      columns: [t.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "ingredients_food_id_fkey",
      columns: [t.foodId],
      foreignColumns: [foods.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "ingredients_unit_id_fkey",
      columns: [t.unitId],
      foreignColumns: [units.id],
    }).onDelete("cascade"),
  ],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 32 }),
});

export const plans = pgTable(
  "plans",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    beginDate: date("begin_date"),
    endDate: date("end_date"),
  },
  (t) => [
    foreignKey({
      name: "plans_user_id_fkey",
      columns: [t.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  ],
);

/** Goals are grams per day. */
export const planDays = pgTable(
  "plan_days",
  {
    id: serial("id").primaryKey(),
    planDate: date("plan_date"),
    planType: varchar("plan_type", { length: 32 }),
    goalCarbs: real("goal_carbs"),
    goalFat: real("goal_fat"),
    goalProtein: real("goal_protein"),
    planId: integer("plan_id"),
  },
  (t) => [
    foreignKey({
      name: "plan_days_plan_id_fkey",
      columns: [t.planId],
      foreignColumns: [plans.id],
    }).onDelete("cascade"),
  ],
);

export const planElements = pgTable(
  "plan_elements",
  {
    id: serial("id").primaryKey(),
    elType: varchar("el_type", { length: 32 }),
    planDayId: integer("plan_day_id"),
    recipeId: integer("recipe_id"),
  },
  (t) => [
    foreignKey({
      name: "plan_elements_plan_day_id_fkey",
      columns: [t.planDayId],
      foreignColumns: [planDays.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "plan_elements_recipe_id_fkey",
      columns: [t.recipeId],
      foreignColumns: [recipes.id],
    }).onDelete("cascade"),
  ],
);
