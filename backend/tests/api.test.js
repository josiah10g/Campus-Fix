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
  let createdIssueId = null;

  t.before(async () => {
    const unique = Date.now();
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: `student_${unique}@example.com`,
        password: 'Password123!',
        role: 'student',
      });
    
    if (studentRes.status === 201) {
      studentToken = studentRes.body.token;
      studentUser = studentRes.body.user;
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
    const res = await request(app).get('/api/public/issues');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    for (const issue of res.body) {
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
    assert.ok(res.body.length <= 20);
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

  await t.test('POST /api/auth/register ignores or rejects roles other than student/staff', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker Attempt',
      email: `hacker_${Date.now()}@example.com`,
      password: 'HackerPassword123!',
      role: 'super_admin',
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.user.role, 'student');
    await pool.query('DELETE FROM users WHERE id = $1', [res.body.user.id]);
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

  await t.test('Maintenance can change status but cannot delete; admin can delete', async () => {
    const issue = await request(app).post('/api/issues').set('Authorization', `Bearer ${studentToken}`).send({
      title: 'Role permission test', description: 'Temporary test issue', category: 'Other', location: 'Test location',
    });
    assert.strictEqual(issue.status, 201);
    const statusUpdate = await request(app).put(`/api/issues/${issue.body.id}`).set('Authorization', `Bearer ${maintenanceToken}`).send({ status: 'In Progress' });
    assert.strictEqual(statusUpdate.status, 200);
    const maintenanceDelete = await request(app).delete(`/api/issues/${issue.body.id}`).set('Authorization', `Bearer ${maintenanceToken}`);
    assert.strictEqual(maintenanceDelete.status, 403);
    const adminDelete = await request(app).delete(`/api/issues/${issue.body.id}`).set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(adminDelete.status, 200);
  });

  await t.test('Only super_admin can access user management', async () => {
    const response = await request(app).get('/api/users').set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(response.status, 403);
  });
});
