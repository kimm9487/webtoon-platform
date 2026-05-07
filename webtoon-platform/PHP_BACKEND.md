# PHP Backend

Small PHP API server for auth, comments, and search. It uses the same MySQL database as the Next.js app through `DATABASE_URL` in the project `.env`.

## Run

```bash
npm run php:dev
```

Server URL:

```text
http://localhost:8000
```

## Endpoints

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/comments?episodeId={episodeId}
POST   /api/comments
PUT    /api/comments/{id}
DELETE /api/comments/{id}
GET    /api/search?q={keyword}&genre={genre}&status={ongoing|completed|hiatus}
```

Authenticated requests use:

```text
Authorization: Bearer {token}
```

## Examples

Register:

```bash
curl -X POST http://localhost:8000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"reader@example.com\",\"username\":\"reader\",\"password\":\"password123\"}"
```

Login:

```bash
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"reader@example.com\",\"password\":\"password123\"}"
```

Search:

```bash
curl "http://localhost:8000/api/search?q=tower"
```

Comments:

```bash
curl "http://localhost:8000/api/comments?episodeId={episodeId}"
```

## PHP Requirement

Enable `pdo_mysql` in `php.ini`:

```ini
extension=pdo_mysql
```
