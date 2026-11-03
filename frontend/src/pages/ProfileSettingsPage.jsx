import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, UserRound } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    password: '',
    faculty: user.faculty || '',
    department: user.department || '',
    student_id: user.student_id || '',
    level: user.level || '',
    staff_type: user.staff_type || '',
    profile_picture_url: user.profile_picture_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const choosePicture = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      setToast({ type: 'error', message: 'Choose a PNG, JPEG, or WebP image up to 1 MB.' });
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((previous) => ({ ...previous, profile_picture_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { user: updated } = await api.updateProfile(form);
      updateUser(updated);
      setForm((previous) => ({ ...previous, password: '' }));
      setToast({ type: 'success', message: 'Profile settings saved.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Could not save your profile.' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal';

  return (
    <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Link to="/issues" className="mb-5 inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal btn-interactive">
        <ArrowLeft size={16} /> Campus Dashboard
      </Link>

      <section className="rounded-card border border-line bg-white p-5 sm:p-8 card-interactive">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">Profile settings</h1>
          <p className="mt-2 text-base text-gray-600">Update your account details and optional profile picture.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-teal text-2xl font-bold text-white">
              {form.profile_picture_url ? <img src={form.profile_picture_url} alt="Profile preview" className="h-full w-full object-cover" /> : <UserRound size={32} />}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePicture} className="sr-only" />
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded border border-line px-4 py-2.5 text-base font-semibold text-ink hover:border-teal hover:text-teal btn-interactive">
                <Upload size={16} /> Choose profile picture
              </button>
              <p className="mt-2 text-sm text-gray-600">PNG, JPEG, or WebP; maximum size 1 MB. Optional.</p>
              {form.profile_picture_url && <button type="button" onClick={() => setForm({ ...form, profile_picture_url: '' })} className="mt-2 text-sm font-semibold text-statusOpen hover:underline">Remove picture</button>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-base font-semibold text-ink">Full name<input name="name" value={form.name} onChange={updateField} maxLength={60} required className={inputClass} /></label>
            <label className="text-base font-semibold text-ink">Email address<input name="email" type="email" value={form.email} onChange={updateField} maxLength={120} required className={inputClass} /></label>
            <label className="text-base font-semibold text-ink sm:col-span-2">New password <span className="font-normal text-gray-500">(leave blank to keep your current one)</span><input name="password" type="password" value={form.password} onChange={updateField} minLength={8} autoComplete="new-password" className={inputClass} /></label>
          </div>

          {user.role === 'student' && <div className="border-t border-line pt-5">
            <h2 className="text-lg font-bold text-ink">Academic details</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-base font-semibold text-ink">Faculty<input name="faculty" value={form.faculty} onChange={updateField} maxLength={100} required className={inputClass} /></label>
              <label className="text-base font-semibold text-ink">Department<input name="department" value={form.department} onChange={updateField} maxLength={100} required className={inputClass} /></label>
              <label className="text-base font-semibold text-ink">Student ID<input name="student_id" value={form.student_id} onChange={updateField} maxLength={60} required className={inputClass} /></label>
              <label className="text-base font-semibold text-ink">Level<input name="level" value={form.level} onChange={updateField} maxLength={40} required className={inputClass} /></label>
            </div>
          </div>}

          {user.role === 'staff' && <label className="block border-t border-line pt-5 text-base font-semibold text-ink">Staff type
            <select name="staff_type" value={form.staff_type} onChange={updateField} required className={inputClass}>
              <option value="">Select staff type</option><option value="Lecturer">Lecturer</option><option value="Maintenance officer">Maintenance officer</option>
            </select>
          </label>}

          <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center rounded bg-teal px-5 py-3 text-base font-bold text-white hover:bg-teal-dark btn-interactive disabled:opacity-60">
            {saving && <Loader2 size={18} className="mr-2 animate-spin" />}Save profile
          </button>
        </form>
      </section>
    </div>
  );
}
