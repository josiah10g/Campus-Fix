# CampusFix – Campus Issue Reporting and Tracking System

A campus facility management and issue-tracking system developed for the CLBG Software Development Bootcamp End-of-Bootcamp Assessment.

CampusFix enables students and campus staff to report maintenance problems (broken lights, leaking taps, faulty Wi-Fi, damaged furniture) and track their resolution status in real time.

The public home page shows issue counts and recent issue titles, locations, categories, and statuses. It omits reporter identities and descriptions until a visitor signs in.

---

## 1. Problem Being Solved

On college campuses, facility issues frequently go unreported or unnoticed due to fragmented communication channels (informal WhatsApp messages, verbal reports to security, or lost paper logs). CampusFix solves this by providing:
- A single transparent web portal for tracking campus issues from creation to resolution.
- Clear status pipelines: **Open**, **In Progress**, and **Resolved**.
- Role-based permissions ensuring maintenance staff can update progress while preventing unauthorized tampering.

---

## 2. Features (CRUD & Roles)

### Core CRUD Operations:
- **Create**: Report an issue with title, category, campus location, and description. Form validates inputs on both client and server.
- **Read**: View all campus issues, view individual issue details, filter by status or category, and search by keywords.
- **Update**: Edit issue details (title, category, location, description). Issue status is read-only for every role.
- **Delete**: Safely delete issues with confirmation dialogs. Students can delete their own open reports; administrators can remove any issue.
- **Public view**: Visitors can see aggregate counts and a privacy-limited list of recent issues before creating an account.
- **Public guides**: `/how-it-works` explains the reporting steps and role permissions; `/latest-issues` provides a searchable, filterable, paginated read-only view.

### Role Permissions:
| Role | View All | Report Issue | Edit Details | Change Status | Delete Issue | User Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Student** | Yes | Yes | Own (if Open) | No (read-only) | Own (if Open) | No |
| **Staff** | Yes | Yes | Own (if Open) | No (read-only) | Own (if Open) | No |
| **Maintenance** | Yes | Yes | Any issue | No (read-only) | No | No |
| **Admin** | Yes | Yes | Any issue | No (read-only) | Any issue | Create, delete, and manage users (cannot manage super admins) |
| **Super Admin** | Yes | Yes | Any issue | No (read-only) | Any issue | Full user and role management |

Student sign-up also collects faculty, department, student ID, and level. Staff can sign up without selecting a staff type. Selecting **Other** as an issue category requires a short category description. Issue status is shown as a fixed-size read-only pill throughout the app and cannot be changed through the API.

Users can update their name, email, password, student details, and optional profile picture in **Profile settings**. Profile pictures are uploaded as PNG, JPEG, or WebP files up to 1 MB. Clicking the profile icon shows saved academic details.

### Public page routes
| Route | Description |
| :--- | :--- |
| `/` | Public homepage with short previews linking to the full public pages. |
| `/how-it-works` | Static guide to reporting, statuses, and role permissions. |
| `/latest-issues` | Public read-only issue list with search, status/category filters, and pagination. URL query parameters preserve the current filters and page. |

---

## 3. Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router v6.
- **Backend**: Node.js, Express REST API, CORS, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`).
- **Database**: PostgreSQL with plain SQL via `pg` (parameterised queries `$1, $2`, no ORM).
- **Deployment**:
  - Backend: Render Web Service (Node.js).
  - Frontend: Render Static Site / Netlify / Vercel with single-page application rewrites.

---

## 4. Demo Accounts (Fictional Data Only)

All demo accounts share the password: `DemoPass123!`

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Student** | Amina Yusuf | `amina@example.com` | `DemoPass123!` |
| **Staff** | David Mwangi | `david@example.com` | `DemoPass123!` |
| **Maintenance** | Tunde Bello | `tunde@example.com` | `DemoPass123!` |
| **Admin** | Grace Okoro | `grace@example.com` | `DemoPass123!` |
| **Super Admin** | Super Admin | Set through `SUPER_ADMIN_EMAIL` | Set through `SUPER_ADMIN_PASSWORD` |

*(The super_admin account is automatically seeded or created on server startup from environment variables).*

---

## 5. Local Setup Step-by-Step

### Prerequisites
- Node.js (v18+) & npm
- PostgreSQL database (local or hosted instance such as Neon)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd "Campus Fix"
```

### 2. Backend Setup
```bash
cd backend
# Create .env from template
cp .env.example .env
```
Edit `backend/.env` with your PostgreSQL connection string:
```ini
PORT=3000
DATABASE_URL=your_supabase_postgres_connection_string
JWT_SECRET=your_long_random_secret
SUPER_ADMIN_EMAIL=your_admin_email
SUPER_ADMIN_PASSWORD=your_admin_password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Install backend dependencies and seed the database:
```bash
npm install
npm run seed
npm start
```
*The server will start at `http://localhost:3000`.*

For a database that still uses the earlier `reporter_name` column, back it up and run `db/migrations/001_reporter_name_to_users.sql` once before deploying this version. It preserves reports and creates password-reset-required legacy user accounts.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
# Create .env from template
cp .env.example .env
```
Edit `frontend/.env`:
```ini
VITE_API_URL=http://localhost:3000
```

Install dependencies and start development server:
```bash
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## 6. API Endpoints Table

All protected routes require an `Authorization: Bearer <token>` header.

Public endpoints are available without a token: `GET /api/public/stats` and `GET /api/public/issues`. The issue list intentionally excludes reporter names, email addresses, and descriptions.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check `{ ok: true }` |
| `GET` | `/api/public/stats` | Public | Live counts: total, open, inProgress, resolved (rate limited) |
| `GET` | `/api/public/issues` | Public | Safe issue page; supports search (title/location), status, category, page, and limit (default 8, max 20). Returns `{ issues, total, page, totalPages }`. |
| `POST` | `/api/auth/register` | Public | Register student or staff account |
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update own account and profile details |
| `GET` | `/api/stats` | Authenticated | Summary counts: total, open, inProgress, resolved |
| `GET` | `/api/issues` | Authenticated | List all issues (supports `?status=`, `?category=`, `?search=`, `?myReports=`) |
| `GET` | `/api/issues/:id` | Authenticated | Get single issue details |
| `POST` | `/api/issues` | Authenticated | Report an issue (reporter ID extracted from JWT) |
| `PUT` | `/api/issues/:id` | Authenticated | Update issue details; status is read-only |
| `DELETE` | `/api/issues/:id` | Authenticated | Delete issue (owner if open, or admin/super_admin) |
| `GET` | `/api/users` | Admin, Super Admin | List all users and account count |
| `POST` | `/api/users` | Admin, Super Admin | Create an account; only super admin can create another super admin |
| `PUT` | `/api/users/:id/role` | Admin, Super Admin | Change user roles; only super admin can manage super admins |
| `DELETE` | `/api/users/:id` | Admin, Super Admin | Delete a user and their reports; last super admin is protected |

---

## 7. Testing Instructions

### Automated Tests
Run backend automated test suite:
```bash
cd backend
npm test
```
*Covers authentication, input validation (400), CRUD operations, 401 unauthenticated checks, 403 status tampering prevention, and 404 missing record handling.*

### Manual Tests
Refer to [TESTING.md](TESTING.md) for full interactive test checklist.

---

## 8. Live Deployment

- **Frontend Live URL**: https://campus-fix-ochre.vercel.app
- **Backend API URL**: https://campus-fix-bic4.onrender.com

*(See [DEPLOY.md](DEPLOY.md) for deployment walkthrough on Render and hosted Postgres).*

---

## 9. Screenshots / Design Mockups

Design mockups are saved in the [`docs/mockups/`](docs/mockups/) directory:

| # | Screen | File |
|---|--------|------|
| 00 | Design System (colours, fonts, tokens) | `00-design-system.png` |
| 01 | Auth – Login / Register | `01-auth-login-register.png` |
| 02 | Dashboard – Student / Staff view | `02-dashboard-student-staff.png` |
| 03 | Dashboard – Maintenance view | `03-dashboard-maintenance.png` |
| 04 | Dashboard – Admin view | `04-dashboard-admin.png` |
| 05 | Dashboard – Super Admin view | `05-dashboard-super-admin.png` |
| 06 | Forms – Report, Edit, Delete modal | `06-forms-report-edit-delete.png` |
| 07 | Users page – Super Admin | `07-users-super-admin.png` |
| 08 | Issue Detail & Feedback states | `08-issue-detail-and-feedback-states.png` |
| 09 | Mobile responsive views | `09-mobile-views.png` |
| 10 | Public Homepage (landing page) | `10-public-homepage.png` |
| 11 | Welcome Banner & Empty State | `11-welcome-after-signup.png` |

