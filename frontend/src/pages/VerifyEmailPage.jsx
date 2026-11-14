// frontend/src/pages/VerifyEmailPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';
  const reasonParam = searchParams.get('reason') || 'signup';
  const [emailWasSent, setEmailWasSent] = useState(searchParams.get('sent') !== 'false');

  const [email, setEmail] = useState(emailParam);
  const [reason, setReason] = useState(reasonParam);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 1. Check if user arrived via Supabase redirect hash (#access_token=...&type=invite) or query token
  useEffect(() => {
    const handleUrlVerification = async () => {
      const callback = new URLSearchParams(window.location.hash.slice(1));
      const callbackError = callback.get('error_description') || callback.get('error');
      if (callbackError) {
        setError(callbackError);
        window.history.replaceState(null, '', `${window.location.pathname}?email=${encodeURIComponent(emailParam)}`);
        return;
      }
      // Check query param token
      if (tokenParam && emailParam) {
        setVerifying(true);
        try {
          const res = await api.verifyEmail({ email: emailParam, token: tokenParam });
          setVerified(true);
          const successMsg = reasonParam === 'password_change'
            ? 'Password verified and updated successfully! You can now log in with your new password.'
            : reasonParam === 'email_change'
            ? 'New email address verified successfully! You can now log in.'
            : (res.message || 'Email verified successfully! You can now log in.');
          setMessage(successMsg);
          window.history.replaceState(null, '', window.location.pathname);
        } catch (err) {
          setError(err.message || 'Verification link expired or invalid.');
        } finally {
          setVerifying(false);
        }
        return;
      }

      // Check if user visited /verify-email with an email already verified
      if (emailParam && !tokenParam && !window.location.hash) {
        try {
          const checkRes = await api.verifyEmail({ email: emailParam });
          if (checkRes.alreadyVerified) {
            setVerified(true);
            setMessage(checkRes.message || 'Email is already verified. You can log in now.');
            return;
          }
        } catch {
          // If unverified, proceed with the normal check your inbox screen
        }
      }

      // Check hash fragment from Supabase auth redirect
      const hash = window.location.hash;
      if (hash && (hash.includes('type=invite') || hash.includes('type=signup') || hash.includes('access_token'))) {
        setVerifying(true);
        try {
          const hashParams = new URLSearchParams(hash.slice(1));
          const accessToken = hashParams.get('access_token');
          // Pass the Supabase session token to the API, which validates it server-side.
          const targetEmail = emailParam || localStorage.getItem('pending_verification_email') || '';
          if (!targetEmail || !accessToken) throw new Error('The verification link is incomplete or expired. Request a new one.');
          const res = await api.verifyEmail({ email: targetEmail, access_token: accessToken });
          setVerified(true);
          setMessage(res.message || 'Email verified successfully! You can now log in.');
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        } catch (err) {
          setError(err.message || 'Failed to complete verification.');
        } finally {
          setVerifying(false);
        }
      }
    };

    handleUrlVerification();
  }, [tokenParam, emailParam]);

  const handleResend = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    setResending(true);
    setError('');
    setMessage('');

    try {
      const res = await api.resendVerification(email, reason);
      setEmailWasSent(Boolean(res.sent));
      setMessage(res.message || 'Verification email resent! Please check your inbox.');
    } catch (err) {
      if (err.data?.alreadyVerified) {
        setVerified(true);
        setMessage('This email is already verified. You can log in.');
        return;
      }
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const getReasonDetails = () => {
    switch (reason) {
      case 'password_change':
        return {
          title: 'Confirm password change',
          subtitle: 'We sent a confirmation link to verify your new password to',
          nextSteps: [
            'Open your email inbox (and check Spam/Junk folder if not seen).',
            'Click the confirmation link to authorize your new password.',
            'Once confirmed, return here to log in with your new password.',
          ],
        };
      case 'email_change':
        return {
          title: 'Verify new email address',
          subtitle: 'We sent a verification link to confirm your new email address to',
          nextSteps: [
            'Open your new email inbox (and check Spam/Junk folder if not seen).',
            'Click the confirmation link to confirm ownership of this email.',
            'Once confirmed, return here to log in with your updated email.',
          ],
        };
      case 'email_and_password':
        return {
          title: 'Confirm security updates',
          subtitle: 'We sent a confirmation link to verify your updated email and password to',
          nextSteps: [
            'Open your email inbox (and check Spam/Junk folder if not seen).',
            'Click the confirmation link to verify your updated security credentials.',
            'Once confirmed, return here to log in with your new credentials.',
          ],
        };
      default:
        return {
          title: 'Check your inbox',
          subtitle: 'We sent a verification link to activate your account to',
          nextSteps: [
            'Open your email inbox (and check Spam/Junk folder if not seen).',
            'Click the confirmation link from Supabase / CampusFix.',
            'Come back here and sign into your account.',
          ],
        };
    }
  };

  const reasonDetails = getReasonDetails();

  return (
    <div className="min-h-screen bg-page flex flex-col justify-between animate-page-enter">
      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white border border-line rounded-card p-7 sm:p-9 shadow-sm text-center">
          {verifying ? (
            <div className="py-8">
              <Loader2 className="w-12 h-12 text-teal animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-ink">Verifying...</h1>
              <p className="text-sm text-gray-600 mt-2">Connecting to Supabase verification services.</p>
            </div>
          ) : verified ? (
            <div className="py-4">
              <div className="w-14 h-14 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h1 className="text-2xl font-bold text-ink">
                {reason === 'password_change' ? 'Password Confirmed!' : reason === 'email_change' ? 'Email Verified!' : 'Email Verified!'}
              </h1>
              <p className="text-sm text-gray-600 mt-2 mb-6">
                {message || 'Your account is now fully verified. You can log in and start using CampusFix.'}
              </p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center py-3 px-4 bg-teal hover:bg-teal-dark text-white font-bold text-sm rounded shadow-none btn-interactive"
              >
                Continue to Login
              </Link>
            </div>
          ) : (
            <div>
              <div className="w-14 h-14 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} />
              </div>

              <h1 className="text-2xl font-bold text-ink tracking-tight">
                {emailWasSent ? reasonDetails.title : 'Verification email not sent'}
              </h1>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {emailWasSent ? <>{reasonDetails.subtitle}{' '}</> : <>We could not send the verification email to{' '}</>}
                <strong className="text-ink font-semibold">{email || 'your email'}</strong>.
              </p>

              <div className="mt-4 p-3.5 bg-[#F1F4F3] border border-line rounded text-xs text-gray-700 text-left space-y-1.5">
                <div className="font-bold text-ink">Next step:</div>
                <div>1. {emailWasSent ? reasonDetails.nextSteps[0] : 'Check your email address and try resending the email below.'}</div>
                <div>2. {emailWasSent ? reasonDetails.nextSteps[1] : 'Then use the button below to resend the verification email.'}</div>
                <div>3. {emailWasSent ? reasonDetails.nextSteps[2] : 'Come back here and sign into your account.'}</div>
              </div>

              {message && (
                <div className="mt-4 p-3 bg-teal/10 border border-teal/20 text-teal text-xs rounded font-medium text-left">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-statusOpen text-xs rounded font-medium text-left">
                  {error}
                </div>
              )}

              {/* Resend Action */}
              <div className="mt-6 pt-5 border-t border-line space-y-3">
                <p className="text-xs text-gray-500">Didn't receive the email? Check your spam/junk folder or request a new email below.</p>
                
                {!emailParam && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAFBFB] border border-line rounded focus:outline-none focus:border-teal"
                  />
                )}

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-2.5 px-4 bg-teal hover:bg-teal-dark text-white font-bold text-xs rounded shadow-none btn-interactive flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {resending ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Resending email...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} /> Resend verification email
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4">
                <Link to="/login" className="text-xs font-semibold text-gray-500 hover:text-ink">
                  Return to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-line py-4 text-center text-xs text-gray-500 bg-white">
        © 2026 CampusFix. Facility Management & Issue Resolution Portal.
      </footer>
    </div>
  );
}

