
const allowedFields = new Set([
  "internshipId",
  "fullName",
  "email",
  "phone",
  "resumeUrl"
]);

export function validateApplication(input) {
  const errors = [];

  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return {
      value: null,
      errors: ["Request body must be a JSON object."]
    };
  }

  const unknownFields = Object.keys(input).filter(
    (key) => !allowedFields.has(key)
  );

  if (unknownFields.length > 0) {
    errors.push(
      `Unknown field(s): ${unknownFields.join(", ")}.`
    );
  }

  const internshipId = Number(input.internshipId);

  if (
    input.internshipId === undefined ||
    !Number.isInteger(internshipId) ||
    internshipId < 1
  ) {
    errors.push("Select a valid internship.");
  }

  const fullName =
    typeof input.fullName === "string"
      ? input.fullName.trim()
      : "";

  if (fullName.length < 2 || fullName.length > 100) {
    errors.push("Full name must contain 2 to 100 characters.");
  }

  const email =
    typeof input.email === "string"
      ? input.email.trim().toLowerCase()
      : "";

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.push("Enter a valid email address.");
  }

  const phone =
    typeof input.phone === "string"
      ? input.phone.trim()
      : "";

  if (!/^[6-9]\d{9}$/.test(phone)) {
    errors.push("Enter a valid 10-digit Indian mobile number.");
  }

  let resumeUrl = null;

  if (input.resumeUrl !== undefined && input.resumeUrl !== "") {
    if (
      typeof input.resumeUrl !== "string" ||
      input.resumeUrl.length > 2048
    ) {
      errors.push("Resume URL must be a valid string under 2048 characters.");
    } else {
      try {
        const parsed = new URL(input.resumeUrl.trim());

        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Invalid protocol");
        }

        resumeUrl = parsed.toString();
      } catch {
        errors.push("Resume URL must use HTTP or HTTPS.");
      }
    }
  }

  return {
    value: {
      internshipId,
      fullName,
      email,
      phone,
      resumeUrl
    },
    errors
  };
}
