# CampusFix – Campus Issue Reporting and Tracking System

A campus facility management and issue-tracking system developed for the CLBG Software Development Bootcamp End-of-Bootcamp Assessment.

CampusFix enables students and campus staff to report maintenance problems (broken lights, leaking taps, faulty Wi-Fi, damaged furniture) and track their resolution status in real time.

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
- **Update**: Edit issue details (title, category, location, description). Maintenance and admin accounts can update status inline directly from the dashboard.
- **Delete**: Safely delete issues with confirmation dialogs. Students can delete their own open reports; administrators can remove any issue.

### Role Permissions:
| Role | View All | Report Issue | Edit Details | Change Status | Delete Issue | User Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Student** | Yes | Yes | Own (if Open) | No | Own (if Open) | No |
| **Staff** | Yes | Yes | Own (if Open) | No | Own (if Open) | No |
| **Maintenance** | Yes | Yes | Any issue | Yes (Inline & Edit) | No | No |
| **Admin** | Yes | Yes | Any issue | Yes | Any issue | No |
| **Super Admin** | Yes | Yes | Any issue | Yes | Any issue | Yes (/users) |

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

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check `{ ok: true }` |
| `POST` | `/api/auth/register` | Public | Register student or staff account |
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `GET` | `/api/stats` | Authenticated | Summary counts: total, open, inProgress, resolved |
| `GET` | `/api/issues` | Authenticated | List all issues (supports `?status=`, `?category=`, `?search=`, `?myReports=`) |
| `GET` | `/api/issues/:id` | Authenticated | Get single issue details |
| `POST` | `/api/issues` | Authenticated | Report an issue (reporter ID extracted from JWT) |
| `PUT` | `/api/issues/:id` | Authenticated | Update issue details / status (role checked) |
| `DELETE` | `/api/issues/:id` | Authenticated | Delete issue (owner if open, or admin/super_admin) |
| `GET` | `/api/users` | Super Admin | List all users |
| `POST` | `/api/users` | Super Admin | Provision an account with any role |
| `PUT` | `/api/users/:id/role` | Super Admin | Change a user's role |

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

