# Internship Records REST API

A beginner-friendly REST API built with Node.js, Express, and SQLite. It supports CRUD operations, input validation, consistent JSON responses, pagination, and persistent local storage.

## Features

- `GET` list with `page` and `limit` pagination
- `GET` one internship by ID
- `POST` create an internship
- `PUT` update fields on an internship
- `DELETE` an internship
- SQLite persistence; database is created automatically
- Request validation and consistent error JSON
- Health check endpoint
- Seed records added on first startup

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

The API starts at `http://localhost:3000`. The SQLite database is created automatically in `data/internships.db`.

For a non-development run:

```bash
npm start
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API overview |
| GET | `/health` | Health check |
| GET | `/api/internships?page=1&limit=10` | List internships with pagination |
| GET | `/api/internships/:id` | Get one internship |
| POST | `/api/internships` | Create internship |
| PUT | `/api/internships/:id` | Update internship fields |
| DELETE | `/api/internships/:id` | Delete internship |

`limit` must be between 1 and 100. Required fields when creating: `title`, `company`, and `description`. `skills` must be an array of strings. `apply_url`, when provided, must be an HTTP or HTTPS URL.

## Example requests

### List with pagination

```bash
curl "http://localhost:3000/api/internships?page=1&limit=2"
```

### Get one record

```bash
curl "http://localhost:3000/api/internships/1"
```

### Create

```bash
curl -X POST "http://localhost:3000/api/internships" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"QA Intern\",\"company\":\"Example Co\",\"description\":\"Test web applications\",\"location\":\"Remote\",\"mode\":\"Remote\",\"skills\":[\"Testing\",\"JavaScript\"],\"apply_url\":\"https://example.com/jobs/qa\"}"
```

### Update

```bash
curl -X PUT "http://localhost:3000/api/internships/1" \
  -H "Content-Type: application/json" \
  -d "{\"location\":\"Remote\",\"skills\":[\"HTML\",\"CSS\"]}"
```

### Delete

```bash
curl -X DELETE "http://localhost:3000/api/internships/1"
```

A successful delete returns `204 No Content`.

## Response format

List endpoint:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Errors use a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the request body.",
    "details": ["title is required and must be a non-empty string."]
  }
}
```

## Database

The schema is available in `database/schema.sql`. Sample records are provided in `seed/internships.json`. The API seeds three clearly fictional sample records when the database is empty. Replace these with the official EdVyro-provided seed records if required by the task brief.

## Test manually

1. Run `npm run dev`.
2. Open `http://localhost:3000/` and `http://localhost:3000/health`.
3. Use Postman, Thunder Client, or the curl examples above.
4. Test invalid input, a missing ID, and pagination limits.
5. Confirm that created records remain after restarting the server.

## Notes

- This project is a local SQLite implementation. The `data/internships.db` file is generated at runtime and excluded from Git.
- Do not commit passwords, API keys, or other secrets.
- Before final submission, compare this implementation with the EdVyro guide and replace the sample seed data with the supplied official records where requested.
