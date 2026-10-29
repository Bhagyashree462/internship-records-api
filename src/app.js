import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";

import db from "./db.js";
import {
  rowToInternship,
  validateInternship
} from "./validation.js";
import { validateApplication } from "./applicationValidation.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

// --------------------------------------------------
// 1. CORS CONFIGURATION
// --------------------------------------------------

const defaultOrigins = [
  "https://bhagyashree462.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

const allowedOrigins = (
  process.env.FRONTEND_ORIGIN || defaultOrigins.join(",")
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, e.g. server-to-server.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS");
      error.status = 403;
      error.code = "CORS_ORIGIN_DENIED";

      return callback(error);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"]
  })
);

app.use(express.json({ limit: "20kb" }));

// --------------------------------------------------
// 2. APPLICATION RATE LIMITING
// --------------------------------------------------

const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many applications. Please try again later."
    }
  }
});

// --------------------------------------------------
// 3. API INFORMATION AND HEALTH
// --------------------------------------------------

app.get("/", (_req, res) => {
  res.json({
    name: "Internship Records API",
    version: "2.0.0",
    endpoints: {
      list: "GET /api/internships?page=1&limit=10",
      detail: "GET /api/internships/:id",
      create: "POST /api/internships",
      update: "PUT /api/internships/:id",
      delete: "DELETE /api/internships/:id",
      apply: "POST /api/applications",
      health: "GET /health"
    }
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --------------------------------------------------
// 4. LIST INTERNSHIPS WITH PAGINATION
// --------------------------------------------------

app.get("/api/internships", (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page ?? "1", 10);
    const limit = Number.parseInt(req.query.limit ?? "10", 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_PAGINATION",
          message: "page must be >= 1 and limit must be between 1 and 100."
        }
      });
    }

    const total = db
      .prepare("SELECT COUNT(*) AS total FROM internships")
      .get().total;

    const rows = db.prepare(`
      SELECT * FROM internships
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `).all(limit, (page - 1) * limit);

    return res.json({
      data: rows.map(rowToInternship),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// 5. GET ONE INTERNSHIP
// --------------------------------------------------

app.get("/api/internships/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "id must be a positive integer."
        }
      });
    }

    const row = db
      .prepare("SELECT * FROM internships WHERE id = ?")
      .get(id);

    if (!row) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Internship ${id} was not found.`
        }
      });
    }

    return res.json({ data: rowToInternship(row) });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// 6. CREATE INTERNSHIP
// --------------------------------------------------

app.post("/api/internships", (req, res, next) => {
  try {
    const { value, errors } = validateInternship(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the request body.",
          details: errors
        }
      });
    }

    const result = db.prepare(`
      INSERT INTO internships (
        title, company, location, mode,
        description, skills, apply_url
      )
      VALUES (
        @title, @company, @location, @mode,
        @description, @skills, @apply_url
      )
    `).run({
      ...value,
      skills: JSON.stringify(value.skills)
    });

    const row = db
      .prepare("SELECT * FROM internships WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      data: rowToInternship(row)
    });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// 7. UPDATE INTERNSHIP
// --------------------------------------------------

app.put("/api/internships/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "id must be a positive integer."
        }
      });
    }

    const existing = db
      .prepare("SELECT * FROM internships WHERE id = ?")
      .get(id);

    if (!existing) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Internship ${id} was not found.`
        }
      });
    }

    const { value, errors } = validateInternship(
      req.body,
      { partial: true }
    );

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the request body.",
          details: errors
        }
      });
    }

    const current = rowToInternship(existing);
    const merged = { ...current, ...value };

    db.prepare(`
      UPDATE internships
      SET title = @title,
          company = @company,
          location = @location,
          mode = @mode,
          description = @description,
          skills = @skills,
          apply_url = @apply_url
      WHERE id = @id
    `).run({
      ...merged,
      skills: JSON.stringify(merged.skills),
      id
    });

    const updated = db
      .prepare("SELECT * FROM internships WHERE id = ?")
      .get(id);

    return res.json({
      data: rowToInternship(updated)
    });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// 8. DELETE INTERNSHIP
// --------------------------------------------------

app.delete("/api/internships/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "id must be a positive integer."
        }
      });
    }

    const result = db
      .prepare("DELETE FROM internships WHERE id = ?")
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Internship ${id} was not found.`
        }
      });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// 9. SUBMIT INTERNSHIP APPLICATION — TASK 4
// --------------------------------------------------

app.post("/api/applications", applicationLimiter, (req, res, next) => {
  try {
    const { value, errors } = validateApplication(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the application form.",
          details: errors
        }
      });
    }

    const internship = db
      .prepare("SELECT id FROM internships WHERE id = ?")
      .get(value.internshipId);

    if (!internship) {
      return res.status(404).json({
        error: {
          code: "INTERNSHIP_NOT_FOUND",
          message: "The selected internship does not exist."
        }
      });
    }

    const result = db.prepare(`
      INSERT INTO applications (
        internship_id,
        full_name,
        email,
        phone,
        resume_url
      )
      VALUES (
        @internshipId,
        @fullName,
        @email,
        @phone,
        @resumeUrl
      )
    `).run(value);

    return res.status(201).json({
      message: "Application submitted successfully.",
      data: {
        id: Number(result.lastInsertRowid),
        internshipId: value.internshipId,
        fullName: value.fullName,
        email: value.email,
        created: true
      }
    });
  } catch (error) {
    if (/UNIQUE constraint failed/i.test(error.message)) {
      return res.status(409).json({
        error: {
          code: "DUPLICATE_APPLICATION",
          message: "You have already applied to this internship."
        }
      });
    }

    return next(error);
  }
});

// --------------------------------------------------
// 10. UNKNOWN ROUTES
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `No route for ${req.method} ${req.path}.`
    }
  });
});

// --------------------------------------------------
// 11. CENTRAL ERROR HANDLER
// --------------------------------------------------

app.use((err, _req, res, _next) => {
  if (err.status === 413) {
    return res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body exceeds the allowed size."
      }
    });
  }

  if (err.status === 403 && err.code === "CORS_ORIGIN_DENIED") {
    return res.status(403).json({
      error: {
        code: "CORS_ORIGIN_DENIED",
        message: "This origin is not allowed."
      }
    });
  }

  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON."
      }
    });
  }

  console.error(err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred."
    }
  });
});

export default app;