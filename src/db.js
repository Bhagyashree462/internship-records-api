import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "internships.db"));
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Not specified',
    mode TEXT NOT NULL DEFAULT 'Not specified',
    description TEXT NOT NULL,
    skills TEXT NOT NULL DEFAULT '[]',
    apply_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const count = db.prepare("SELECT COUNT(*) AS count FROM internships").get().count;
if (count === 0) {
  const seed = [
    { title: "Frontend Developer Intern", company: "Example Digital", location: "Remote", mode: "Remote", description: "Help build and improve responsive web interfaces.", skills: ["HTML", "CSS", "JavaScript", "React"], apply_url: "https://example.com/frontend-intern" },
    { title: "Python Developer Intern", company: "Sample Technologies", location: "Pune, India", mode: "Hybrid", description: "Assist with Python scripting, APIs, and data processing.", skills: ["Python", "REST APIs", "SQL"], apply_url: "https://example.com/python-intern" },
    { title: "Backend Developer Intern", company: "Demo Labs", location: "Bengaluru, India", mode: "On-site", description: "Work on backend services and database integrations.", skills: ["Node.js", "Express", "SQLite"], apply_url: "https://example.com/backend-intern" }
  ];
  const insert = db.prepare(`
    INSERT INTO internships (title, company, location, mode, description, skills, apply_url)
    VALUES (@title, @company, @location, @mode, @description, @skills, @apply_url)
  `);
  db.exec("BEGIN");
  try {
    for (const row of seed) insert.run({ ...row, skills: JSON.stringify(row.skills) });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export default db;
