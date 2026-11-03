import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import StatCard from '../components/StatCard';
import StatusPill from '../components/StatusPill';
import ErrorBanner from '../components/ErrorBanner';

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const CATEGORIES = ['Electrical', 'Plumbing', 'Furniture', 'Network', 'Other'];
const PAGE_SIZE = 8;

function LoadingRows() {
  return <div className="animate-pulse space-y-2 rounded-card border border-line bg-white p-4 card-interactive" aria-label="Loading issues">{Array.from({ length: PAGE_SIZE }, (_, i) => <div key={i} className="h-10 rounded bg-gray-100" />)}</div>;
}

export default function LatestIssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [issuesError, setIssuesError] = useState('');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [reloadCount, setReloadCount] = useState(0);

  const query = useMemo(() => searchParams.toString(), [searchParams]);
  const page = Number(searchParams.get('page') || 1);
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    api.getPublicStats().then(setStats).catch((err) => setStatsError(err.message || 'Could not load issue counts.'));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() === search) return;
      const next = new URLSearchParams(searchParams);
      if (searchInput.trim()) next.set('search', searchInput.trim());
      else next.delete('search');
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search, searchParams, setSearchParams]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    let active = true;
    const params = Object.fromEntries(new URLSearchParams(query).entries());
    setLoading(true);
    setIssuesError('');
    api.getPublicIssues({ ...params, limit: PAGE_SIZE }).then((data) => {
      if (!data || !Array.isArray(data.issues)) throw new Error('The issue service returned an invalid response.');
      if (!active) return;
      setIssues(data.issues);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }).catch((err) => {
      if (active) setIssuesError(err.message || 'Could not load public issues.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [query, reloadCount]);

  const updateFilters = useCallback((changes) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const changePage = (newPage) => {
    const next = new URLSearchParams(searchParams);
    if (newPage === 1) next.delete('page');
    else next.set('page', String(newPage));
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 animate-page-enter">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold text-ink">Latest issues</h1><p className="mt-1 text-gray-600">A public, read-only view of what has been reported on campus.</p></div>
        <Link to="/register" className="rounded bg-teal px-5 py-3 text-center text-sm font-semibold text-white hover:bg-teal-dark btn-interactive">Sign up and report an issue</Link>
      </header>

      {statsError && <ErrorBanner message={statsError} onRetry={() => api.getPublicStats().then(setStats).catch((err) => setStatsError(err.message))} />}
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" aria-label="Issue summary">
        <StatCard label="Total issues" value={stats.total} />
        <StatCard label="Open" value={stats.open} colorClass="text-statusOpen" />
        <StatCard label="In progress" value={stats.inProgress} colorClass="text-statusProgress" />
        <StatCard label="Resolved" value={stats.resolved} colorClass="text-statusResolved" />
      </section>

      <section aria-label="Filter public issues">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="sr-only" htmlFor="public-search">Search title or location</label>
          <input id="public-search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by title or place" className="min-w-0 flex-1 rounded border border-line bg-white px-3 py-2.5 text-sm focus:border-teal" />
          <label className="sr-only" htmlFor="public-status">Filter by status</label>
          <select id="public-status" value={status} onChange={(e) => updateFilters({ status: e.target.value })} className="rounded border border-line bg-white px-3 py-2.5 text-sm focus:border-teal"><option value="">All statuses</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
          <label className="sr-only" htmlFor="public-category">Filter by category</label>
          <select id="public-category" value={category} onChange={(e) => updateFilters({ category: e.target.value })} className="rounded border border-line bg-white px-3 py-2.5 text-sm focus:border-teal"><option value="">All categories</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
          <p className="text-sm text-gray-600 md:ml-auto md:whitespace-nowrap">Showing {issues.length} of {total} issues</p>
        </div>

        {issuesError && <ErrorBanner message={issuesError} onRetry={() => setReloadCount((count) => count + 1)} />}
        {loading ? <LoadingRows /> : issues.length === 0 ? (
          <div className="rounded-card border border-line bg-white px-5 py-12 text-center card-interactive"><p className="font-semibold text-ink">No issues match your filters</p><button onClick={clearFilters} className="mt-3 text-sm font-semibold text-teal underline">Clear filters</button></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-card border border-line bg-white md:block card-interactive">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-[#E8EEEC] text-gray-600"><tr>{['Title', 'Location', 'Category', 'Status', 'Reported'].map((label) => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">{issues.map((issue, index) => <tr key={issue.id} style={index < 8 ? { animationDelay: `${index * 40}ms` } : undefined} className={`table-row-hover ${index < 8 ? 'animate-row-enter' : ''}`}><td className="px-5 py-4 font-bold text-ink">{issue.title}</td><td className="px-5 py-4 text-gray-600">{issue.location}</td><td className="px-5 py-4">{issue.category}</td><td className="px-5 py-4"><StatusPill status={issue.status} label={issue.status === 'In Progress' ? 'In progress' : issue.status} /></td><td className="px-5 py-4 text-gray-600">{new Date(issue.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">{issues.map((issue, index) => <article key={issue.id} style={index < 8 ? { animationDelay: `${index * 40}ms` } : undefined} className={`rounded-card border border-line bg-white p-4 card-interactive ${index < 8 ? 'animate-row-enter' : ''}`}><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-ink">{issue.title}</h2><StatusPill status={issue.status} label={issue.status === 'In Progress' ? 'In progress' : issue.status} /></div><p className="mt-2 text-sm text-gray-600">{issue.location} · {issue.category}</p><p className="mt-1 text-xs text-gray-500">{new Date(issue.created_at).toLocaleDateString()}</p></article>)}</div>
            <nav className="mt-4 flex items-center justify-between" aria-label="Issue pages"><button disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40">Previous</button><span className="text-sm text-gray-600">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => changePage(page + 1)} className="rounded bg-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Next</button></nav>
          </>
        )}
        <p className="mt-5 text-xs text-gray-500">Public view: titles, places and statuses only. Log in to report an issue or follow your own reports.</p>
      </section>
    </main>
  );
}
