import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  parseSeedData,
  readSeedData,
  SeedDataError,
  type SeedFile,
} from "./seed";

const valid: Record<SeedFile, string> = {
  foods:
    "name,protein,fat,carbs,fibre\nEgg,12.5,9.5,0.7,0\nToast,9,3.2,49.5,2.7\n",
  units: "unit,measure\ng,mass\n#,unit\nrho,density\n",
  measurements: "food,unit,grams\nEgg,#,50\n",
  recipes: "name,batch\nEggs On Toast,1\n",
  recipe_tags: "recipe,tag\nEggs On Toast,breakfast\n",
  ingredients:
    "recipe,food,unit,amount\nEggs On Toast,Egg,#,2\nEggs On Toast,Toast,g,60\n",
};

function problemsFor(overrides: Partial<Record<SeedFile, string>>): string[] {
  try {
    parseSeedData({ ...valid, ...overrides });
  } catch (error) {
    if (error instanceof SeedDataError) return error.problems;
    throw error;
  }
  throw new Error("expected parseSeedData to throw");
}

describe("parseSeedData", () => {
  test("parses valid data, converting numbers", () => {
    const data = parseSeedData(valid);
    expect(data.foods[0]).toEqual({
      name: "Egg",
      protein: 12.5,
      fat: 9.5,
      carbs: 0.7,
      fibre: 0,
    });
    expect(data.recipes).toEqual([{ name: "Eggs On Toast", batch: 1 }]);
    expect(data.ingredients).toHaveLength(2);
  });

  test("reports bad values with file and line", () => {
    expect(
      problemsFor({
        foods:
          "name,protein,fat,carbs,fibre\nEgg,12.5,9.5,0.7,0\nToast,abc,3.2,,2.7\n",
      }),
    ).toEqual([
      expect.stringMatching(/^foods\.csv:3: protein: /),
      expect.stringMatching(/^foods\.csv:3: carbs: /),
    ]);
  });

  test.each([
    ["0", "a zero batch"],
    ["1.5", "a fractional batch"],
  ])("rejects %s (%s)", (batch) => {
    expect(
      problemsFor({ recipes: `name,batch\nEggs On Toast,${batch}\n` }),
    ).toEqual([expect.stringMatching(/^recipes\.csv:2: batch: /)]);
  });

  test("rejects unknown and missing columns", () => {
    expect(problemsFor({ units: "unit,measure,extra\ng,mass,x\n" })).toEqual([
      expect.stringMatching(/^units\.csv:2: \(row\): .*extra/),
    ]);
    expect(problemsFor({ units: "unit\ng\n" })).toEqual([
      expect.stringMatching(/^units\.csv:2: measure: /),
    ]);
  });

  test("rejects values longer than the column allows", () => {
    expect(
      problemsFor({ units: `unit,measure\n${"x".repeat(17)},mass\n` }),
    ).toEqual([expect.stringMatching(/^units\.csv:2: unit: /)]);
  });

  test("rejects an unknown measure", () => {
    expect(problemsFor({ units: "unit,measure\ng,weight\n" })).toEqual([
      expect.stringMatching(/^units\.csv:2: measure: /),
    ]);
  });

  test("rejects duplicate names", () => {
    expect(
      problemsFor({
        recipes: "name,batch\nEggs On Toast,1\nEggs On Toast,2\n",
      }),
    ).toEqual(['recipes.csv:3: duplicate "Eggs On Toast"']);
  });

  test("rejects a second conversion for the same food and unit", () => {
    expect(
      problemsFor({ measurements: "food,unit,grams\nEgg,#,50\nEgg,#,60\n" }),
    ).toEqual(['measurements.csv:3: duplicate "Egg / #"']);
  });

  test("rejects references to unknown names", () => {
    expect(
      problemsFor({
        ingredients: "recipe,food,unit,amount\nBeans On Toast,Beans,tin,1\n",
        recipe_tags: "recipe,tag\nBeans On Toast,lunch\n",
      }),
    ).toEqual([
      'recipe_tags.csv:2: unknown recipe "Beans On Toast"',
      'ingredients.csv:2: unknown recipe "Beans On Toast"',
      'ingredients.csv:2: unknown food "Beans"',
      'ingredients.csv:2: unknown unit "tin"',
    ]);
  });
});

describe("the committed data/seed files", () => {
  test("are valid", async () => {
    const data = await readSeedData(path.join(process.cwd(), "data/seed"));
    expect({
      foods: data.foods.length,
      units: data.units.length,
      measurements: data.measurements.length,
      recipes: data.recipes.length,
      recipe_tags: data.recipe_tags.length,
      ingredients: data.ingredients.length,
    }).toEqual({
      foods: 148,
      units: 9,
      measurements: 54,
      recipes: 49,
      recipe_tags: 88,
      ingredients: 380,
    });
  });
});
