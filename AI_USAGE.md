# AI Usage Statement: CampusFix

## 1. AI Tools Used
- Google Antigravity (Powered by Gemini 3.8 Flash model)

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
- **Execution policy block on PowerShell for npm scripts**: When running `npm -v` in PowerShell, the system blocked execution due to script policies. Resolved by using `npm.cmd` explicitly.
- **npm install pathing issue with --prefix on Windows**: When running `npm install --prefix backend` from the root directory, npm attempted to read a non-existent `package.json` in the root workspace. Resolved by switching the directory context using `Push-Location backend` and running `npm.cmd install` within each application directory.
- **PowerShell syntax error with '&&' separator**: PowerShell threw a syntax error when using bash-style `&&` chaining in command lines. Resolved by using standard PowerShell `;` separators.

## 6. How I Tested and Verified AI-Generated Code
- Verified database schema structure and parameterised query implementations against SQL standards.
- Executed automated backend unit and integration test scripts (`node --test tests/api.test.js`) verifying:
  - Server health endpoint status (200).
  - Unauthenticated access rejection (401).
  - Input validation for email format, password length, and required issue fields (400).
  - Role-based authorization: students forbidden from modifying status (403), maintenance permitted to update status inline.
  - Safe deletion rights and 404 responses for non-existent records.
- Built the React frontend production bundle using Vite (`npm run build`) ensuring zero compiler errors, clean asset bundling, and CSS purge verification.
- Verified single-page app rewrite files (`_redirects` and `vercel.json`) to prevent 404 errors on browser page reloads.

## 7. What I Learned
- TODO (my own words): [Summarize in your own words what you learned about full-stack role-based architecture, separating client and server deployments, handling CORS, writing parameterised SQL, and ensuring accessible UI motion]
