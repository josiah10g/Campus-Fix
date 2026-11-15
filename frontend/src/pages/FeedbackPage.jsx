// frontend/src/pages/FeedbackPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FeedbackPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const adminEmail = 'josiah0532@gmail.com';
  const adminWhatsApp = '2348086833676'; // International format for wa.me link

  const handleSendEmail = (e) => {
    if (!message.trim()) {
      e.preventDefault();
      setError('Please type your message before sending.');
      return;
    }
    setError('');
  };

  const handleSendWhatsApp = (e) => {
    if (!message.trim()) {
      e.preventDefault();
      setError('Please type your message before sending.');
      return;
    }
    setError('');
  };

  // Plain user-typed subject and body (no auto-generated template text)
  const emailSubject = subject.trim() ? subject.trim() : 'CampusFix Feedback';
  const emailHref = `mailto:${adminEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;
  const whatsappHref = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-page-enter">
      <Link
        to={user ? "/issues" : "/"}
        className="mb-6 inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal btn-interactive"
      >
        <ArrowLeft size={16} /> {user ? 'Back to Issues' : 'Back to Home'}
      </Link>

      <div className="bg-white border border-line rounded-card p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Compose your request or feedback</h1>
          <p className="mt-1 text-sm text-gray-500">
            Type your message below and choose to send it via Email or WhatsApp directly to the administrator.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 text-xs bg-red-50 border border-red-200 text-statusOpen rounded font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Subject (Optional for Email)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Request to change student ID / Bug report / Feedback"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal text-ink placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Your Message
            </label>
            <textarea
              rows={7}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (error) setError('');
              }}
              placeholder="Type your message here..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal text-ink placeholder:text-gray-400"
              required
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href={emailHref}
              onClick={handleSendEmail}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-teal hover:bg-teal-dark text-white text-sm font-bold rounded shadow-none btn-interactive text-center"
            >
              <Mail size={17} /> Send via Email
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSendWhatsApp}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm font-bold rounded shadow-none btn-interactive text-center"
            >
              <MessageCircle size={17} /> Send via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
