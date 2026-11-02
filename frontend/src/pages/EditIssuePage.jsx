// frontend/src/pages/EditIssuePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import IssueForm from '../components/IssueForm';
import Toast from '../components/Toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditIssuePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const data = await api.getIssue(id);
        setIssue(data);
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Issue not found.' });
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      await api.updateIssue(id, formData);
      navigate('/issues', {
        state: { message: 'Issue updated successfully!' },
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not update issue.' });
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white border border-line rounded-card text-center">
        <h3 className="text-base font-bold text-ink">Issue not found</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">The requested issue may have been deleted.</p>
        <Link to="/issues" className="text-xs font-semibold text-teal hover:underline">
          Return to issues list
        </Link>
      </div>
    );
  }

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
        <h1 className="text-xl font-bold text-ink">Edit issue #{issue.id}</h1>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Update the report description, location, or facility parameters.
        </p>

        <IssueForm
          initialData={issue}
          onSubmit={handleSubmit}
          currentUser={user}
          isEdit={true}
        />
      </div>
    </div>
  );
}

