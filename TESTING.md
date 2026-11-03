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
3. Privacy Guarantee: `GET /api/public/issues` never returns `description`, `reporter_id`, `reporter_name`, or `reporter_email`.
4. Rate limiting & limit cap: `GET /api/public/issues` caps query limit at 20 items.
5. Protected `/api/issues` still rejects unauthenticated requests with `401`.
6. Validation: `POST /api/auth/register` rejects invalid email formats and short passwords with `400`.
7. Role restriction: `POST /api/auth/register` ignores illegal roles and assigns `student`.
8. `POST /api/issues` rejects empty titles with `400`.
9. `POST /api/issues` creates an issue with default status `Open`.
10. `GET /api/issues` returns the issue list.
11. `GET /api/issues/:id` retrieves single issue; unknown ID returns `404`.
12. `PUT /api/issues/:id` forbids student from changing issue status with `403`.
13. `PUT /api/issues/:id` allows owner to edit details while status is `Open`.
14. `DELETE /api/issues/:id` allows owner to delete while `Open`.
15. `DELETE /api/issues/:id` returns `404` for non-existent IDs.
16. Role hierarchy: Maintenance updates status but cannot delete; Admin can delete any issue.
17. Authorization guard: Only super_admin can access `/api/users`.

---

## 2. Newcomer Journey & Manual Test Checklist

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
| **8. Student Status Guard** | Student on own Open issue: verify no status dropdown is available. | Status is displayed as a static pill, cannot be tampered with. | [ ] |
| **9. Maintenance Status Change** | Log in as `tunde@example.com` (Maintenance). Click status chevron on any issue. | Chevron rotates 180°, select "In Progress". Spinner shows briefly, status updates. | [ ] |
| **10. Maintenance Delete Guard** | Maintenance role viewing issues. | No "Delete" action button is rendered anywhere in UI. | [ ] |
| **11. Admin Delete** | Log in as `grace@example.com` (Admin). Click "Delete" on any issue. | Confirmation modal appears with backdrop blur. Press Escape -> cancels. Click "Delete issue" -> item fades out. | [ ] |
| **12. Super Admin Access** | Log in as `superadmin@example.com`. Check navbar. | "Users" link is visible in navbar. Navigate to `/users`. | [ ] |
| **13. Role Modification** | In `/users`, change a student's role to `maintenance`. | Role updates immediately in UI and database. Demoting last super admin is blocked. | [ ] |
| **14. Server Down / Error Banner** | Stop backend (`Ctrl+C`), refresh frontend. | Friendly error banner: "Connection or Server Error" with "Try again" button. No crash or white screen. | [ ] |
| **15. Responsive View** | Resize browser below 768px (mobile width). | Table transforms into individual cards; top navbar collapses into hamburger menu. | [ ] |
| **16. Reduced Motion** | Enable "prefers-reduced-motion" in browser dev tools. | All animations (shake, page fade, toast slide) become instant with zero layout shifts. | [ ] |
| **17. Refresh Persistence** | Refresh `/issues` or `/users` on live deployment. | SPA rewrites work seamlessly without returning 404. | [ ] |
| **18. CORS Verification** | Inspect network tab in live deployment. | API calls send `Origin` header and succeed without CORS errors. | [ ] |
| **19. Hover and focus** | Tab through controls; hover buttons, links, cards, and rows. | Visible focus rings remain; hover tint and active press feel quick. | [ ] |
