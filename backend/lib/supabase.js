// backend/lib/supabase.js
// Supabase Auth Admin helpers for sending verification emails

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Find a Supabase Auth user by email.
 * Returns the user object or null.
 */
async function findSupabaseUser(email) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.find(u => u.email === email) || null;
  } catch {
    return null;
  }
}

/**
 * Delete a Supabase Auth user by ID.
 */
async function deleteSupabaseUser(userId) {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
  } catch {
    // Ignore deletion errors
  }
}

/**
 * Send a verification/invite email via Supabase Auth.
 * Creates a shadow auth user and Supabase sends the invite email automatically.
 */
async function sendVerificationEmail(email) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Cannot send emails.');
    return false;
  }

  try {
    // Remove any existing shadow user for this email first
    const existing = await findSupabaseUser(email);
    if (existing) {
      await deleteSupabaseUser(existing.id);
    }

    // Invite the user - Supabase sends the email
    const res = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email,
        data: { app: 'CampusFix' },
      }),
    });

    let actionLink = null;
    let emailOtp = null;

    // Also generate link fallback so if email is delayed/rate-limited, the user can verify via 1-click fallback
    try {
      const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          type: 'invite',
          email,
          options: {
            redirectTo: 'https://campus-fix-ochre.vercel.app/verify-email',
          },
        }),
      });
      if (linkRes.ok) {
        const linkData = await linkRes.json();
        actionLink = linkData.action_link || null;
        emailOtp = linkData.email_otp || null;
      }
    } catch (e) {
      // ignore fallback error
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('[Supabase] Invite failed:', res.status, errData);
      const isRateLimited = res.status === 429 || (errData.message && errData.message.toLowerCase().includes('rate'));
      return {
        success: false,
        status: res.status,
        rateLimited: isRateLimited,
        error: isRateLimited
          ? 'Too many email requests sent. Supabase email limit exceeded, please try again later.'
          : (errData.message || 'Could not send verification email.')
      };
    }

    console.log(`[Supabase] Verification email sent to ${email} ✓`);
    return { success: true };
  } catch (err) {
    console.error('[Supabase] sendVerificationEmail error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendVerificationEmail, findSupabaseUser, deleteSupabaseUser };

