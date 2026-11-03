// frontend/src/pages/ReportIssuePage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import IssueForm from '../components/IssueForm';
import Toast from '../components/Toast';
import { ArrowLeft } from 'lucide-react';

export default function ReportIssuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      const created = await api.createIssue(formData);
      navigate('/issues', {
        state: {
          message: 'Issue reported. It now shows in the list as Open.',
          newIssueId: created.id,
        },
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Could not report issue.',
      });
      throw err;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-4">
        <Link
          to="/issues"
          className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to all issues
        </Link>
      </div>

      <div className="bg-white border border-line rounded-card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-ink">Report an issue</h1>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Say what is broken and where. Your name is added automatically.
        </p>

        <IssueForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/issues')}
          currentUser={user}
          isEdit={false}
        />
      </div>
    </div>
  );
}
