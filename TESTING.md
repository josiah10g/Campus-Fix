# Testing Guide & Manual Checklist: CampusFix

## 1. Automated Test Suite

Backend tests use Node.js built-in test runner (`node:test`) and `supertest`:

```bash
cd backend
npm test
```

### Automated Checks Covered:
1. `GET /api/health` returns status `200` and `{ ok: true }`.
2. Public Stats: `GET /api/public/stats` returns total, open, inProgress, and resolved counts without authentication.
3. Public issue search matches title and location; status and category filters return only matching rows.
4. Public pagination uses SQL paging and returns `issues`, `total`, `page`, and `totalPages`; limit values are capped at 20.
5. Invalid public status, category, page, or limit values return `400` with a clear message.
6. Privacy Guarantee: `GET /api/public/issues` returns only `id`, `title`, `location`, `category`, `status`, and `created_at`, never description or reporter fields.
7. Protected `/api/issues` still rejects unauthenticated requests with `401`.
8. Validation: `POST /api/auth/register` rejects invalid email formats and short passwords with `400`.
9. Role restriction: `POST /api/auth/register` ignores illegal roles and assigns `student`.
10. `POST /api/issues` rejects empty titles with `400`.
11. `POST /api/issues` creates an issue with default status `Open`.
12. `GET /api/issues` returns the issue list.
13. `GET /api/issues/:id` retrieves single issue; unknown ID returns `404`.
14. `PUT /api/issues/:id` forbids any user from changing issue status with `403`.
15. `PUT /api/issues/:id` allows owner to edit details while status is `Open`.
16. `DELETE /api/issues/:id` allows owner to delete while `Open` and returns `404` for missing IDs.
17. Maintenance cannot delete; Admin can delete any issue.
18. Admins can create/delete accounts and change roles except for super_admin; super_admin can fully manage accounts.
19. Student registration requires faculty, department, student ID, and level; staff must choose Lecturer or Maintenance officer.
20. An issue with category `Other` requires a custom category description.
21. `PUT /api/auth/profile` updates the current account and never returns the password hash.
22. Admins can create/delete accounts and change roles except to or from `super_admin`; super admins retain full role control.

---

## 2. Newcomer Journey & Manual Test Checklist

### Public Pages
1. While logged out, open `/how-it-works` and `/latest-issues`; confirm both pages render and the public navbar uses real routes.
2. On `/how-it-works`, check all four steps, the Open â†’ In progress â†’ Resolved status path, status permission note, five-role permission table, and sign-up call to action.
3. On `/latest-issues`, try title/location search, each status, and each category; confirm rows match the filters.
4. Use Previous and Next; confirm there are 8 issues per page at most and the page count/disabled buttons are correct.
5. Refresh after choosing filters or a page; confirm the URL query string restores the same view.
6. Clear filters from an empty result; confirm the full list returns. Simulate a failed request and use â€œTry againâ€.
7. Resize to mobile; confirm filters stack and the table becomes read-only cards. Repeat both public routes while logged in.
8. Check hover and keyboard focus styles, enable reduced motion, and confirm the public pages stop moving content. Use a slow network to see skeleton rows, then verify stat counts and row entrance effects. Existing modal/drawer and toast interactions can be checked from the protected app.
9. Confirm page scrolling is smooth with normal motion enabled; hover buttons and cards for the teal glow; check text is easier to read; and use the â€œGo back to the home pageâ€ link on both Login and Register.

### Full Newcomer Journey Checklist:
1. **Public Landing (Logged Out)**: Visit `/`. Confirm the public navbar has "Log in" and "Create account". Check the headline *"Report it once. Watch it get fixed."*, 4 live stat cards, "How it works" 3 steps, and read-only "Latest issues" table (omitting reporter names and descriptions).
2. **Intent-Preserving Redirect**: Click "Sign up and report an issue" or attempt to open `/report` directly while logged out. Verify redirect to `/register?next=/report` (or `/login?next=/report`).
3. **Register & Auto-Login**: Fill out the registration form. Notice automatic login and landing on the intended page.
4. **Welcome Banner**: If landing on `/issues`, observe the yellow-accented Welcome Banner: *"Welcome to CampusFix, [Name]"*.
5. **Dismiss Welcome**: Click "Dismiss". Refresh the page or log out and log back in; verify the banner does NOT reappear (stored in `localStorage`).
6. **Friendly Empty State**: Navigate to "My reports" tab when you have no reports submitted. Confirm the friendly empty state shows: *"You have not reported anything yet"* with both **Report an issue** and **Browse issues** buttons.
7. **Logged-In Homepage View**: While logged in, navigate back to `/`. Confirm the navbar displays your user name, role chip, and "Go to dashboard", while the hero button reflects "Report an issue".

| Check | Steps | Expected Result | Pass? |
| :--- | :--- | :--- | :---: |
| **1. Registration** | Navigate to `/register`. Fill name, valid email, 8+ char password. Choose student/staff. Submit. | Account created, redirected to `/issues`, welcome banner shown, user name in navbar. | [ ] |
| **2. Login** | Log out, go to `/login`. Enter invalid password. | Inline error banner: "Invalid email or password." | [ ] |
| **3. Valid Login** | Log in with `amina@example.com` (`DemoPass123!`). | Successfully logs in, navbar shows role badge "Student". | [ ] |
| **4. Create Issue** | Click "Report an issue". Leave title empty and click submit. | Title input shakes, red border appears, error message "Title is required". | [ ] |
| **5. Create Valid** | Fill Title, select Category, enter Location and Description. Submit. | Redirects to `/issues`, new row highlights in pale yellow, green toast appears. | [ ] |
| **6. View Details** | Click "View" on an issue. | Detail page displays full text, category, location, reporter, and date. | [ ] |
| **7. Student Edit** | Logged in as student: click "Edit" on own Open issue. Change location. | Update succeeds, green toast appears. | [ ] |
| **8. Read-only status** | Open an issue as any role; try a direct API status update. | Status is a fixed-size pill without a dropdown; API returns 403 if changed. | [ ] |
| **9. Signup profile details** | Register as student, then staff. | Students provide faculty, department, student ID, and level; staff selects Lecturer or Maintenance officer. | [ ] |
| **10. Other issue category** | Create an issue with category Other. | A custom category description is required, saved, and displayed. | [ ] |
| **11. Admin user management** | As admin, open Users and promote a student/staff account. | Account count appears; Admin can promote to admin only. | [ ] |
| **12. Super Admin Access** | Log in as super_admin and open Users. | Full role management and account creation are available. | [ ] |
| **13. No demo autofill** | Open Login while logged out. | Quick demo account autofill chips are absent. | [ ] |
| **14. Server Down / Error Banner** | Stop backend (`Ctrl+C`), refresh frontend. | Friendly error banner: "Connection or Server Error" with "Try again" button. No crash or white screen. | [ ] |
| **15. Responsive View** | Resize browser below 768px (mobile width). | Table transforms into individual cards; top navbar collapses into hamburger menu. | [ ] |
| **16. Reduced Motion** | Enable "prefers-reduced-motion" in browser dev tools. | All animations (shake, page fade, toast slide) become instant with zero layout shifts. | [ ] |
| **17. Refresh Persistence** | Refresh `/issues` or `/users` on live deployment. | SPA rewrites work seamlessly without returning 404. | [ ] |
| **18. CORS Verification** | Inspect network tab in live deployment. | API calls send `Origin` header and succeed without CORS errors. | [ ] |
| **19. Hover and focus** | Tab through controls; hover buttons, links, cards, and rows. | Visible focus rings remain; hover tint and active press feel quick. | [ ] |
| **20. Profile settings** | From the dashboard or profile menu, update name/email and optionally password and picture. | Changes persist after refresh; academic details appear from the profile menu. | [ ] |
| **21. Admin user actions** | As Admin, create an account, change another user's role, then delete a different account. | User count updates; Admin cannot create, edit, or delete super admins. | [ ] |
| **22. Toast position and readability** | Trigger success and error messages; view stats and auth pages. | Toasts appear bottom-right; stat labels and supporting text are easy to read. | [ ] |
