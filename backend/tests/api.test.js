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
  let testRoleIds = [];
  let registeredTestEmails = [];
  let createdIssueId = null;

  t.before(async () => {
    const unique = Date.now();
    registeredTestEmails.push(`student_${unique}@example.com`);
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: registeredTestEmails[0],
        password: 'Password123!',
        role: 'student',
      });
    
    if (studentRes.status === 201) {
      studentToken = studentRes.body.token;
      studentUser = studentRes.body.user;
    }
    const passwordHash = await bcrypt.hash('Password123!', 10);
    testRoleEmails = [`maintenance_${unique}@example.com`, `admin_${unique}@example.com`];
    const maintenance = await pool.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id',
      ['Test Maintenance', testRoleEmails[0], passwordHash, 'maintenance']
    );
    const admin = await pool.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id',
      ['Test Admin', testRoleEmails[1], passwordHash, 'admin']
    );
    const [maintenanceLogin, adminLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: testRoleEmails[0], password: 'Password123!' }),
      request(app).post('/api/auth/login').send({ email: testRoleEmails[1], password: 'Password123!' }),
    ]);
    maintenanceToken = maintenanceLogin.body.token;
    adminToken = adminLogin.body.token;
    testRoleIds = [maintenance.rows[0].id, admin.rows[0].id];
  });

  t.after(async () => {
    if (testRoleIds.length) {
      await pool.query('DELETE FROM issues WHERE reporter_id = ANY($1::int[])', [testRoleIds]);
      await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [testRoleEmails]);
    }
    if (registeredTestEmails.length) {
      await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [registeredTestEmails]);
    }
    await pool.end();
  });

  await t.test('GET /api/health should return ok: true', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
  });

  await t.test('Public homepage APIs return counts and issue fields without reporter identity', async () => {
    const stats = await request(app).get('/api/public/stats');
    assert.strictEqual(stats.status, 200);
    assert.deepStrictEqual(Object.keys(stats.body).sort(), ['inProgress', 'open', 'resolved', 'total']);
    const latest = await request(app).get('/api/public/issues?limit=4');
    assert.strictEqual(latest.status, 200);
    assert.ok(Array.isArray(latest.body));
    assert.ok(latest.body.length <= 4);
    for (const issue of latest.body) {
      assert.strictEqual(issue.reporter_name, undefined);
      assert.strictEqual(issue.reporter_email, undefined);
      assert.strictEqual(issue.description, undefined);
    }
  });

  await t.test('Unauthenticated request to /api/issues returns 401', async () => {
    const res = await request(app).get('/api/issues');
    assert.strictEqual(res.status, 401);
    assert.ok(res.body.error);
  });

  await t.test('POST /api/auth/register validates email format and password length', async () => {
    const badEmail = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad User', email: 'invalid-email', password: 'Password123!' });
    assert.strictEqual(badEmail.status, 400);

    const shortPass = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad User', email: 'valid@example.com', password: '123' });
    assert.strictEqual(shortPass.status, 400);
  });

  await t.test('POST /api/auth/register ignores or rejects roles other than student/staff', async () => {
    const email = `hacker_${Date.now()}@example.com`;
    registeredTestEmails.push(email);
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker User',
        email,
        password: 'Password123!',
        role: 'super_admin',
      });
    // System should default the user to student, never grant super_admin
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.user.role, 'student');
    assert.strictEqual(res.body.user.password_hash, undefined);
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
    assert.strictEqual(res.body.error, 'Title is required.');
  });

  await t.test('POST /api/issues creates valid issue with status Open', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Broken fluorescent bulb',
        description: 'Flickering incessantly in classroom 204',
        category: 'Electrical',
        location: 'Classroom 204',
      });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.title, 'Broken fluorescent bulb');
    assert.strictEqual(res.body.status, 'Open');
    assert.strictEqual(res.body.reporter_name, studentUser.name);
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
    assert.ok(found);
  });

  await t.test('GET /api/issues/:id returns single issue or 404 for missing id', async () => {
    if (!studentToken) return;
    const resSuccess = await request(app)
      .get(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(resSuccess.status, 200);
    assert.strictEqual(resSuccess.body.id, createdIssueId);

    const resMissing = await request(app)
      .get('/api/issues/9999999')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(resMissing.status, 404);
  });

  await t.test('PUT /api/issues/:id forbids student from changing status (403)', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .put(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'Resolved',
      });
    assert.strictEqual(res.status, 403);
  });

  await t.test('PUT /api/issues/:id allows owner to edit details while Open', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .put(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Broken fluorescent bulb (Updated)',
      });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.title, 'Broken fluorescent bulb (Updated)');
  });

  await t.test('DELETE /api/issues/:id deletes issue when called by owner while Open', async () => {
    if (!studentToken) return;
    const res = await request(app)
      .delete(`/api/issues/${createdIssueId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(res.status, 200);

    // Verify subsequent lookup returns 404
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

    const someoneElsesIssue = await request(app).post('/api/issues').set('Authorization', `Bearer ${adminToken}`).send({
      title: 'Ownership permission test', description: 'Temporary test issue', category: 'Other', location: 'Test location',
    });
    const studentDelete = await request(app).delete(`/api/issues/${someoneElsesIssue.body.id}`).set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(studentDelete.status, 403);
    const cleanupDelete = await request(app).delete(`/api/issues/${someoneElsesIssue.body.id}`).set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(cleanupDelete.status, 200);
  });

  await t.test('Only super_admin can access user management', async () => {
    const response = await request(app).get('/api/users').set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(response.status, 403);
  });
});
