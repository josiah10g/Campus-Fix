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
     (CORS, json, auth middleware)
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
3. **Database (PostgreSQL)**:
   - Relational tables `users` and `issues` with foreign key relationships (`reporter_id REFERENCES users(id)`).
   - Uses parameterized queries exclusively to prevent SQL injection.

---

## 2. Full Journey of a Request: Deleting an Issue

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

## 3. Validation Strategy: Why Validate on Both Client and Server?

- **Client-Side Validation** (`IssueForm.jsx`):
  - Provides instant feedback to the user before sending network traffic.
  - Improves UX with gentle animations (input shake) and clear inline error labels.
- **Server-Side Validation** (`backend/routes/issues.js` & `auth.js`):
  - Acts as the true security perimeter.
  - Client-side code can be bypassed (e.g. via Postman, cURL, or disabling JavaScript).
  - Guarantees database integrity by sanitizing strings, verifying character limits, and checking enum constraints.

---

## 4. Authentication, JWT, and Password Hashing

- **Bcrypt Hashing (`bcryptjs`)**:
  - Passwords are never stored in plain text.
  - Hashes are created with a salt cost of 10 (`bcrypt.hash(password, 10)`), making brute-force attacks computationally infeasible.
  - Authentication compares the plaintext candidate against the hash using `bcrypt.compare`.
  - Database queries omit `password_hash` from client-facing responses.
- **JSON Web Tokens (`jsonwebtoken`)**:
  - After successful login or registration, the backend signs a JWT containing `{ userId, role }` signed with `JWT_SECRET` and set to expire in 24 hours.
  - The API remains completely stateless: no sessions are stored in memory on the server, making it cloud-ready and horizontally scalable.

---

## 5. Difference Between HTTP 401 and 403

- **401 Unauthorized**: "We do not know who you are."
  - The request lacks a valid JWT or the token has expired.
  - Action: Prompt user to log in or refresh their session.
- **403 Forbidden**: "We know who you are, but you are not allowed to do that."
  - The user is authenticated (e.g., student role), but lacks required privileges (e.g., attempting to change issue status or delete another student's report).
  - Action: Show a descriptive permission denial message.

---

## 6. Local Development vs. Production Deployment

| Dimension | Local Development | Production (Render + Neon) |
| :--- | :--- | :--- |
| **Backend URL** | `http://localhost:3000` | `https://campusfix-api.onrender.com` |
| **Frontend URL** | `http://localhost:5173` | `https://campusfix-web.onrender.com` |
| **CORS** | Permits `localhost:5173` | Restricted strictly to `FRONTEND_URL` |
| **PostgreSQL SSL** | SSL disabled (`ssl: false`) | SSL enabled with `rejectUnauthorized: false` for hosted DB |
| **Env Variables** | `.env` file on local disk | Injected via Render Environment Dashboard |

### Why Separate Frontend and Backend?
1. **Independent Scalability**: Static frontend assets are served globally via edge CDNs with zero compute cost; the Node backend only wakes up for dynamic API requests.
2. **Security Isolation**: Frontend code has zero access to database credentials or JWT secrets.
3. **Cross-Origin Resource Sharing (CORS)**: Because frontend and backend are hosted on separate domains/ports, the browser enforces the Same-Origin Policy. The `cors` package explicitly allows requests originating from the trusted `FRONTEND_URL`.

---

## 7. Motion & Accessibility

Motion is limited to short hover, focus, toast, modal, and page transitions so feedback is visible without slowing down actions. All non-essential movement is inside `prefers-reduced-motion: no-preference`; reduced-motion users get the same content without animation.

- **CSS-Only Micro-interactions**: Built using Tailwind utilities and CSS keyframes in `index.css`. No heavy JavaScript animation libraries.
- **Accessible Motion (`prefers-reduced-motion`)**:
  - All non-essential animations (shakes, page slide-ins, toast entrance) are wrapped inside `@media (prefers-reduced-motion: no-preference)`.
  - Users with vestibular disorders or motion sensitivity receive instant transitions without movement.
- **GPU Acceleration**: Only `transform` and `opacity` are animated, avoiding layout recalculations or browser jank.

---

## 8. Ten Likely Assessor Questions & Answers

1. **Q: Why did you use parameterised queries instead of an ORM?**
   *A:* Parameterised queries (`$1, $2`) ensure total protection against SQL injection while maintaining high performance, minimal memory footprint, and full transparency in what SQL queries are executed.
2. **Q: How do you prevent a student from changing the status of an issue?**
   *A:* Even though the UI hides the status dropdown for students, the backend route (`PUT /api/issues/:id`) explicitly checks `req.user.role`. If `status` is provided and the role is not `maintenance`, `admin`, or `super_admin`, the server returns `403 Forbidden`.
3. **Q: What happens if a user submits a duplicate email during registration?**
   *A:* The backend queries the `users` table for the email and returns `409 Conflict` with a user-friendly message (`"An account with this email already exists."`).
4. **Q: How does the application prevent secret leaks?**
   *A:* Secrets are loaded via `process.env` using `dotenv`. The `.gitignore` file strictly blocks `.env` and `*.env` files. In production, credentials are stored in the host provider's encrypted environment variables.
5. **Q: Why is `rejectUnauthorized: false` needed in production Postgres?**
   *A:* Cloud-hosted databases (like Neon or AWS RDS) often use provider-level SSL certificates that are not part of the standard CA bundle in containerized Node runtimes. `rejectUnauthorized: false` permits encrypted SSL traffic while allowing connections to hosted databases.
6. **Q: How does the frontend handle token expiration?**
   *A:* In `frontend/src/api.js`, if any response returns `401 Unauthorized`, the client clears stored tokens and dispatches an `auth:unauthorized` event that smoothly redirects the user to the Login page.
7. **Q: How do you prevent the super admin from being locked out?**
   *A:* The server checks for the existence of `SUPER_ADMIN_EMAIL` on startup; if absent, it seeds one automatically. In `routes/users.js`, the role update endpoint blocks anyone from modifying their own role or demoting the last remaining super admin.
8. **Q: Why use `TRUNCATE ... RESTART IDENTITY CASCADE` in the seed script?**
   *A:* It resets foreign key relations and resets auto-incrementing ID sequences back to 1, ensuring test and demo data remain consistent across runs.
9. **Q: How does the app prevent double-clicking on submit buttons?**
   *A:* The forms set `isSubmitting = true` on submit, which disables the button and renders an inline spinning indicator until the promise settles.
10. **Q: Why is there an SPA rewrite rule (`_redirects` and `vercel.json`)?**
    *A:* In Single Page Applications, routes like `/issues` or `/report` exist only in client-side React Router. Without a rewrite rule, refreshing the browser would cause the static host to look for a physical file at `/issues/index.html` and return a 404. The rule rewrites all requests to `index.html`.
