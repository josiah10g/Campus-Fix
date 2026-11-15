// frontend/src/pages/FeedbackPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Send, CheckCircle2, AlertCircle, ArrowLeft, HelpCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FeedbackPage() {
  const { user } = useAuth();
  const [topic, setTopic] = useState('Change Email / Student ID / Academic Details');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState(user?.name || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [copied, setCopied] = useState('');

  const adminEmail = 'josiah0532@gmail.com';
  const adminWhatsApp = '2348086833676'; // International format for wa.me/2348086833676
  const displayWhatsApp = '08086833676';

  const topics = [
    'Change Email / Student ID / Academic Details',
    'Report a Bug or Issue with CampusFix',
    'Feature Suggestion or Idea',
    'General Inquiry or Feedback',
  ];

  const buildBody = () => {
    let body = `Hello CampusFix Administrator,\n\n`;
    body += `Topic: ${topic}\n`;
    body += `From: ${senderName || 'Anonymous'}\n`;
    body += `User Email: ${senderEmail || 'Not provided'}\n`;
    if (user?.student_id) body += `Student/Staff ID: ${user.student_id}\n`;
    if (user?.role) body += `Role: ${user.role}\n`;
    body += `\nMessage:\n${message || '(No detailed message entered)'}\n\nSent from CampusFix Web Application`;
    return body;
  };

  const emailHref = `mailto:${adminEmail}?subject=${encodeURIComponent(`[CampusFix Support] ${topic}`)}&body=${encodeURIComponent(buildBody())}`;
  const whatsappHref = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(`*CampusFix Support & Feedback*\n\n*Topic:* ${topic}\n*From:* ${senderName || 'User'}\n*Email:* ${senderEmail || 'N/A'}\n\n*Message:*\n${message || 'Hello, I need assistance with CampusFix.'}`)}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-page-enter">
      <Link
        to={user ? "/issues" : "/"}
        className="mb-6 inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal btn-interactive"
      >
        <ArrowLeft size={16} /> {user ? 'Back to Issues' : 'Back to Home'}
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Contact Admin & Feedback</h1>
        <p className="mt-2 text-base text-gray-600 max-w-2xl">
          Need to update your verified Student ID, email, or academic details? Encountered an issue or have feedback to improve CampusFix? Send a message directly to the administrator.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Direct Channels Cards (Left col) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-line rounded-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Email Support</h3>
                <p className="text-xs text-gray-500">Official administration mailbox</p>
              </div>
            </div>
            <a
              href={`mailto:${adminEmail}`}
              className="text-sm font-semibold text-teal hover:underline break-all block"
            >
              {adminEmail}
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(adminEmail, 'email')}
              className="mt-3 w-full py-1.5 px-3 text-xs font-semibold rounded border border-line hover:bg-gray-50 text-gray-700"
            >
              {copied === 'email' ? '✓ Copied to clipboard' : 'Copy email address'}
            </button>
          </div>

          <div className="bg-white border border-line rounded-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">WhatsApp Direct</h3>
                <p className="text-xs text-gray-500">Instant messaging assistance</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-ink font-mono">{displayWhatsApp}</p>
            <div className="flex gap-2 mt-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-1.5 px-3 text-xs font-bold rounded bg-[#25D366] hover:bg-[#1EBE5D] text-white"
              >
                Chat on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(displayWhatsApp, 'phone')}
                className="py-1.5 px-3 text-xs font-semibold rounded border border-line hover:bg-gray-50 text-gray-700"
              >
                {copied === 'phone' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-[#FAFBFB] border border-line rounded-card p-4 text-xs text-gray-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-ink">
              <ShieldAlert size={15} className="text-teal" />
              <span>Security Note</span>
            </div>
            <p>
              To protect student records, requests to change your Student ID Number or email address require verification of your identity with the admin.
            </p>
          </div>
        </div>

        {/* Message Composer (Right col) */}
        <div className="md:col-span-3 bg-white border border-line rounded-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-1">Compose your request or feedback</h2>
          <p className="text-xs text-gray-500 mb-5">
            Fill this out and choose your preferred method to send it directly to the administrator.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Purpose of Contact
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-line rounded focus:outline-none focus:border-teal text-ink"
              >
                {topics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Josiah"
                  className="w-full px-3 py-2 text-sm bg-white border border-line rounded focus:outline-none focus:border-teal text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className="w-full px-3 py-2 text-sm bg-white border border-line rounded focus:outline-none focus:border-teal text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Detailed Message
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain your issue, feedback, or what detail you need the administrator to update (e.g. current ID vs new ID, faculty change, etc.)..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-line rounded focus:outline-none focus:border-teal text-ink"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={emailHref}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal hover:bg-teal-dark text-white text-sm font-bold rounded shadow-none btn-interactive text-center"
              >
                <Mail size={16} /> Send via Email
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm font-bold rounded shadow-none btn-interactive text-center"
              >
                <MessageCircle size={16} /> Send via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
