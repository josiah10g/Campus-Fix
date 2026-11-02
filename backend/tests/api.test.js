// backend/tests/api.test.js
// Automated test suite for CampusFix REST API & Auth checks
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../index');
const { pool } = require('../db');

// Test suite
test('CampusFix API End-to-End Tests', async (t) => {
  let studentToken = '';
  let studentUser = null;
  let adminToken = '';
  let adminUser = null;
  let maintenanceToken = '';
  let maintenanceUser = null;
  let createdIssueId = null;

  t.before(async () => {
    // If DATABASE_URL is available, tests run against PostgreSQL
    // Register a test student
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: `student_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'student',
      });
    
    if (studentRes.status === 201) {
      studentToken = studentRes.body.token;
      studentUser = studentRes.body.user;
    }

    // Register a test staff/maintenance user or login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdminPass123!',
      });
    
    if (adminRes.status === 200) {
      adminToken = adminRes.body.token;
      adminUser = adminRes.body.user;
    }
  });

  t.after(async () => {
    await pool.end();
  });

  await t.test('GET /api/health should return ok: true', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
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
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker User',
        email: `hacker_${Date.now()}@example.com`,
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
});
