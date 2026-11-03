# Technical Defense Notes: CampusFix

These notes explain the architectural decisions, request lifecycle, security mechanisms, and design patterns used across CampusFix for technical defense and viva assessments.

---

## 1. System Architecture & Component Interaction

```text
  [Browser / React SPA]
           │
           │ HTTP Fetch + Bearer JWT
           ▼
     [Express API]
     (CORS, json, rate-limiting, auth middleware)
           │
           │ Parameterised Queries ($1, $2)
           ▼
    [PostgreSQL Database]
    (users & issues tables)
```

1. **Frontend (React + Vite + Tailwind)**:
   - Manages state, routing, client-side input validation, responsive layouts, and UI micro-interactions.
   - Communicates with the backend using a unified API client (`frontend/src/api.js`).
   - Stores JWT token in `localStorage` and automatically attaches `Authorization: Bearer <token>` to requests.
2. **Backend (Node.js + Express REST API)**:
   - Stateless REST API running on port 3000 (or `process.env.PORT` on Render).
   - Validates all input data server-side (trims whitespace, checks lengths and allowed enums).
   - Enforces authentication (`requireAuth`) and role-based permissions (`requireRole`).
   - Serves public endpoints under `/api/public/*` with express rate-limiting.
3. **Database (PostgreSQL)**:
   - Relational tables `users` and `issues` with foreign key relationships (`reporter_id REFERENCES users(id)`).
   - Uses parameterized queries exclusively to prevent SQL injection.

---

## 2. Public vs Private Endpoints & Privacy Architecture

### Why do public endpoints return fewer fields than private ones?
- **Public View (`GET /api/public/issues`)**:
  - Serves unauthenticated visitors on the public homepage (`/`).
  - Returns ONLY safe, non-sensitive columns: `id`, `title`, `location`, `category`, `status`, and `created_at`.
  - **Privacy Guarantee**: `description`, `reporter_id`, `reporter_name`, and `reporter_email` are strictly omitted from the SQL `SELECT` projection.
  - **Reason**: Protects student and staff privacy, prevents social engineering, harassment, or accidental disclosure of personal names and sensitive incident descriptions on a public URL.
- **Protected View (`GET /api/issues` & `/api/issues/:id`)**:
  - Requires authenticated session (`Authorization: Bearer <token>`).
  - Joins the `users` table to return reporter names and full descriptions for verified campus members, ensuring accountability while safeguarding campus community members.

---

## 3. Full Journey of a Request: Deleting an Issue

When a user clicks "Delete" on an issue, the following sequence occurs:

1. **User Action**: The user clicks the red "Delete" button in `IssueTable.jsx` or `IssueCard.jsx`.
2. **Confirmation Modal**: `ConfirmDeleteModal` opens with a darkened backdrop. The app pauses for user confirmation to prevent accidental data loss.
3. **API Dispatch**: The user clicks "Delete issue". `api.deleteIssue(id)` in `frontend/src/api.js` fires an HTTP `DELETE` request to `/api/issues/:id` with the `Authorization: Bearer <token>` header.
4. **CORS & Express Middleware**: Express receives the request, parses headers, and invokes the `requireAuth` middleware:
   - Extracts the JWT from `Authorization: Bearer <token>`.
   - Verifies the signature using `process.env.JWT_SECRET`.
   - Fetches the user from PostgreSQL and attaches `req.user` to the request object.
5. **Route Logic & Permission Verification**: In `backend/routes/issues.js`:
   - Queries PostgreSQL for the issue: `SELECT * FROM issues WHERE id = $1`.
   - If missing, responds with `404 Not Found`.
   - Checks permissions:
     - If the user is `admin` or `super_admin`: allowed to delete any issue.
     - If the user is the reporter: allowed to delete **only if status is 'Open'**.
     - If unauthorized: responds immediately with `403 Forbidden` (`{"error": "You don't have permission to delete this issue."}`).
6. **Database Execution**: If authorized, runs `DELETE FROM issues WHERE id = $1` using parameterised queries.
7. **Response & UI Update**:
   - Backend returns `200 OK` with `{ message: "Issue deleted successfully." }`.
   - Frontend removes the issue from local state (`setIssues`), triggers a re-fetch of `/api/stats`, and displays a green success toast.

---

## 4. Validation Strategy: Why Validate on Both Client and Server?

- **Client-Side Validation** (`IssueForm.jsx`):
  - Provides instant feedback to the user before sending network traffic.
  - Improves UX with gentle animations (input shake) and clear inline error labels.
- **Server-Side Validation** (`backend/routes/issues.js` & `auth.js`):
  - Acts as the true security perimeter.
  - Client-side code can be bypassed (e.g. via Postman, cURL, or disabling JavaScript).
  - Guarantees database integrity by sanitizing strings, verifying character limits, and checking enum constraints.

---

## 5. Security & Authentication: JWT, Password Hashing & Safe Redirects

1. **JWT (JSON Web Tokens)**:
   - Signed with a cryptographically secure key (`JWT_SECRET`) using `HS256`.
   - Carries the payload `{ userId, role }` and expires after 1 day (`{ expiresIn: '1d' }`).
   - Being stateless, the server does not need session tables or sticky server storage.
2. **Password Hashing with Bcrypt**:
   - Uses `bcrypt.hash(password, 10)` with salt factor 10.
   - Salt prevents rainbow table attacks; one-way function ensures raw passwords are never saved.
3. **Safe "next" Redirects (Open Redirect Prevention)**:
   - During redirects from unauthenticated pages (e.g., `/login?next=/report`), the client validates that `next` starts with a single `/` and does not contain `://` or `//`.
   - Prevents malicious open redirect attacks that forward users to external phishing sites.

---

## 6. HTTP Status Code Discipline

- `200 OK`: Successful read or update.
- `201 Created`: Resource successfully created (issue report or registration).
- `400 Bad Request`: Input validation failed (empty title, invalid email, password < 8 characters).
- `401 Unauthorized`: Missing, expired, or invalid token.
- `403 Forbidden`: Authenticated user lacks permission (student trying to update status, maintenance trying to delete).
- `404 Not Found`: Non-existent resource ID or unknown endpoint.
- `409 Conflict`: Duplicate unique key (email already registered).
- `429 Too Many Requests`: Rate limit exceeded on public endpoints.
- `500 Internal Server Error`: Unhandled server exception (logged securely without leaking stack traces).
