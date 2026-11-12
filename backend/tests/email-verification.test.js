// Isolated email-flow regressions: no real database changes or outbound email.
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

process.env.SUPABASE_URL = 'https://auth.example.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = '';
process.env.FRONTEND_URL = 'https://campus.example.test';

let queries;
let queryImpl;
let sends;
let providerStatus;
const dbPath = require.resolve('../db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
  query: async (sql, args) => { queries.push({ sql, args }); return queryImpl(sql, args); },
} };
const middlewarePath = require.resolve('../middleware/auth');
require.cache[middlewarePath] = { id: middlewarePath, filename: middlewarePath, loaded: true, exports: {
  requireAuth: (req, res, next) => { req.user = { id: 7, role: 'staff' }; next(); },
} };
const app = express();
app.use(express.json());
app.use('/auth', require('../routes/auth'));
app.use((error, req, res, next) => res.status(500).json({ error: error.message }));
const { sendVerificationEmail } = require('../lib/supabase');
const originalFetch = global.fetch;

test.beforeEach(() => {
  queries = [];
  sends = [];
  providerStatus = 200;
  queryImpl = () => ({ rows: [] });
  global.fetch = async (url, options) => {
    sends.push({ url: new URL(url), body: JSON.parse(options.body) });
    return { ok: providerStatus === 200, status: providerStatus,
      json: async () => providerStatus === 200 ? {} : { msg: 'Email provider rejected delivery.' } };
  };
});
test.after(() => { global.fetch = originalFetch; });

test('Supabase receives the OTP endpoint, create_user and redirect_to including the app challenge', async () => {
  const result = await sendVerificationEmail('a+b@example.test', 'secret-challenge');
  assert.equal(result.success, true);
  assert.equal(sends[0].url.pathname, '/auth/v1/otp');
  assert.deepEqual(sends[0].body, { email: 'a+b@example.test', create_user: true });
  const redirect = new URL(sends[0].url.searchParams.get('redirect_to'));
  assert.equal(redirect.pathname, '/verify-email');
  assert.equal(redirect.searchParams.get('email'), 'a+b@example.test');
  assert.equal(redirect.searchParams.get('token'), 'secret-challenge');
});

test('registration preserves an unverified account and reports send failure so resend remains possible', async () => {
  providerStatus = 422;
  queryImpl = (sql, args) => sql.includes('INSERT INTO users')
    ? { rows: [{ id: 7, email: args[1] }] } : { rows: [] };
  const result = await request(app).post('/auth/register').send({
    name: 'Test Staff', email: 'staff@example.test', password: 'Password123!', role: 'staff',
  });
  assert.equal(result.status, 201);
  assert.equal(result.body.emailSent, false);
  assert.equal(result.body.requiresVerification, true);
  const insert = queries.find(q => q.sql.includes('INSERT INTO users'));
  assert.match(insert.args[9], /^[a-f0-9]{64}$/);
  assert.equal(new URL(sends[0].url.searchParams.get('redirect_to')).searchParams.get('token'), insert.args[9]);
  assert.ok(!queries.some(q => q.sql.includes('DELETE')));
});

test('duplicate signup does not send mail or delete an existing account', async () => {
  queryImpl = () => ({ rows: [{ id: 7, is_verified: false }] });
  const result = await request(app).post('/auth/register').send({
    name: 'Staff', email: 'staff@example.test', password: 'Password123!', role: 'staff',
  });
  assert.equal(result.status, 409);
  assert.equal(result.body.requiresVerification, true);
  assert.equal(sends.length, 0);
  assert.ok(!queries.some(q => q.sql.includes('DELETE')));
});

test('resend rotates the challenge and reports provider rate limits', async () => {
  providerStatus = 429;
  queryImpl = () => ({ rows: [{ id: 7, is_verified: false }] });
  const result = await request(app).post('/auth/resend-verification').send({ email: 'staff@example.test' });
  assert.equal(result.status, 429);
  assert.equal(result.body.rateLimited, true);
  const update = queries.find(q => q.sql.startsWith('UPDATE'));
  assert.match(update.args[0], /^[a-f0-9]{64}$/);
  assert.equal(sends.length, 1);
});

test('legacy profile security changes send real verification requests without a linked Supabase ID', async () => {
  queryImpl = (sql) => {
    if (sql.startsWith('SELECT email')) return { rows: [{ email: 'old@example.test' }] };
    if (sql.startsWith('UPDATE')) return { rows: [{ id: 7, email: 'new@example.test', is_verified: false }] };
    return { rows: [] };
  };
  const result = await request(app).put('/auth/profile').send({ name: 'Staff', email: 'new@example.test' });
  assert.equal(result.status, 200);
  assert.equal(result.body.requiresVerification, true);
  assert.equal(result.body.emailSent, true);
  assert.equal(sends.length, 1);
  assert.equal(sends[0].body.email, 'new@example.test');
});

test('profile mail failures are not reported as a successful send', async () => {
  providerStatus = 422;
  queryImpl = sql => sql.startsWith('SELECT email')
    ? { rows: [{ email: 'old@example.test' }] }
    : sql.startsWith('UPDATE') ? { rows: [{ id: 7, email: 'new@example.test' }] } : { rows: [] };
  const result = await request(app).put('/auth/profile').send({ name: 'Staff', email: 'new@example.test' });
  assert.equal(result.status, 200);
  assert.equal(result.body.emailSent, false);
  assert.match(result.body.message, /could not send/);
});

test('only the current unexpired challenge verifies an account; older links and bare email fail', async () => {
  queryImpl = sql => sql.startsWith('SELECT') ? { rows: [{ id: 7, is_verified: false,
    verification_token: 'current', verification_expires: new Date(Date.now() + 60000) }] } : { rows: [] };
  for (const token of [undefined, 'old']) {
    const rejected = await request(app).post('/auth/verify-email').send({ email: 'staff@example.test', token });
    assert.equal(rejected.status, 400);
  }
  const accepted = await request(app).post('/auth/verify-email').send({ email: 'staff@example.test', token: 'current' });
  assert.equal(accepted.body.verified, true);
  const update = queries.find(q => q.sql.startsWith('UPDATE'));
  assert.match(update.sql, /verification_token = NULL/);
});

test('expired verification links cannot verify an account', async () => {
  queryImpl = () => ({ rows: [{ id: 7, is_verified: false,
    verification_token: 'current', verification_expires: new Date(0) }] });
  const result = await request(app).post('/auth/verify-email').send({ email: 'staff@example.test', token: 'current' });
  assert.equal(result.status, 400);
  assert.match(result.body.error, /expired/);
  assert.ok(!queries.some(q => q.sql.startsWith('UPDATE')));
});
