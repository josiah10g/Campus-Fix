# AI Usage Statement: CampusFix

## 1. AI Tools Used
- Google Antigravity (Powered by Gemini 3.8 Flash model)
- OpenAI Codex for the subsequent code audit, implementation, and verification work in this session.

## 2. Important Prompts
- "You are building the project for the CLBG Software Development Bootcamp End-of-Bootcamp Assessment. It is an INDIVIDUAL, 48-hour assessment. Simple, readable and correct beats clever. Do not over-engineer."
- "Structure the repo as two independent apps: frontend/ (Vite React + Tailwind) and backend/ (Node + Express + pg). Backend on Render, frontend as static site."
- "Implement full role-based permissions: student, staff, maintenance, admin, super_admin. Enforce all checks on the server."
- "Design UI matching attached mockups (00-design-system, 01-auth-login-register, etc.) using Tailwind, Carlito typography, white cards, 1px borders, and CSS micro-interactions respecting prefers-reduced-motion."

## 3. Features or Code Generated with AI
- Initial PostgreSQL database schema with `users` and `issues` tables (`db/schema.sql`).
- Seed script (`backend/seed.js`) populating fictional accounts for all 5 roles and 8 realistic campus issues.
- REST API implementation in Node/Express (`backend/index.js`, `routes/auth.js`, `routes/issues.js`, `routes/users.js`, `middleware/auth.js`).
- Parameterised SQL queries with connection pooling and production SSL configuration (`backend/db.js`).
- Complete React frontend components adhering strictly to the design system mockups:
  - `Navbar` with role pill, active underline, and mobile hamburger menu.
  - `StatCard` with smooth count-up animation.
  - `StatusPill` and interactive `StatusSelect` with rotating chevrons and loading spinners.
  - `IssueTable` (desktop) and `IssueCard` (mobile stacked cards).
  - Client-side validation with field shake animations (`IssueForm`).
  - Modal confirmation (`ConfirmDeleteModal`) and sliding account drawer (`UserDrawer`).
  - Feedback alerts (`Toast`, `ErrorBanner`, `EmptyState`, `SkeletonLoader`).
- Automated test suite using Node built-in test runner (`backend/tests/api.test.js`).
- Documentation files: `README.md`, `DEPLOY.md`, `TESTING.md`, `DEFENSE_NOTES.md`.

## 4. Changes I Made to AI-Generated Code
- TODO (my own words): [Describe any code modifications, adjustments to styles, parameter names, or custom tweaks you made during your review and live defense preparation]

## 5. Errors and How I Resolved Them
- **PowerShell blocked the `npm` script shim**: Used `npm.cmd` for commands instead.
- **Sandbox blocked Node child processes (`spawn EPERM`)**: Reran the requested tests and build with the required execution permission.
- **An earlier local database URL was unreachable**: Once the Supabase connection was configured, the API tests completed successfully against PostgreSQL.

## 6. How I Tested and Verified AI-Generated Code
- Verified database schema structure and parameterised query implementations against SQL standards.
- Executed the backend API test suite (`npm test --prefix backend`) against the configured PostgreSQL database. The latest run reported 18 passing tests, including:
  - Server health endpoint status (200).
  - Unauthenticated access rejection (401).
  - Input validation for email format, password length, and required issue fields (400).
  - Role-based authorization: students forbidden from modifying status or deleting another user's issue (403); maintenance can update status but cannot delete; admins can delete.
  - Safe deletion rights and 404 responses for non-existent records.
- Built the React frontend production bundle using Vite (`npm run build`) ensuring zero compiler errors, clean asset bundling, and CSS purge verification.
- Verified single-page app rewrite files (`_redirects` and `vercel.json`) to prevent 404 errors on browser page reloads.

## 7. What I Learned
- TODO (my own words): [Summarize in your own words what you learned about full-stack role-based architecture, separating client and server deployments, handling CORS, writing parameterised SQL, and ensuring accessible UI motion]
