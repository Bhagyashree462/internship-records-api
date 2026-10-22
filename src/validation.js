const allowedFields = new Set([
  "title", "company", "location", "mode", "description", "skills", "apply_url"
]);

export function validateInternship(input, { partial = false } = {}) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { value: null, errors: ["Request body must be a JSON object."] };
  }

  const unknown = Object.keys(input).filter((key) => !allowedFields.has(key));
  if (unknown.length) errors.push(`Unknown field(s): ${unknown.join(", ")}.`);

  const required = ["title", "company", "description"];
  if (!partial) {
    for (const field of required) {
      if (typeof input[field] !== "string" || !input[field].trim()) {
        errors.push(`${field} is required and must be a non-empty string.`);
      }
    }
  } else if (Object.keys(input).length === 0) {
    errors.push("Provide at least one field to update.");
  }

  const value = {};
  for (const field of ["title", "company", "location", "mode", "description"]) {
    if (input[field] !== undefined) {
      if (typeof input[field] !== "string" || !input[field].trim()) {
        errors.push(`${field} must be a non-empty string.`);
      } else {
        value[field] = input[field].trim();
      }
    }
  }

  if (input.skills !== undefined) {
    if (!Array.isArray(input.skills) || !input.skills.every((s) => typeof s === "string" && s.trim())) {
      errors.push("skills must be an array of non-empty strings.");
    } else {
      value.skills = input.skills.map((s) => s.trim());
    }
  }

  if (input.apply_url !== undefined) {
    if (input.apply_url !== null && typeof input.apply_url !== "string") {
      errors.push("apply_url must be a URL string or null.");
    } else if (typeof input.apply_url === "string" && input.apply_url.trim()) {
      try {
        const parsed = new URL(input.apply_url);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
        value.apply_url = parsed.toString();
      } catch {
        errors.push("apply_url must be a valid http or https URL.");
      }
    } else {
      value.apply_url = null;
    }
  }

  if (!partial) {
    value.location ??= "Not specified";
    value.mode ??= "Not specified";
    value.skills ??= [];
    value.apply_url ??= null;
  }
  return { value, errors };
}

export function rowToInternship(row) {
  return { ...row, skills: JSON.parse(row.skills) };
}
