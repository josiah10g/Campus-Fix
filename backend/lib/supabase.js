// Supabase Auth email verification and access-token validation.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function authConfig() {
  const key = SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !key) return null;
  return { url: SUPABASE_URL.replace(/\/$/, ''), key };
}

async function getVerifiedEmail(accessToken) {
  const config = authConfig();
  if (!config || !accessToken) return null;
  try {
    const res = await fetch(`${config.url}/auth/v1/user`, {
      headers: { apikey: config.key, Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user.email_confirmed_at ? user.email : null;
  } catch {
    return null;
  }
}

async function supabaseAuthRequest(path, body, redirectTo) {
  const config = authConfig();
  if (!config) return { success: false, error: 'Supabase Auth is not configured on the server.' };
  try {
    const url = new URL(`${config.url}/auth/v1/${path}`);
    if (redirectTo) url.searchParams.set('redirect_to', redirectTo);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: config.key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[Supabase Auth] Request failed:', response.status, data.msg || data.message || data.error_description || data.error);
      return { success: false, status: response.status, rateLimited: response.status === 429, error: data.msg || data.message || data.error_description || data.error || 'Supabase Auth rejected the request.' };
    }
    return { success: true, data };
  } catch (error) {
    console.error('[Supabase Auth] Request error:', error.message);
    return { success: false, error: 'Could not connect to Supabase Auth.' };
  }
}

async function sendVerificationEmail(email, token) {
  if (!token) return { success: false, error: 'Verification token is missing.' };
  const frontendUrl = (process.env.FRONTEND_URL || 'https://campus-fix-ochre.vercel.app').replace(/\/$/, '');
  const redirect = new URL(`${frontendUrl}/verify-email`);
  redirect.searchParams.set('email', email);
  redirect.searchParams.set('token', token);
  // Supabase proves email ownership; CampusFix keeps its existing password login.
  // OTP also sends a fresh link to existing Auth users and legacy app accounts.
  return supabaseAuthRequest('otp', { email, create_user: true }, redirect.toString());
}

module.exports = { sendVerificationEmail, getVerifiedEmail };
