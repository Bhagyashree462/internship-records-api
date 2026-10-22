import test from "node:test";
import assert from "node:assert/strict";
import { validateInternship } from "../src/validation.js";

test("accepts a valid internship record", () => {
  const result = validateInternship({
    title: "Backend Intern",
    company: "Example Company",
    description: "Help build APIs",
    skills: ["Node.js"],
    apply_url: "https://example.com/jobs"
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.value.title, "Backend Intern");
});

test("rejects missing required fields", () => {
  const result = validateInternship({ title: "Only title" });
  assert.ok(result.errors.some((error) => error.includes("company is required")));
  assert.ok(result.errors.some((error) => error.includes("description is required")));
});

test("rejects invalid URL", () => {
  const result = validateInternship({
    title: "Intern",
    company: "Example",
    description: "Test",
    apply_url: "javascript:alert(1)"
  });
  assert.ok(result.errors.some((error) => error.includes("valid http or https URL")));
});
