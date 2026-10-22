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
