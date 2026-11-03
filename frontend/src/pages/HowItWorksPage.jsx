import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusPill from '../components/StatusPill';

const steps = [
  ['Sign up', 'Students and staff create an account in under a minute.'],
  ['Report', 'Give it a title, category, place and a short description.'],
  ['Track', 'Maintenance staff move it from Open to In progress.'],
  ['Resolved', 'Everyone sees the fix, so nothing is forgotten.'],
];

const permissions = [
  ['Student', 'Report issues, follow every status, edit or delete their own issues while Open.'],
  ['Staff member', 'Same as a student.'],
  ['Maintenance staff', 'Update the status of any issue and edit any issue.'],
  ['Admin', 'Everything maintenance can do, plus delete any issue.'],
  ['Super admin', 'Everything an admin can do, plus create accounts and manage roles.'],
];

export default function HowItWorksPage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 animate-page-enter">
      <h1 className="text-3xl font-bold text-ink sm:text-4xl">How CampusFix works</h1>
      <p className="mt-2 text-gray-600">From a broken light to a fixed one, in four steps. Everyone can see where an issue stands.</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Four steps">
        {steps.map(([title, description], index) => (
          <article key={title} className="flex min-h-48 items-start gap-3 rounded-card border border-line bg-white p-5 card-interactive">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-safetyYellow text-lg font-bold text-ink">{index + 1}</span>
            <div><h2 className="text-lg font-bold text-ink">{title}</h2><p className="mt-4 leading-7 text-gray-600">{description}</p></div>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-ink">Every issue follows one path</h2>
        <div className="mt-5 flex flex-col gap-5 rounded-card border border-line bg-white p-5 md:flex-row md:items-center md:justify-between card-interactive">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-center"><StatusPill status="Open" /><p className="mt-2 text-xs text-gray-500">Reported</p></div>
            <span aria-hidden="true" className="text-2xl text-gray-400">→</span>
            <div className="text-center"><StatusPill status="In Progress" label="In progress" /><p className="mt-2 text-xs text-gray-500">Work has started</p></div>
            <span aria-hidden="true" className="text-2xl text-gray-400">→</span>
            <div className="text-center"><StatusPill status="Resolved" /><p className="mt-2 text-xs text-gray-500">Fixed</p></div>
          </div>
          <p className="max-w-lg text-sm text-gray-600">Only maintenance staff, admins and the super admin can change an issue status.</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold text-ink">Who can do what</h2>
        <div className="space-y-2 md:hidden">{permissions.map(([role, description]) => <article key={role} className="rounded-card border border-line bg-white p-4 card-interactive"><h3 className="font-bold text-ink">{role}</h3><p className="mt-1 text-sm text-gray-600">{description}</p></article>)}</div>
        <div className="hidden overflow-x-auto rounded-card border border-line bg-white md:block card-interactive">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-[#E8EEEC] text-gray-600"><tr><th className="px-5 py-3">Role</th><th className="px-5 py-3">What they can do</th></tr></thead>
            <tbody className="divide-y divide-line">{permissions.map(([role, description]) => <tr key={role}><th scope="row" className="px-5 py-3 font-semibold text-ink">{role}</th><td className="px-5 py-3 text-gray-700">{description}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-5 rounded-card bg-teal p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div><h2 className="text-2xl font-bold">Spotted something broken?</h2><p className="mt-1 text-sm">Create an account and report it in under a minute. Anyone on campus can sign up.</p></div>
        <div className="flex flex-wrap gap-3">
          {user ? <><Link to="/report" className="rounded bg-white px-5 py-3 text-sm font-bold text-teal">Report an issue</Link><Link to="/issues" className="rounded border border-white px-5 py-3 text-sm font-bold text-white">Go to dashboard</Link></> : <><Link to="/register?next=/report" className="rounded bg-white px-5 py-3 text-sm font-bold text-teal">Create account</Link><Link to="/login?next=/report" className="rounded border border-white px-5 py-3 text-sm font-bold text-white">Log in</Link></>}
        </div>
      </section>
    </main>
  );
}
