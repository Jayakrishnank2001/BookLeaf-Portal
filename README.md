# BookLeaf Publishing — Author Support & Communication Portal

A full-stack support portal where **authors** (writers) submit tickets and **admins** (support staff) triage them. A lightweight **AI layer** (Google Gemini) auto-classifies tickets (category + priority), generates draft replies, and degrades gracefully when the AI is down or rate-limited.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Local Setup](#local-setup)
5. [Environment Variables](#environment-variables)
6. [Test Accounts](#test-accounts)
7. [API Reference](#api-reference)
8. [AI Strategy](#ai-strategy)
9. [Project Structure](#project-structure)
10. [Known Limits](#known-limits)
11. [1-Page Write-Up](#1-page-write-up)

---

## Quick Start

```bash
# 1. Backend
cd BookLeaf-Portal-Backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, GEMINI_API_KEY (optional)
npm install
npm run seed      # seeds authors, books, admins
npm run dev       # nodemon on http://localhost:5000

# 2. Frontend
cd ../BookLeaf-Portal-Frontend
npm install
ng serve          # http://localhost:4200
```

Open the frontend and log in (see [Test Accounts](#test-accounts)).

---

## Architecture

```
┌──────────────┐      JWT        ┌──────────────┐
│  Author UI    │      HTTP      │ Admin UI    │
│  Angular 21   │ ◄─────────────► │  Angular 21 │
│  (localhost:4200)              │              │
└──────┬───────┘                  └──────┬───────┘
       │                               │
       ▼                               ▼
   ┌──────────────┐
   │  API Gateway │
   │  Express 4   │
   │  /api/v1     │
   └──────┬───────┘
          │
   ┌──────┴──────────┐         ┌──────────────┐
   │  MongoDB        │   fire- │  Gemini AI   │
   │  (bookleaf)     │ ◄────── │  gemini-3.5- │
   │  Atlas/local    │ forget  │  flash-lite  │
   └─────────────────┘         └──────────────┘
```

**Key design decisions:**

| Decision | Rationale |
|----------|-----------|
| Fire-and-forget AI triage | `POST /tickets` returns immediately; AI classification runs in the background so ticket creation is never blocked by AI latency. |
| Fallback classification | Tickets default to `General Inquiry / Medium` (classifiedBy: `fallback`) so they are always triaged, even when AI is down. |
| Role-based serializers | `toAuthorTicket()` omits `internalNotes`, `draftResponse`, `aiMeta`, `assignedTo`, and `priority` — admin-only fields that can never leak to authors. |
| One retry on transient AI errors only | Timeouts and non-transient errors are NOT retried; only 429/5xx get a single retry. If Google's retry delay exceeds 30s, the error is surfaced immediately. |
| Cached drafts | Opening a ticket repeatedly costs zero AI tokens — `getOrCreateDraft` returns the cached `draftResponse.text`; regeneration is explicit. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js ≥18, Express 4, Mongoose 8, Zod (validation), JWT (auth), bcryptjs |
| **Database** | MongoDB (Atlas) |
| **AI Provider** | Google Gemini (`@google/genai` SDK) |
| **Frontend** | Angular 21 (standalone components, signals, zoneless), RxJS |
| **Auth** | JWT + Bearer token, role-based middleware (`author`/`admin`) |
| **Deployment** | Render (backend), Vercel (frontend) |

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- npm
- MongoDB (Atlas URI)
- Google Gemini API key (optional — app works without it via fallback)

### Backend

```bash
cd BookLeaf-Portal-Backend
npm install
cp .env.example .env
# Edit .env:
#   MONGODB_URI=<your MongoDB connection string>
#   JWT_SECRET=<a long random string>
#   GEMINI_API_KEY=<your Gemini API key>   # optional
npm run seed   # creates: 3+ authors, their books, 2 admins
npm run dev    # nodemon watches and restarts on changes
```

API available at `http://localhost:5000/api/v1`.

### Frontend

```bash
cd ../BookLeaf-Portal-Frontend
npm install
ng serve
```

Frontend available at `http://localhost:4200`.

### Optional: Create Sample Tickets

The `seed` script creates authors and books but no tickets. Create one via the API:

```bash
# After starting the backend and logging in as author:
curl -X POST http://localhost:5000/api/v1/tickets \
  -H "Authorization: Bearer <AUTHOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"subject":"ISBN mismatch on Amazon","description":"My book shows a different ISBN on Amazon than on the physical copy.","attachments":[]}'
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `CORS_ORIGIN` | No | `http://localhost:4200` | Frontend origin for CORS |
| `MONGODB_URI` | ✅ Yes | — | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | `1d` | Token expiry |
| `GEMINI_API_KEY` | No | — | Google Gemini API key (leaves AI disabled if unset) |
| `AI_MODEL` | No | `gemini-3.5-flash` | Gemini model name |
| `AI_TIMEOUT_MS` | No | `10000` | AbortController timeout for AI calls |
| `SEED_AUTHOR_PASSWORD` | No | `Author@123` | Password for seeded author accounts |
| `SEED_ADMIN_PASSWORD` | No | `Admin@123` | Password for seeded admin accounts |

---

## Test Accounts

Seeded by `npm run seed`. Dev passwords are `Author@123` (authors) and `Admin@123` (admins). You can override these via `SEED_AUTHOR_PASSWORD` / `SEED_ADMIN_PASSWORD` env vars.

### Authors

| Email | Name | Role |
|-------|------|------|
| `priya.sharma@email.com` | Priya Sharma | author |
| `rohit.kapoor@email.com` | Rohit Kapoor | author |
| `ananya.reddy@email.com` | Ananya Reddy | author |

### Admins

| Email | Name | Role |
|-------|------|------|
| `admin@bookleaf.com` | BookLeaf Admin | admin |
| `ops@bookleaf.com` | BookLeaf Ops | admin |

---

## API Reference

All endpoints are prefixed with `/api/v1`. Auth uses `Authorization: Bearer <jwt>`.

### Status / Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` / `BAD_REQUEST` / `INVALID_ID` | Malformed input or bad ObjectId |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 403 | `FORBIDDEN` | Role mismatch (author hitting admin route, etc.) |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `DUPLICATE_KEY` | Duplicate value (e.g., email) |
| 429 | `RATE_LIMITED` | Too many requests (login: 30/15min, create ticket: 60/1hr) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `AI_UNAVAILABLE` | AI provider unavailable (sub-reasons: see below) |

### AI Error Reasons (AI_UNAVAILABLE)

When the AI layer fails, the 503 response includes a `reason` field:

| `reason` | Cause | `retryAfter` |
|----------|-------|--------------|
| `TIMEOUT` | Request exceeded 10s timeout (model slow or overloaded) | `null` |
| `RATE_LIMITED` | 429 from Google — free-tier quota exceeded (20 req/day) | parsed from Google's `RetryInfo` |
| `PROVIDER_ERROR` | 5xx from Google or other provider issue | parsed if available |
| `NO_API_KEY` | `GEMINI_API_KEY` not set in `.env` | `null` |
| `EMPTY_RESPONSE` | Model returned no text | `null` |

---

### 1. Authentication

#### POST /auth/login

Authenticate with email + password. Returns JWT + user profile.

**Rate limit:** 30 attempts per 15 minutes per IP.

**Request body:**
```json
{ "email": "admin@bookleaf.com", "password": "Admin@123" }
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "6ae1ada13dcb2e1c05600001",
    "email": "admin@bookleaf.com",
    "name": "BookLeaf Admin",
    "role": "admin",
    "authorId": null
  }
}
```

#### GET /auth/me

Returns the currently authenticated user. Requires `Authorization: Bearer <jwt>`.

**Response 200:**
```json
{ "user": { "id": "...", "email": "...", "name": "...", "role": "...", "authorId": "..." } }
```

---

### 2. Books

Requires `role: "author"`.

#### GET /books

List all books owned by the authenticated author.

**Response 200:**
```json
{
  "books": [
    {
      "id": "66...",
      "bookCode": "BK001",
      "title": "The Midnight Garden",
      "isbn": "978-93530...",
      "genre": "Fantasy",
      "publicationDate": "2023-06-15T00:00:00.000Z",
      "status": "Published & Live",
      "isPublished": true,
      "mrp": 450,
      "totalCopiesSold": 340,
      "totalRoyaltyEarned": 118800,
      "royaltyPaid": 80000,
      "royaltyPending": 38800,
      "lastRoyaltyPayoutDate": "2024-01-15T00:00:00.000Z",
      "printPartner": "Repro India",
      "availableOn": ["Amazon India", "Flipkart"]
    }
  ]
}
```

#### GET /books/:id

Get a single book owned by the author.

**Response 200:** Same shape as one item in the list above.

---

### 3. Author Tickets

Requires `role: "author"`.

#### POST /tickets

Create a new support ticket. Returns immediately; AI classification runs in the background.

| Field | Type | Validation |
|-------|------|------------|
| `bookId` | string (ObjectId) or null | optional; must belong to this author |
| `subject` | string | required, 5-150 chars |
| `description` | string | required, 10-5000 chars |
| `attachments` | array | optional, max 5; each { fileName, size?, mimeType? } |

**Response 201:**
```json
{
  "ticket": {
    "id": "6ae2f01927c6a73191967d97",
    "ticketCode": "BL-2026-67D97",
    "subject": "Wrong ISBN on Amazon",
    "description": "My book shows a different ISBN...",
    "status": "Open",
    "category": "ISBN & Metadata Issues",
    "attachments": [],
    "book": { "id": "66...", "title": "The Midnight Garden" } or null,
    "responses": [],
    "createdAt": "2024-10-29T10:30:00.000Z",
    "updatedAt": "2024-10-29T10:30:00.000Z"
  }
}
```

> `priority`, `aiMeta`, `draftResponse`, `internalNotes`, and `assignedTo` are **not returned** to authors.

#### GET /tickets?status=

List the authenticated author's tickets.

| Query | Type | Description |
|-------|------|-------------|
| `status` | enum | optional filter; Open / In Progress / Resolved / Closed |

**Response 200:**
```json
{ "tickets": [ ... ] }
```

#### GET /tickets/:id

Get a single ticket (ownership enforced — returns 404 if not yours).

**Response 200:** Same shape as POST /tickets response.

---

### 4. Admin Tickets

Requires `role: "admin"`.

#### GET /admin/tickets

List all tickets with filters and pagination.

| Query param | Type | Default | Description |
|-------------|------|---------|-------------|
| `status` | enum | — | Open / In Progress / Resolved / Closed |
| `category` | enum | — | One of the 6 categories |
| `priority` | enum | — | Critical / High / Medium / Low |
| `assignedTo` | ObjectId | — | Filter by assigned admin |
| `sort` | enum | `updatedAt` | createdAt / updatedAt / priority |
| `order` | enum | `desc` | asc / desc |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |

**Response 200:**
```json
{ "tickets": [ ... ], "total": 42, "page": 1, "limit": 20 }
```

The admin ticket object includes additional fields: `priority`, `aiMeta`, `draftResponse`, `internalNotes`, `assignedTo`, `author`, and `book` (with `isbn`).

#### GET /admin/tickets/:id

Get a single ticket with full admin shape (includes `internalNotes`, `aiMeta`, `draftResponse`, `assignedTo`).

**Response 200:**
```json
{ "ticket": { ...full admin object... } }
```

#### PATCH /admin/tickets/:id/classification

Override the AI-assigned category and/or priority. Sets `aiMeta.classifiedBy` to `"admin"`.

**Request body** (at least one field required):
```json
{ "category": "ISBN & Metadata Issues", "priority": "High" }
```

**Response 200:** `{ "ticket": { ... } }`

#### PATCH /admin/tickets/:id/status

Update ticket status.

**Request body:**
```json
{ "status": "In Progress" }
```

**Response 200:** `{ "ticket": { ... } }`

#### PATCH /admin/tickets/:id/assign

Assign or reassign the ticket to an admin.

**Request body:**
```json
{ "adminId": "6ae1ada13dcb2e1c05600001" }
```

**Response 200:** `{ "ticket": { ... } }`

#### POST /admin/tickets/:id/notes

Add an internal note (visible only to admins).

**Request body:**
```json
{ "note": "Escalated to production team." }
```

**Response 200:** `{ "ticket": { ... } }`

#### GET /admin/tickets/:id/draft?regenerate=false

Get or generate an AI draft reply. If `regenerate=true`, forces a new AI call; otherwise returns the cached draft (if any).

| Query param | Type | Default | Description |
|-------------|------|---------|-------------|
| `regenerate` | boolean | `false` | Force a new AI call |

**Response 200 (success):**
```json
{
  "draft": {
    "text": "Dear Priya,\n\nThank you for flagging this ISBN mismatch...",
    "generatedAt": "2024-10-29T10:32:00.000Z",
    "cached": false
  }
}
```

**Response 503 (AI unavailable):**
```json
{
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "AI assistance is unavailable right now. You can continue manually.",
    "reason": "RATE_LIMITED",
    "retryAfter": 690
  }
}
```

When `RATE_LIMITED`, the frontend disables the "Try again" button until `retryAfter` seconds pass.

#### POST /admin/tickets/:id/reply

Send a reply to the author. Stored in `responses[]` and visible on the author's next 8-second poll.

**Request body:**
```json
{ "message": "Thank you for flagging the ISBN mismatch..." }
```

> If the ticket status is `Open`, this transitions it to `In Progress`.

**Response 200:** `{ "ticket": { ... } }`

---

### Error Response Format

All errors follow this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" |
            "CONFLICT" | "RATE_LIMITED" | "INTERNAL_ERROR" | "AI_UNAVAILABLE",
    "message": "Human-readable description",
    "details": [ ... ],
    "reason": "TIMEOUT" | "RATE_LIMITED" | "PROVIDER_ERROR" | "NO_API_KEY",
    "retryAfter": 690,
    "stack": "..."
  }
}
```

---

## AI Strategy

### Provider

**Google Gemini** via the `@google/genai` SDK. Model: `gemini-3.5-flash-lite` (set in `.env` as `AI_MODEL`). `aiClient.js` is the **only** file that talks to the LLM provider — swapping providers means editing this file only.

### AI is optional

The Gemini API key is **optional**. Without `GEMINI_API_KEY`, the app starts with a `WARN` log entry and all AI features are disabled. Tickets get a fallback classification of `General Inquiry / Medium` (marked `classifiedBy: 'fallback'`), and admins can write replies manually. The app never crashes due to AI problems.

### Token & Cost Control

| Strategy | Implementation |
|----------|----------------|
| **Classification sends NO knowledge base** | `CLASSIFICATION_SYSTEM` is a ~200 word system prompt; only ticket subject + description (<1500 chars) are sent. No author data, no KB. |
| **Draft sends only relevant KB** | `buildDraftPrompt` loads only the KB section for the ticket's category, one calibration example, and relevant book fields. |
| **Book data is compacted** | `formatBook()` sends ~8 fields per book; capped at 6 books per prompt (`MAX_BOOKS_IN_CONTEXT`). |
| **Cached drafts** | Opening a ticket repeatedly costs **zero** AI tokens — returns `ticket.draftResponse.text` from DB unless `regenerate=true`. |
| **Token caps** | Classification: `maxOutputTokens=200, temperature=0.0`; Drafting: `maxOutputTokens=700, temperature=0.4`. |
| **Fire-and-forget triage** | `POST /tickets` saves the ticket first, then runs AI classification in background without blocking. |
| **Thinking budget disabled** | Gemini 2.5+ models "think" by default; `aiClient.js` sets `thinkingBudget: 0` when model matches `/2\.5/`. |

### Two-Stage AI Flow

1. **Classification** (after ticket creation): Input = ticket subject + description only (no KB). Prompt defines 6 categories and a 4-level priority rubric. Output = strict JSON `{ category, priority, reasoning }`, validated by Zod before DB write.

2. **Draft generation** (on-demand): Input = category-specific KB policy, one example, author/book data, ticket body. Output = plain-text email (120–200 words, signed "Warm regards, BookLeaf Support Team"). Cached in `ticket.draftResponse.text`.

### AI Error Handling

The `aiClient.js` retry logic:

```
callOnce()
  ├── Success → return text
  ├── AbortError (timeout) → 503 TIMEOUT (NOT retried)
  ├── 429 Rate Limited
  │     ├── retryDelay > 30s → throw RATE_LIMITED immediately (quota exhausted)
  │     └── retryDelay ≤ 30s → sleep, retry once → throw if still failing
  ├── 5xx Provider Error → sleep 2s, retry once → throw if still failing
  └── Empty response → 503 EMPTY_RESPONSE (not retried)
```

Every AI failure is logged: `WARN` for timeouts/rate limits, `ERROR` for provider errors, including status code and message.

**Known AI limitation:** Google's free tier allows 20 requests/day. When exhausted, Google returns HTTP 429 with `retryDelay` ~690s (until next day's reset). The app surfaces `RATE_LIMITED` + `retryAfter` to the frontend, which disables the "Try again" button for that duration.

---

## Project Structure

```
BookLeaf-Portal/
├── README.md
├── .env.example
├── BookLeaf-Portal-Backend/          # Express API + AI services (Node.js)
│   ├── src/
│   │   ├── server.js                 # Entry: DB connect, listen on PORT
│   │   ├── app.js                    # Express app, routes, error handler
│   │   ├── config/                   # env.js, db.js, constants.js
│   │   ├── middleware/               # auth, authorize, validate, rateLimit, errors
│   │   ├── models/                   # User, Author, Book, Ticket
│   │   ├── routes/                   # index, auth, books, tickets, admin
│   │   ├── controllers/              # auth, book, ticket, admin
│   │   ├── services/                 # auth, book, ticket, admin-ticket
│   │   │   └── ai/                   # aiClient (provider gate), classify, draft, prompts, KB
│   │   ├── validators/               # Zod schemas (auth, tickets, admin)
│   │   ├── utils/                    # AppError, asyncHandler, logger, serializers
│   │   └── seed/                     # seed.js, sample data JSON
│   └── package.json
├── BookLeaf-Portal-Frontend/          # Angular 21 admin + author portals
│   ├── src/app/
│   │   ├── core/                     # api types, models, services, guards
│   │   ├── features/                 # author + admin feature modules
│   │   ├── layouts/                  # AuthorLayout + AdminLayout
│   │   └── shared/                   # badge, avatar, select, icon, pipes
│   └── package.json
```

---

## Known Limits

| # | Limitation | Impact |
|---|-----------|--------|
| 1 | **AI free-tier quota (20 req/day)** | Drafts fail with `RATE_LIMITED` after quota exhausted; admins can write replies manually |
| 2 | **File upload is bonus** | Only filenames stored; no actual file storage backend |
| 3 | **No test suite** | Assignment doesn't require tests |
| 4 | **No real-time notifications** | Authors poll every 8s; no WebSocket/SSE/email notifications |
| 5 | **Draft cache not invalidated** on classification override | Admin must use `regenerate=true` after changing category to get a fresh draft |
| 6 | **No per-platform royalty breakdown** | Totals shown only; per-platform data mentioned in KB but not implemented |
| 7 | **No author follow-up in ticket** | Authors must open a new ticket for follow-ups (by design) |

---

## 1-Page Write-Up

### BookLeaf Author Support Portal — Technical Approach

**Goal:** A 5-day build of an author-facing + admin-facing support portal with AI-powered ticket triage and draft replies, with a self-imposed constraint of a single file responsible for all LLM provider communication (`aiClient.js`).

**Backend (Node.js / Express / MongoDB):**
- REST API with JWT auth, role-based authorization (`author`/`admin`), Zod input validation, structured JSON errors, and express-rate-limit on login + ticket creation.
- Two ticket serializers (`toAuthorTicket` / `toAdminTicket`) — the author schema is an **allow-list** that omits `internalNotes`, `draftResponse`, `aiMeta`, `assignedTo`, and `priority`, so they can never leak to authors even if controller code changes.
- AI runs in three modes:
  1. **Classification** (fire-and-forget, 200 tokens, no KB) — sets category + priority. Falls back to `General Inquiry / Medium` if AI is down.
  2. **Draft generation** (cached, 700 tokens, category-specific KB only) — admin can regenerate on demand.
  3. **Degradation** — `aiClient.js` retries transient 429/5xx once (respecting Google's `RetryInfo`, capped at 30s); timeouts are NOT retried; returns a structured `AI_UNAVAILABLE` with `reason` and `retryAfter`.

**Frontend (Angular 21, standalone components, signals, zoneless):**
- Author: books list/detail, ticket create/list/detail, 8-second polling for new replies.
- Admin: ticket queue with filters, real ticket workspace with AI draft (use/edit/regenerate), classification overrides, internal notes, assignment, and reply-to-author. When AI is degraded, shows specific reason (`RATE_LIMITED`/`TIMEOUT`/`PROVIDER_ERROR`) and disables "Try again" during any cooldown.

**AI Strategy:**
- Google Gemini (`gemini-3.5-flash-lite` for cost efficiency). API key is **optional** — without it, the app runs in manual-only mode with a startup warning.
- Classification sends NO knowledge base (only subject + description). Drafts send only the category's KB section, one example, and relevant book data (compacted to 8 fields, max 6 books). All model output is Zod-validated before DB writes.
- Error propagation: `aiClient.js` → `errorHandler.js` → frontend reads `error.reason` and `error.retryAfter` for user-facing messaging.

**Deployment:** Designed for Render (backend, MongoDB Atlas) + Vercel (frontend).
- Backend live at: https://bookleaf-portal-1amq.onrender.com
- Frontend live at: https://book-leaf-portal-six.vercel.app