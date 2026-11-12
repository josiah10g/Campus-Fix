// Supabase access-token validation and Brevo email delivery.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Validate an access token issued by Supabase and return its verified email. */
async function getVerifiedEmail(accessToken) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !accessToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user.email_confirmed_at ? user.email : null;
  } catch {
    return null;
  }
}

/** Send a CampusFix verification link via Brevo using the app's DB token. */
async function sendVerificationEmail(email, token) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.warn('[Email] Missing BREVO_API_KEY or BREVO_SENDER_EMAIL.');
    return { success: false, error: 'Email delivery is not configured on the server.' };
  }
  if (!token) return { success: false, error: 'Verification token is missing.' };

  try {
    const frontendUrl = (process.env.FRONTEND_URL || 'https://campus-fix-ochre.vercel.app').replace(/\/$/, '');
    const verificationUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const senderName = process.env.BREVO_SENDER_NAME || 'CampusFix';
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email }],
        subject: 'Verify your CampusFix email',
        textContent: `Welcome to CampusFix. Verify your email address using this link: ${verificationUrl}\n\nThis link expires in 24 hours.`,
        htmlContent: `<p>Welcome to CampusFix.</p><p><a href="${verificationUrl}">Verify your email address</a></p><p>This link expires in 24 hours.</p>`,
      }),
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      console.error('[Email] Brevo send failed:', response.status, details);
      return {
        success: false,
        status: response.status,
        rateLimited: response.status === 429,
        error: response.status === 429
          ? 'Email provider rate limit reached. Please try again later.'
          : `Could not send verification email: ${details.message || details.code || 'Brevo rejected the request.'}`,
      };
    }

    console.log(`[Email] Verification email accepted by Brevo for ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[Email] Brevo send error:', error.message);
    return { success: false, error: 'Could not connect to the email provider.' };
  }
}

module.exports = { sendVerificationEmail, getVerifiedEmail };
