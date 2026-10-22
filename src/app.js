import express from "express";
import db from "./db.js";
import { rowToInternship, validateInternship } from "./validation.js";

const app = express();
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Internship Records API",
    version: "1.0.0",
    endpoints: {
      list: "GET /api/internships?page=1&limit=10",
      detail: "GET /api/internships/:id",
      create: "POST /api/internships",
      update: "PUT /api/internships/:id",
      delete: "DELETE /api/internships/:id",
      health: "GET /health"
    }
  });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/internships", (req, res) => {
  const page = Number.parseInt(req.query.page ?? "1", 10);
  const limit = Number.parseInt(req.query.limit ?? "10", 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      error: {
        code: "INVALID_PAGINATION",
        message: "page must be >= 1 and limit must be between 1 and 100."
      }
    });
  }

  const total = db.prepare("SELECT COUNT(*) AS total FROM internships").get().total;
  const rows = db.prepare(`
    SELECT * FROM internships
    ORDER BY id ASC
    LIMIT ? OFFSET ?
  `).all(limit, (page - 1) * limit);

  return res.json({
    data: rows.map(rowToInternship),
    pagination: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  });
});

app.get("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: { code: "INVALID_ID", message: "id must be a positive integer." } });
  }
  const row = db.prepare("SELECT * FROM internships WHERE id = ?").get(id);
  if (!row) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: `Internship ${id} was not found.` } });
  }
  return res.json({ data: rowToInternship(row) });
});

app.post("/api/internships", (req, res) => {
  const { value, errors } = validateInternship(req.body);
  if (errors.length) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Please correct the request body.", details: errors } });

  const result = db.prepare(`
    INSERT INTO internships (title, company, location, mode, description, skills, apply_url)
    VALUES (@title, @company, @location, @mode, @description, @skills, @apply_url)
  `).run({ ...value, skills: JSON.stringify(value.skills) });

  const row = db.prepare("SELECT * FROM internships WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ data: rowToInternship(row) });
});

app.put("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: { code: "INVALID_ID", message: "id must be a positive integer." } });

  const existing = db.prepare("SELECT * FROM internships WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: { code: "NOT_FOUND", message: `Internship ${id} was not found.` } });

  const { value, errors } = validateInternship(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Please correct the request body.", details: errors } });

  const current = rowToInternship(existing);
  const merged = { ...current, ...value };
  db.prepare(`
    UPDATE internships
    SET title=@title, company=@company, location=@location, mode=@mode,
        description=@description, skills=@skills, apply_url=@apply_url
    WHERE id=@id
  `).run({ ...merged, skills: JSON.stringify(merged.skills), id });

  const updated = db.prepare("SELECT * FROM internships WHERE id = ?").get(id);
  return res.json({ data: rowToInternship(updated) });
});

app.delete("/api/internships/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: { code: "INVALID_ID", message: "id must be a positive integer." } });
  const result = db.prepare("DELETE FROM internships WHERE id = ?").run(id);
  if (result.changes === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: `Internship ${id} was not found.` } });
  return res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: { code: "ROUTE_NOT_FOUND", message: `No route for ${req.method} ${req.path}.` } });
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body contains invalid JSON." } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected server error occurred." } });
});

export default app;
