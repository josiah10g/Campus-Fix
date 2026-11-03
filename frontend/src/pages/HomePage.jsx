import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import StatusPill from '../components/StatusPill';
import ErrorBanner from '../components/ErrorBanner';

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [counts, latest] = await Promise.all([api.getPublicStats(), api.getPublicIssues(4)]);
      setStats(counts);
      setIssues(latest);
    } catch (err) {
      setError(err.message || 'Could not load the public issue summary.');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-7 animate-page-enter">
      {error && <ErrorBanner message={error} onRetry={load} />}
      <section className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <div>
          <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold text-ink">Welcome to CampusFix</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight text-ink">Report it once.<br /><span className="text-teal">Watch it get fixed.</span></h1>
          <p className="mt-3 max-w-lg text-sm text-gray-600">CampusFix gives every broken light, leaking tap and dead Wi-Fi spot one place to be reported and tracked until it is resolved.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/register" className="rounded bg-teal px-5 py-3 text-sm font-semibold text-white hover:bg-teal-dark btn-interactive">Sign up and report an issue</Link>
            <Link to="/login" className="rounded border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-gray-50">Log in</Link>
            <a href="#latest" className="px-3 py-3 text-sm font-semibold text-teal hover:underline">See latest issues</a>
          </div>
          <p className="mt-3 text-xs text-gray-500">Signing up takes under a minute, then you can report straight away.</p>
        </div>
        <div>
          <p className="mb-2 text-xs text-gray-600">Right now on campus</p>
          <div className="grid grid-cols-2 gap-3">
            {[["Total issues", stats.total, 'text-ink'], ['Open', stats.open, 'text-statusOpen'], ['In progress', stats.inProgress, 'text-statusProgress'], ['Resolved', stats.resolved, 'text-statusResolved']].map(([label, value, color]) => (
              <div key={label} className="rounded-card border border-line bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p></div>
            ))}
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">How it works</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {['Sign up and report|Create an account, then say what is broken and where.', 'Track|Maintenance staff update the status as work starts.', 'Resolved|Everyone sees the fix, so nothing is forgotten.'].map((text, index) => {
            const [title, description] = text.split('|');
            return <div key={title} className="flex items-center gap-3 rounded-card border border-line bg-white p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-safetyYellow font-bold">{index + 1}</span><div><h3 className="text-sm font-bold text-ink">{title}</h3><p className="mt-1 text-xs text-gray-600">{description}</p></div></div>;
          })}
        </div>
      </section>
      <section id="latest">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-ink">Latest issues</h2><Link to="/login" className="text-xs font-semibold text-teal hover:underline">Log in to report, edit or update an issue</Link></div>
        <div className="overflow-x-auto rounded-card border border-line bg-white">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-[#E8EEEC] text-gray-600"><tr>{['Title', 'Location', 'Category', 'Status', 'Reported'].map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{issues.map((issue) => <tr key={issue.id} className="table-row-hover"><td className="px-3 py-3 font-semibold text-ink">{issue.title}</td><td className="px-3 py-3">{issue.location}</td><td className="px-3 py-3">{issue.category}</td><td className="px-3 py-3"><StatusPill status={issue.status} /></td><td className="px-3 py-3">{new Date(issue.created_at).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
          {issues.length === 0 && !error && <p className="p-6 text-center text-sm text-gray-500">No public issue reports yet.</p>}
        </div>
        <p className="mt-2 text-[11px] text-gray-500">Public view shows titles, places and statuses only. Reporter names and descriptions stay private.</p>
      </section>
      <section className="flex flex-col gap-4 rounded-card bg-teal p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-bold">Spotted something broken?</h2><p className="mt-1 text-xs">Create an account and report it in under a minute. Anyone on campus can sign up.</p></div>
        <div className="flex gap-2"><Link to="/register" className="rounded bg-white px-4 py-2.5 text-xs font-bold text-teal">Create account</Link><Link to="/login" className="rounded border border-white px-4 py-2.5 text-xs font-bold">Log in</Link></div>
      </section>
    </div>
  );
}
