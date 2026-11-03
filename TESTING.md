# Testing Guide & Manual Checklist: CampusFix

## 1. Automated Test Suite

Backend tests use Node.js built-in test runner (`node:test`) and `supertest`:

```bash
cd backend
npm test
```

### Automated Checks Covered:
1. `GET /api/health` returns status `200` and `{ ok: true }`.
2. Unauthenticated requests to `/api/issues` are rejected with `401`.
3. Validation: `POST /api/auth/register` rejects invalid email formats and short passwords with `400`.
4. Role restriction: `POST /api/auth/register` ignores illegal roles and assigns `student`.
5. `POST /api/issues` rejects empty titles with `400` and clean error messages.
6. `POST /api/issues` creates an issue with default status `Open` and links the authenticated user.
7. `GET /api/issues` returns the issue list.
8. `GET /api/issues/:id` retrieves single issue; unknown ID returns `404`.
9. `PUT /api/issues/:id` forbids student from changing issue status with `403`.
10. `PUT /api/issues/:id` allows the reporter to edit details while status is `Open`.
11. `DELETE /api/issues/:id` allows owner to delete while `Open`.
12. `DELETE /api/issues/:id` returns `404` for non-existent IDs.

---

## 2. Manual Test Checklist (Local & Live)

| Check | Steps | Expected Result | Pass? |
| :--- | :--- | :--- | :---: |
| **1. Registration** | Navigate to `/register`. Fill name, valid email, 8+ char password. Choose student/staff. Submit. | Account created, redirected to `/issues`, welcome toast shown, user name in navbar. | [ ] |
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
| **20. Toast timing** | Trigger a success toast and an error toast. | Success dismisses after about 3 seconds; errors remain until dismissed. | [ ] |
| **21. Modal and drawer** | Open delete confirmation and user drawer; close by Escape, backdrop, and close control. | Both open and close cleanly without trapping the page. | [ ] |
| **22. Skeleton loading** | Throttle network and open the issues page. | Skeleton cards/rows appear while data loads. | [ ] |
