# BookLeaf Backend (API)

Express REST API for the BookLeaf Author Support & Communication Portal. See the [root README](../README.md) for full documentation.

## Run

```bash
npm install
cp .env.example .env    # set MONGODB_URI, JWT_SECRET; GEMINI_API_KEY is optional
npm run seed            # seed authors, books, admins
npm run dev             # nodemon on http://localhost:5000
```

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | public, rate-limited (30/15min) | Login, returns JWT |
| GET | `/api/v1/auth/me` | JWT | Current user profile |
| GET | `/api/v1/books` | author | List author's books |
| GET | `/api/v1/books/:id` | author | Get a book (owner-only) |
| POST | `/api/v1/tickets` | author, rate-limited (60/hr) | Create a ticket |
| GET | `/api/v1/tickets?status=` | author | List author's tickets |
| GET | `/api/v1/tickets/:id` | author | Get a ticket (owner-only) |
| GET | `/api/v1/admin/tickets` | admin | Admin queue (filtered, paginated) |
| GET | `/api/v1/admin/tickets/:id` | admin | Full admin ticket view |
| PATCH | `/api/v1/admin/tickets/:id/classification` | admin | Override category/priority |
| PATCH | `/api/v1/admin/tickets/:id/status` | admin | Update status |
| PATCH | `/api/v1/admin/tickets/:id/assign` | admin | Assign to an admin |
| POST | `/api/v1/admin/tickets/:id/notes` | admin | Add internal note |
| GET | `/api/v1/admin/tickets/:id/draft?regenerate=` | admin | Get/regenerate AI draft |
| POST | `/api/v1/admin/tickets/:id/reply` | admin | Send reply to author |
| GET | `/api/v1/health` | public | Health check |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| author | `priya.sharma@email.com` | `Author@123` |
| admin | `admin@bookleaf.com` | `Admin@123` |

## AI (Optional)

- Set `GEMINI_API_KEY` for AI classification + draft generation
- Without it: tickets fall back to `General Inquiry / Medium`; admins write replies manually
- AI errors return `503 AI_UNAVAILABLE` with `reason` and `retryAfter`