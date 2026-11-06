# 🏫 CampusFix – Campus Facility Reporting & Issue Tracking Portal

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **"Report it once. Watch it get fixed."**  
> A transparent university facility management platform that gives every broken light, leaking pipe, faulty Wi-Fi hub, and damaged desk a single place to be reported, prioritized, and tracked through to resolution.

---


---

## 📖 Table of Contents
1. [Problem Statement & Solution](#-problem-statement--solution)
2. [Step-by-Step Task & User Guides](#-step-by-step-task--user-guides)
3. [Academic Affiliation & Programmes](#-academic-affiliation--programmes)
4. [User Roles & Permissions Matrix](#-user-roles--permissions-matrix)
5. [Tech Stack & Architecture](#-tech-stack--architecture)
6. [Demo Accounts](#-demo-accounts)
7. [Local Installation & Setup](#-local-installation--setup)
8. [API Endpoints Reference](#-api-endpoints-reference)

---

## 🎯 Problem Statement & Solution

### The Challenge
On college campuses, maintenance issues (such as broken laboratory sockets, failing hallway lighting, or washroom leaks) frequently go unresolved for months. Reports are fragmented across verbal messages to security guards, informal WhatsApp groups, or paper logbooks that get misplaced. Students have no visibility into whether anyone has acknowledged the hazard.

### The CampusFix Solution
1. **Public Community Visibility**: Anyone can view live campus issue counts and anonymized recent reports without logging in.
2. **Standardized Facility Reporting**: Students and staff submit structured reports complete with category, precise campus location, and description.
3. **Transparent Pipeline**: Every issue passes through clear statuses: `Open` ➜ `In Progress` ➜ `Resolved`.
4. **Academic Affiliation Visibility**: Campus maintenance and administrators immediately see the reporter's **Faculty**, **Department**, **Level**, and **Student/Staff ID** right on the report, allowing facilities teams to quickly verify locations and contact reporters if needed.
5. **Role-Based Control**: Protects status updates from unauthorized tampering while empowering administrators with comprehensive user and account controls.

---

## 🚀 Step-by-Step Task & User Guides

### 1. How a New Student Registers & Reports an Issue
1. **Open the Homepage** (`/`):
   - Click the primary button **"Sign up and report an issue"** (or click **Report an issue**).
2. **Complete Registration** (`/register`):
   - Select **Student** as your campus role.
   - Choose your **Programme**: `Undergraduate` or `Postgraduate`.
   - Select your **Faculty / College** from the dynamic dropdown (e.g., *Faculty of Computing Studies*, *College of Health Sciences*, *Faculty of Engineering*).
   - Select your specific **Department** (e.g., *Software Engineering*, *Computer Science*, *Cyber Security*).
   - Enter your **Student ID / Matric** number.
   - Choose your **Level** (`100 Level` through `500 Level`, or choose `Other` to specify your custom level).
   - Enter your full name, email, password, and confirm password. Click **Create account**.
3. **First-Time Welcome**:
   - You land directly on the **Campus Dashboard** (`/issues`) with a dismissible welcome banner.
4. **Submitting a Report** (`/report`):
   - Click **"Report an issue"** in the top navigation or dashboard.
   - Choose a Category (*Electrical*, *Plumbing*, *Furniture*, *Network*, or *Other*). If *Other* is chosen, specify a short category description.
   - Specify the exact campus location (e.g. *Science Block Room 204*).
   - Detail the problem and submit. Your report appears on the dashboard with an `Open` status pill.

---

### 2. How to Track & Filter Issues
- **Dashboard Search**: Type keywords into the search bar to locate issues by title or description.
- **Filter Dropdowns**: Filter by Status (*Open*, *In Progress*, *Resolved*) or Category.
- **View Modes**:
  - **All issues**: Displays every reported campus fault with pagination (8 issues per page).
  - **My reports**: Shows only reports submitted by your account.
- **View Details** (`/issues/:id`):
  - Click **"View"** on any row or card to inspect the full description, submission timestamp, and the **Reporter Academic Profile** card showing the reporter's Faculty, Department, Student ID, and Level.

---

### 3. How Maintenance & Administrators Manage Reports
- **Maintenance Staff**:
  - Can view all reports and edit details or locations.
  - Review reporter department and level to schedule on-site repairs efficiently.
- **Administrators**:
  - Full management privileges across all campus reports and accounts.
  - Can delete resolved or duplicate issues.

---

### 4. How Administrators Manage Campus Users (`/users`)
1. **Accessing User Management**:
   - Log in as an Admin or Super Admin and click **User Management** in the navbar or user menu.
2. **Promoting Roles**:
   - Change user roles between *Student*, *Staff member*, *Maintenance staff*, and *Admin* via the dropdown in the table.
3. **Deleting an Account**:
   - Click **"Delete user"**. An **in-app card confirmation modal** appears with safety warnings. Confirming permanently removes the account.

---

### 5. How Users Update Profile & Academic Status (`/profile`)
1. Click your **avatar / user chip** in the top-right navbar and select **Profile settings**.
2. Update your full name, email, and academic details (**Faculty**, **Department**, **Student / Staff ID**, **Level**).
3. Optionally upload a profile photo (PNG, JPEG, WebP up to 1 MB).
4. **Password Changes**:
   - Provide your **New password** and **Confirm new password**.
   - Privileged roles (Admin, Maintenance) are required to verify their **Current password**.
5. Click **"Save changes"**. The system saves your details and redirects you back to the campus dashboard with a success toast.

---

## 🎓 Academic Affiliation & Programmes

CampusFix includes dynamic, cascading dropdowns populated with full university academic faculties and departments:

| Programme | Sample Faculties Covered | Sample Departments Included |
| :--- | :--- | :--- |
| **Undergraduate** | College of Health Sciences<br>Faculty of Computing Studies<br>Faculty of Engineering<br>Faculty of Arts & Social Sciences<br>Faculty of Environmental Sciences<br>Faculty of Law<br>Faculty of Management Sciences<br>Faculty of Science | Medicine & Surgery, Public Health, Anatomy, Physiology<br>Software Engineering, Computer Science, Cyber Security, Data Science<br>Electrical & Electronics, Mechanical, Civil, Mechatronics<br>Economics, Mass Communication, Political Science, Psychology<br>Architecture, Building, Estate Management, Quantity Surveying<br>Law (LLB)<br>Accounting, Banking & Finance, Business Administration<br>Biochemistry, Biotechnology, Microbiology, Physics, Math |
| **Postgraduate** | College of Health Sciences<br>Faculty of Computing Studies<br>Faculty of Engineering<br>Faculty of Arts & Social Sciences<br>Faculty of Management Sciences<br>Faculty of Science<br>Faculty of Law | (MPH) Public Health<br>(PGD / M.Sc. / PhD) Computer Science, IT, Software Eng<br>(PGD / M.Eng. / PhD) Electrical, Civil, Petroleum & Gas<br>(PGD / M.Sc. / MPhil / PhD) Economics, Mass Comm, Int'l Relations<br>(PGD / M.Sc. / PhD / MBA / EMBA) Accounting, Management<br>(PGD / M.Sc. / PhD) Biology, Analytical Chemistry, Industrial Chem<br>(PGD / LLM / PhD) Law |

- **Levels**: `100 Level`, `200 Level`, `300 Level`, `400 Level`, `500 Level`, plus an **Other** option with a text field for custom levels.

---

## 🛡️ User Roles & Permissions Matrix

| Permission | Student | Staff | Maintenance | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Browse Public Homepage & Recent Issues** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Submit New Issue Report** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Full Report & Reporter Profile** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Own Open Issue** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Edit Any Issue Details** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Delete Own Open Issue** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete Any Issue** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Users & Role Assignment** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Super Admin Accounts** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 💻 Tech Stack & Architecture

```
CampusFix Architecture:
┌────────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
│  React 18 + Vite (SPA) │ ◄─────► │ Express REST API       │ ◄─────► │ PostgreSQL (Supabase)  │
│  Tailwind CSS          │  HTTPS  │ Node.js, JWT, Bcrypt   │  Pooler │ Parameterized SQL      │
│  Lucide Icons          │         │ express-rate-limit     │ Port    │ Foreign Keys & Indexes │
└────────────────────────┘         └────────────────────────┘ 6543    └────────────────────────┘
```

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js & Express REST API, CORS, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), Rate Limiting (`express-rate-limit`).
- **Database**: PostgreSQL with parameterized queries (`$1, $2`, no ORM) for SQL-injection prevention.

---

## 👥 Demo Accounts

All pre-seeded demo accounts use the standard password: `DemoPass123!`

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Student** | Amina Yusuf | `amina@example.com` | `DemoPass123!` |
| **Staff** | David Mwangi | `david@example.com` | `DemoPass123!` |
| **Maintenance** | Tunde Bello | `tunde@example.com` | `DemoPass123!` |
| **Admin** | Grace Okoro | `grace@example.com` | `DemoPass123!` |

*(Super Admin is configured securely on deployment via environment variables).*

---

## 🛠️ Local Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL database instance (or Supabase URL)

### 2. Clone Repository
```bash
git clone https://github.com/josiah10g/Campus-Fix.git
cd Campus-Fix
```

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
```
Fill in your `backend/.env`:
```ini
PORT=3000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key_here
SUPER_ADMIN_EMAIL=admin@campusfix.internal
SUPER_ADMIN_PASSWORD=SecureAdminPass123!
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```
Install dependencies and run:
```bash
npm install
npm run seed
npm start
```
*Backend runs on `http://localhost:3000`.*

### 4. Frontend Setup
```bash
cd ../frontend
cp .env.example .env
```
Edit `frontend/.env`:
```ini
VITE_API_URL=http://localhost:3000
```
Install dependencies and run:
```bash
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📡 API Endpoints Reference

### Public Routes (No Authentication Required)
- `GET /api/health` – Server health status check.
- `GET /api/public/stats` – Public issue counts (`total, open, inProgress, resolved`). Rate-limited.
- `GET /api/public/issues` – Anonymized issues list (excludes reporter identities and descriptions).
- `POST /api/auth/register` – Register as a Student or Staff member.
- `POST /api/auth/login` – Authenticate with email and password to receive JWT.

### Protected Routes (Requires `Authorization: Bearer <token>`)
- `GET /api/auth/me` – Retrieve authenticated user profile.
- `PUT /api/auth/profile` – Update full name, email, academic details, and password.
- `GET /api/stats` – Authenticated dashboard stats.
- `GET /api/issues` – List issues with filtering (`?status=`, `?category=`, `?search=`, `?myReports=`).
- `GET /api/issues/:id` – Retrieve complete issue details including reporter academic profile.
- `POST /api/issues` – Submit a new issue report.
- `PUT /api/issues/:id` – Update issue details (status is read-only).
- `DELETE /api/issues/:id` – Delete an issue (owner if open, or admin).
- `GET /api/users` – Admin listing of campus accounts.
- `POST /api/users` – Admin user creation drawer.
- `PUT /api/users/:id/role` – Admin role assignment.
- `DELETE /api/users/:id` – Admin user deletion.

---

© 2026 CampusFix. Facility Management & Issue Resolution Portal.
