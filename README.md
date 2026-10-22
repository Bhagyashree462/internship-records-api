# Internship Records REST API

A beginner-friendly REST API built with Node.js, Express, and SQLite. It supports CRUD operations, input validation, consistent JSON responses, pagination, and persistent local storage.

## Features

- `GET` list of internships with pagination
- `GET` a single internship by ID
- `POST` to create an internship
- `PUT` to update an internship
- `DELETE` to delete an internship
- SQLite database for persistent storage
- Request validation and consistent error responses
- Health check endpoint
- Seed records added on first startup

## Requirements

- Node.js 24 or newer
- npm

## Run Locally

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:3000`.

The SQLite database is created automatically in `data/internships.db`.

To start without development mode:

```bash
npm start
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API overview |
| GET | `/health` | Health check |
| GET | `/api/internships?page=1&limit=10` | List internships with pagination |
| GET | `/api/internships/:id` | Get one internship |
| POST | `/api/internships` | Create an internship |
| PUT | `/api/internships/:id` | Update an internship |
| DELETE | `/api/internships/:id` | Delete an internship |

Pagination limits must be between 1 and 100. Creating an internship requires `title`, `company`, and `description`. The `skills` field must be an array of strings. If provided, `apply_url` must be an HTTP or HTTPS URL.

## Example Requests

### List internships

```bash
curl "http://localhost:3000/api/internships?page=1&limit=2"
```

### Get one internship

```bash
curl "http://localhost:3000/api/internships/1"
```

### Create an internship

```bash
curl -X POST "http://localhost:3000/api/internships" \
  -H "Content-Type: application/json" \
  -d '{"title":"QA Intern","company":"Example Co","description":"Test web applications","location":"Remote","mode":"Remote","skills":["Testing","JavaScript"],"apply_url":"https://example.com/jobs/qa"}'
```

### Update an internship

```bash
curl -X PUT "http://localhost:3000/api/internships/1" \
  -H "Content-Type: application/json" \
  -d '{"location":"Remote","skills":["HTML","CSS"]}'
```

### Delete an internship

```bash
curl -X DELETE "http://localhost:3000/api/internships/1"
```

A successful deletion returns `204 No Content`.

## Response Format

The list endpoint returns data and pagination details:

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
    "details": [
      "title is required and must be a non-empty string."
    ]
  }
}
```

## Database

- Database schema: `database/schema.sql`
- Sample records: `seed/internships.json`
- Database file: `data/internships.db`

The database is populated with sample records when it is empty. Replace fictional sample data with official EdVyro seed data if the task instructions require it.

## Manual Testing

1. Run `npm run dev`.
2. Open `http://localhost:3000/`.
3. Open `http://localhost:3000/health`.
4. Test the endpoints using Postman, Thunder Client, or curl.
5. Test invalid input and nonexistent IDs.
6. Test pagination limits.
7. Create a record, restart the server, and confirm the record persists.

## Notes

- The SQLite database is generated at runtime and excluded from Git.
- Never commit passwords, API keys, or other secrets.
- Check the official EdVyro task requirements before submitting the repository.
