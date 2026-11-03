// frontend/src/pages/PublicHomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatCard from '../components/StatCard';
import StatusPill from '../components/StatusPill';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorBanner from '../components/ErrorBanner';

export default function PublicHomePage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPublicData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [statsData, issuesData] = await Promise.all([
        api.getPublicStats(),
        api.getPublicIssues(4),
      ]);
      setStats(statsData);
      setIssues(issuesData);
    } catch (err) {
      console.error('[PublicHomePage] Failed to load data:', err);
      setError(err.message || 'Unable to connect to CampusFix server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, []);

  return (
    <div className="min-h-screen bg-page flex flex-col justify-between animate-page-enter">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Hero Section + Right Stats Grid matching Image 10 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left Column: Hero Text & Buttons */}
          <div className="lg:col-span-7 pt-2">
            <div className="inline-block px-3 py-1 bg-[#FEF6E6] border border-safetyYellow rounded-full text-xs font-semibold text-ink mb-4 animate-welcome-out">
                Welcome to CampusFix
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight leading-tight mb-2">
              Report it once. <br />
              <span className="text-teal">Watch it get fixed.</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-600 max-w-lg mb-6 leading-relaxed">
              CampusFix gives every broken light, leaking tap and dead Wi-Fi spot one place to be reported and tracked until it is resolved.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              {user ? (
                <Link
                  to="/report"
                  className="px-5 py-3 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive"
                >
                  Report an issue
                </Link>
              ) : (
                <>
                  <Link
                    to="/register?next=/report"
                    className="px-5 py-3 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive"
                  >
                    Sign up and report an issue
                  </Link>
                  <Link
                    to="/login?next=/report"
                    className="px-5 py-3 bg-white border border-line hover:bg-gray-50 text-ink text-sm font-semibold rounded shadow-none btn-interactive"
                  >
                    Log in
                  </Link>
                </>
              )}
              <a
                href="#latest-issues"
                className="text-sm font-semibold text-teal hover:underline ml-2"
              >
                See latest issues
              </a>
            </div>

            <p className="text-xs text-gray-500">
              New here? Signing up takes under a minute, then you can report straight away.
            </p>
          </div>

          {/* Right Column: Live Campus Stats Grid */}
          <div className="lg:col-span-5 bg-white/50 p-2 sm:p-4 rounded-card">
            <h2 className="text-xs font-semibold text-gray-500 mb-3">
              Right now on campus
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total issues" value={stats.total} colorClass="text-ink" />
              <StatCard label="Open" value={stats.open} colorClass="text-statusOpen" />
              <StatCard label="In progress" value={stats.inProgress} colorClass="text-statusProgress" />
              <StatCard label="Resolved" value={stats.resolved} colorClass="text-statusResolved" />
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-ink mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-white border border-line rounded-card p-5 flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-safetyYellow text-ink font-bold flex items-center justify-center shrink-0 text-sm">
                1
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink mb-1">Sign up and report</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Create an account, then say what is broken and where.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-line rounded-card p-5 flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-safetyYellow text-ink font-bold flex items-center justify-center shrink-0 text-sm">
                2
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink mb-1">Track</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Maintenance staff update the status as work starts.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-line rounded-card p-5 flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-safetyYellow text-ink font-bold flex items-center justify-center shrink-0 text-sm">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink mb-1">Resolved</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Everyone sees the fix, so nothing is forgotten.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Issues Section (Read-Only Public Table) */}
        <div id="latest-issues" className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h2 className="text-xl font-bold text-ink">Latest issues</h2>
            <Link
              to="/login?next=/report"
              className="text-xs font-semibold text-teal hover:underline"
            >
              Log in to report, edit or update an issue
            </Link>
          </div>

          {error && <ErrorBanner message={error} onRetry={loadPublicData} />}

          {loading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Desktop Public Table */}
              <div className="hidden md:block bg-white border border-line rounded-card overflow-hidden">
                <table className="min-w-full divide-y divide-line text-left text-sm">
                  <thead className="bg-[#FAFBFB] text-xs font-semibold text-gray-500">
                    <tr>
                      <th className="px-5 py-3.5">Title</th>
                      <th className="px-5 py-3.5">Location</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Reported</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-white">
                    {issues.map((issue) => (
                      <tr key={issue.id} className="table-row-hover">
                        <td className="px-5 py-4 whitespace-nowrap font-bold text-ink text-sm">
                          {issue.title}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                          {issue.location}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                          {issue.category}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusPill status={issue.status} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                          {new Date(issue.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards for Public View */}
              <div className="md:hidden space-y-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="bg-white border border-line rounded-card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-ink text-sm">{issue.title}</h4>
                      <StatusPill status={issue.status} />
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{issue.location}</span>
                      <span>•</span>
                      <span>{issue.category}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Public view: titles, places and statuses only. Names and descriptions stay private.
              </p>
            </>
          )}
        </div>

        {/* Bottom CTA Band matching Image 10 */}
        <div className="bg-teal text-white rounded-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-1">Spotted something broken?</h3>
            <p className="text-xs sm:text-sm text-teal-light opacity-90">
              Create an account and report it in under a minute. Anyone on campus can sign up.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <Link
                to="/issues"
                className="px-5 py-2.5 bg-white text-teal hover:bg-gray-100 text-sm font-semibold rounded shadow-none btn-interactive"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register?next=/report"
                  className="px-5 py-2.5 bg-white text-teal hover:bg-gray-100 text-sm font-semibold rounded shadow-none btn-interactive"
                >
                  Create account
                </Link>
                <Link
                  to="/login?next=/report"
                  className="px-5 py-2.5 border border-white/40 text-white hover:bg-white/10 text-sm font-semibold rounded shadow-none btn-interactive"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

