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

  const [email, setEmail] = useState(emailParam);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 1. Check if user arrived via Supabase redirect hash (#access_token=...&type=invite) or query token
  useEffect(() => {
    const handleUrlVerification = async () => {
      // Check query param token
      if (tokenParam && emailParam) {
        setVerifying(true);
        try {
          const res = await api.verifyEmail({ email: emailParam, token: tokenParam });
          setVerified(true);
          setMessage(res.message || 'Email verified successfully! You can now log in.');
        } catch (err) {
          setError(err.message || 'Verification link expired or invalid.');
        } finally {
          setVerifying(false);
        }
        return;
      }

      // Check hash fragment from Supabase auth redirect
      const hash = window.location.hash;
      if (hash && (hash.includes('type=invite') || hash.includes('type=signup') || hash.includes('access_token'))) {
        setVerifying(true);
        try {
          // If we have an email parameter in query or stored, verify
          const targetEmail = emailParam || localStorage.getItem('pending_verification_email') || '';
          if (targetEmail) {
            const res = await api.verifyEmail({ email: targetEmail });
            setVerified(true);
            setMessage(res.message || 'Email verified successfully! You can now log in.');
          } else {
            // Can't automatically verify without email, but Supabase confirmed the token
            setVerified(true);
            setMessage('Your email has been confirmed by Supabase! Please log in to continue.');
          }
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
      const res = await api.resendVerification(email);
      setMessage(res.message || 'Verification email resent! Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col justify-between animate-page-enter">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5 focus:outline-none">
          <div className="w-8 h-8 rounded bg-safetyYellow flex items-center justify-center font-bold text-ink text-base shadow-none">
            C
          </div>
          <span className="font-bold text-xl tracking-tight text-ink">CampusFix</span>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white border border-line rounded-card p-7 sm:p-9 shadow-sm text-center">
          {verifying ? (
            <div className="py-8">
              <Loader2 className="w-12 h-12 text-teal animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-ink">Verifying your email...</h1>
              <p className="text-sm text-gray-600 mt-2">Connecting to Supabase verification services.</p>
            </div>
          ) : verified ? (
            <div className="py-4">
              <div className="w-14 h-14 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h1 className="text-2xl font-bold text-ink">Email Verified!</h1>
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

              <h1 className="text-2xl font-bold text-ink tracking-tight">Check your inbox</h1>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                We sent a verification link to{' '}
                <strong className="text-ink font-semibold">{email || 'your email'}</strong>.
              </p>

              <div className="mt-4 p-3.5 bg-[#F1F4F3] border border-line rounded text-xs text-gray-700 text-left space-y-1.5">
                <div className="font-bold text-ink">Next step:</div>
                <div>1. Open your email inbox (and check Spam/Junk folder if not seen).</div>
                <div>2. Click the confirmation link from Supabase / CampusFix.</div>
                <div>3. Come back here and sign into your account.</div>
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
              <div className="mt-6 pt-5 border-t border-line">
                <p className="text-xs text-gray-500 mb-3">Didn't receive the email? Check your spam folder or resend below.</p>
                
                {!emailParam && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full mb-3 px-3.5 py-2 text-xs bg-[#FAFBFB] border border-line rounded focus:outline-none focus:border-teal"
                  />
                )}

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-2.5 px-4 bg-white border border-teal text-teal hover:bg-teal hover:text-white font-bold text-xs rounded shadow-none btn-interactive flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {resending ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Resending...
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
