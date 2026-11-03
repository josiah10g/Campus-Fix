// backend/tests/api.test.js
// Automated test suite for CampusFix REST API & Auth checks
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../index');
const { pool } = require('../db');

// Test suite
test('CampusFix API End-to-End Tests', async (t) => {
  let studentToken = '';
  let studentUser = null;
  let maintenanceToken = '';
  let adminToken = '';
  let testRoleEmails = [];
  let publicFixtureIssueIds = [];
  let createdIssueId = null;

  t.before(async () => {
    const unique = Date.now();
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT');
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: `student_${unique}@example.com`,
        password: 'Password123!',
        role: 'student',
        faculty: 'Faculty of Testing',
        department: 'Test Studies',
        student_id: `TEST-${unique}`,
        level: '100 level',
      });
    
    if (studentRes.status === 201) {
      studentToken = studentRes.body.token;
      studentUser = studentRes.body.user;
      for (const [title, location, status, category] of [
        ['Public filter fixture one', 'Test Library', 'Open', 'Plumbing'],
        ['Public filter fixture two', 'Test Hall', 'Resolved', 'Electrical'],
      ]) {
        const issue = await pool.query(
          `INSERT INTO issues (title, description, category, location, status, reporter_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [title, 'Temporary automated test issue', category, location, status, studentUser.id]
        );
        publicFixtureIssueIds.push(issue.rows[0].id);
      }
    }

    const passwordHash = await bcrypt.hash('Password123!', 10);
    testRoleEmails = [`maintenance_${unique}@example.com`, `admin_${unique}@example.com`];

    await pool.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id',
      ['Test Maintenance', testRoleEmails[0], passwordHash, 'maintenance']
    );

    await pool.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id',
      ['Test Admin', testRoleEmails[1], passwordHash, 'admin']
    );

    const [maintenanceLogin, adminLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: testRoleEmails[0], password: 'Password123!' }),
      request(app).post('/api/auth/login').send({ email: testRoleEmails[1], password: 'Password123!' }),
    ]);

    maintenanceToken = maintenanceLogin.body.token;
    adminToken = adminLogin.body.token;
  });

  t.after(async () => {
    if (publicFixtureIssueIds.length) {
      await pool.query('DELETE FROM issues WHERE id = ANY($1)', [publicFixtureIssueIds]);
    }
    // Cleanup test users
    if (testRoleEmails.length > 0) {
      await pool.query('DELETE FROM users WHERE email = ANY($1)', [testRoleEmails]);
    }
    if (studentUser && studentUser.id) {
      await pool.query('DELETE FROM users WHERE id = $1', [studentUser.id]);
    }
  });

  await t.test('GET /api/health should return ok: true', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
  });

  await t.test('GET /api/public/stats returns stats without auth', async () => {
    const res = await request(app).get('/api/public/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.body.total, 'number');
    assert.strictEqual(typeof res.body.open, 'number');
    assert.strictEqual(typeof res.body.inProgress, 'number');
    assert.strictEqual(typeof res.body.resolved, 'number');
  });

  await t.test('GET /api/public/issues privacy guarantee: never includes reporter details or description', async () => {
    const res = await request(app).get('/api/public/issues?limit=20');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.issues));
    const fields = ['id', 'title', 'location', 'category', 'status', 'created_at'];
    for (const issue of res.body.issues) {
      assert.deepStrictEqual(Object.keys(issue).sort(), [...fields].sort());
      assert.strictEqual(issue.description, undefined, 'description must not be exposed');
      assert.strictEqual(issue.reporter_id, undefined, 'reporter_id must not be exposed');
      assert.strictEqual(issue.reporter_name, undefined, 'reporter_name must not be exposed');
      assert.strictEqual(issue.reporter_email, undefined, 'reporter_email must not be exposed');
      assert.ok(issue.id, 'must include id');
      assert.ok(issue.title, 'must include title');
      assert.ok(issue.location, 'must include location');
      assert.ok(issue.category, 'must include category');
      assert.ok(issue.status, 'must include status');
      assert.ok(issue.created_at, 'must include created_at');
    }
  });

  await t.test('GET /api/public/issues caps limit at 20', async () => {
    const res = await request(app).get('/api/public/issues?limit=50');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.issues.length <= 20);
    assert.strictEqual(res.body.issues.length, Math.min(res.body.total, 20));
  });

  await t.test('Public issues search by title or location, and filter by status and category', async () => {
    const all = await request(app).get('/api/public/issues?limit=20');
    assert.ok(all.body.issues.length > 0, 'seeded issues are required for filter checks');
    const sample = all.body.issues[0];
    const byTitle = await request(app).get(`/api/public/issues?search=${encodeURIComponent(sample.title)}&limit=20`);
    assert.ok(byTitle.body.issues.some((issue) => issue.id === sample.id));
    const byLocation = await request(app).get(`/api/public/issues?search=${encodeURIComponent(sample.location)}&limit=20`);
    assert.ok(byLocation.body.issues.some((issue) => issue.id === sample.id));
    const byStatus = await request(app).get(`/api/public/issues?status=${encodeURIComponent(sample.status)}&limit=20`);
    assert.ok(byStatus.body.issues.length > 0);
    assert.ok(byStatus.body.issues.every((issue) => issue.status === sample.status));
    const byCategory = await request(app).get(`/api/public/issues?category=${encodeURIComponent(sample.category)}&limit=20`);
    assert.ok(byCategory.body.issues.length > 0);
    assert.ok(byCategory.body.issues.every((issue) => issue.category === sample.category));
  });

  await t.test('Public issues paginate in SQL and reject invalid query parameters', async () => {
    const first = await request(app).get('/api/public/issues?page=1&limit=1');
    const second = await request(app).get('/api/public/issues?page=2&limit=1');
    assert.strictEqual(first.body.page, 1);
    assert.strictEqual(first.body.totalPages, first.body.total);
    assert.notStrictEqual(first.body.issues[0].id, second.body.issues[0].id);
    for (const query of ['status=Unknown', 'category=Unknown', 'page=0', 'page=1abc', 'limit=0', 'limit=1.5']) {
      const invalid = await request(app).get(`/api/public/issues?${query}`);
      assert.strictEqual(invalid.status, 400, `${query} should be rejected`);
      assert.ok(invalid.body.error);
    }
  });

  await t.test('Protected /api/issues still returns 401 without a token', async () => {
    const res = await request(app).get('/api/issues');
    assert.strictEqual(res.status, 401);
  });

  await t.test('POST /api/auth/register validates email format and password length', async () => {
    const badEmail = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'validPassword123!',
    });
    assert.strictEqual(badEmail.status, 400);

    const shortPassword = await request(app).post('/api/auth/register').send({
      name: 'Short Pass',
      email: 'valid@example.com',
      password: '123',
    });
    assert.strictEqual(shortPassword.status, 400);
  });

  await t.test('POST /api/auth/register requires student details and accepts staff type', async () => {
    const missingStudentDetails = await request(app).post('/api/auth/register').send({
      name: 'Student Missing Details',
      email: `missing_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'student',
    });
    assert.strictEqual(missingStudentDetails.status, 400);

    const lecturerEmail = `lecturer_${Date.now()}@example.com`;
    testRoleEmails.push(lecturerEmail);
    const staff = await request(app).post('/api/auth/register').send({
      name: 'Test Lecturer',
      email: lecturerEmail,
      password: 'Password123!',
      role: 'staff',
      staff_type: 'Lecturer',
    });
    assert.strictEqual(staff.status, 201);
    assert.strictEqual(staff.body.user.role, 'staff');
    assert.strictEqual(staff.body.user.staff_type, 'Lecturer');
  });

  await t.test('PUT /api/auth/profile updates account, student details, and optional picture', async () => {
    const changed = await request(app).put('/api/auth/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Updated Test Student', email: studentUser.email, password: 'ChangedPass123!',
        faculty: 'Faculty of Testing', department: 'Test Studies', student_id: studentUser.student_id,
        level: '200 level', profile_picture_url: 'data:image/png;base64,aGVsbG8=',
      });
    assert.strictEqual(changed.status, 200);
    assert.strictEqual(changed.body.user.name, 'Updated Test Student');
    assert.strictEqual(changed.body.user.level, '200 level');
    assert.strictEqual(changed.body.user.profile_picture_url, 'data:image/png;base64,aGVsbG8=');
    assert.strictEqual(changed.body.user.password_hash, undefined);
    const login = await request(app).post('/api/auth/login').send({ email: studentUser.email, password: 'ChangedPass123!' });
    assert.strictEqual(login.status, 200);
    studentToken = login.body.token;
    studentUser = changed.body.user;
  });

  await t.test('POST /api/auth/register ignores or rejects roles other than student/staff', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker Attempt',
      email: `hacker_${Date.now()}@example.com`,
      password: 'HackerPassword123!',
      role: 'super_admin',
      faculty: 'Faculty of Testing',
      department: 'Test Studies',
      student_id: `TEST-${Date.now()}`,
      level: '100 level',
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.user.role, 'student');
    await pool.query('DELETE FROM users WHERE id = $1', [res.body.user.id]);
  });

  await t.test('POST /api/issues requires details when category is Other', async () => {
    if (!studentToken) return;
    const res = await request(app).post('/api/issues')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'An unusual issue', description: 'Something needs attention', category: 'Other', location: 'Room 12' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Please describe the issue category.');
  });

  await t.test('POST /api/issues saves Other category detail', async () => {
    if (!studentToken) return;
    const created = await request(app).post('/api/issues')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Unusual campus issue', description: 'Temporary test issue', category: 'Other', category_detail: 'Pest control', location: 'Test location' });
    assert.strictEqual(created.status, 201);
    assert.strictEqual(created.body.category_detail, 'Pest control');
    await request(app).delete(`/api/issues/${created.body.id}`).set('Authorization', `Bearer ${studentToken}`);
  });

  await t.test('POST /api/issues validates input and returns 400 on empty title', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: '',
        description: 'Test description',
        category: 'Plumbing',
        location: 'Building A',
      });
    assert.strictEqual(res.status, 400);
  });

  await t.test('POST /api/issues creates valid issue with status Open', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Leaking tap in bathroom',
        description: 'Water running constantly in block 3',
        category: 'Plumbing',
        location: 'Block 3, 1st floor',
      });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.status, 'Open');
    assert.strictEqual(res.body.title, 'Leaking tap in bathroom');
    createdIssueId = res.body.id;
  });

  await t.test('GET /api/issues lists issues including the created one', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .get('/api/issues')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    const found = res.body.find((i) => i.id === createdIssueId);
    assert.ok(found, 'Created issue should be returned in issues list');
  });

  await t.test('GET /api/issues/:id returns single issue or 404 for missing id', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .get(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, createdIssueId);

    const notFound = await request(app)
      .get('/api/issues/9999999')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(notFound.status, 404);
  });

  await t.test('PUT /api/issues/:id forbids student from changing status (403)', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .put(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'Resolved' });
    assert.strictEqual(res.status, 403);
  });

  await t.test('PUT /api/issues/:id allows owner to edit details while Open', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .put(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Updated tap issue',
        description: 'Updated tap description',
        category: 'Plumbing',
        location: 'Block 3, 2nd floor',
      });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.title, 'Updated tap issue');
  });

  await t.test('DELETE /api/issues/:id deletes issue when called by owner while Open', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .delete(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(res.status, 200);

    const checkRes = await request(app)
      .get(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(checkRes.status, 404);
  });

  await t.test('DELETE /api/issues/:id returns 404 for non-existent issue', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .delete('/api/issues/9999999')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(res.status, 404);
  });

  await t.test('Issue status is read-only; maintenance cannot delete and admin can delete', async () => {
    const issue = await request(app).post('/api/issues').set('Authorization', `Bearer ${studentToken}`).send({
      title: 'Role permission test', description: 'Temporary test issue', category: 'Plumbing', location: 'Test location',
    });
    assert.strictEqual(issue.status, 201);
    const statusUpdate = await request(app).put(`/api/issues/${issue.body.id}`).set('Authorization', `Bearer ${maintenanceToken}`).send({ status: 'In Progress' });
    assert.strictEqual(statusUpdate.status, 403);
    assert.strictEqual(statusUpdate.body.error, 'Issue status is read-only.');
    const maintenanceDelete = await request(app).delete(`/api/issues/${issue.body.id}`).set('Authorization', `Bearer ${maintenanceToken}`);
    assert.strictEqual(maintenanceDelete.status, 403);
    const adminDelete = await request(app).delete(`/api/issues/${issue.body.id}`).set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(adminDelete.status, 200);
  });

  await t.test('Admins can view users and promote students or staff to admin', async () => {
    const list = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(list.status, 200);
    assert.ok(Array.isArray(list.body.users));
    assert.strictEqual(list.body.total, list.body.users.length);
    assert.strictEqual(list.body.users[0].password_hash, undefined);

    const adminCreatedEmail = `admin-created-${Date.now()}@example.com`;
    testRoleEmails.push(adminCreatedEmail);
    const adminCreated = await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Admin Created User', email: adminCreatedEmail, password: 'Password123!', role: 'student' });
    assert.strictEqual(adminCreated.status, 201);
    const changedRole = await request(app).put(`/api/users/${adminCreated.body.user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`).send({ role: 'maintenance' });
    assert.strictEqual(changedRole.status, 200);
    assert.strictEqual(changedRole.body.user.role, 'maintenance');
    const deleted = await request(app).delete(`/api/users/${adminCreated.body.user.id}`).set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(deleted.status, 200);

    const promote = await request(app).put(`/api/users/${studentUser.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`).send({ role: 'admin' });
    assert.strictEqual(promote.status, 200);
    assert.strictEqual(promote.body.user.role, 'admin');

    const forbidden = await request(app).put(`/api/users/${studentUser.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`).send({ role: 'super_admin' });
    assert.strictEqual(forbidden.status, 403);
  });

  await t.test('User management rejects students and unauthenticated requests', async () => {
    const response = await request(app).get('/api/users').set('Authorization', `Bearer ${maintenanceToken}`);
    assert.strictEqual(response.status, 403);
    const unauthenticated = await request(app).get('/api/users');
    assert.strictEqual(unauthenticated.status, 401);
  });
});
