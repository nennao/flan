import { describe, expect, test } from "vitest";

import { parseEnv } from "./env-schema";

describe("parseEnv", () => {
  test.each([
    "postgres://flan:secret@localhost:5432/flan_dev",
    "postgresql://flan@db.example.com/flan?sslmode=require",
  ])("accepts %s", (url) => {
    expect(parseEnv({ DATABASE_URL: url })).toEqual({ DATABASE_URL: url });
  });

  test("rejects a missing DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  test.each(["not a url", "mysql://flan@localhost/flan", "https://example.com"])("rejects %s", (url) => {
    expect(() => parseEnv({ DATABASE_URL: url })).toThrow(/DATABASE_URL/);
  });

  test("does not leak the value in the error message", () => {
    expect(() => parseEnv({ DATABASE_URL: "mysql://u:hunter2@h/d" })).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("hunter2"),
      }),
    );
  });
});
