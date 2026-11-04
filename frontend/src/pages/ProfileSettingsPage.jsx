import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Upload, UserRound } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    current_password: '',
    password: '',
    confirm_password: '',
    faculty: user.faculty || '',
    department: user.department || '',
    student_id: user.student_id || '',
    level: user.level || '',
    profile_picture_url: user.profile_picture_url || '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (form.password) {
      if (form.password.length < 8) {
        setToast({ type: 'error', message: 'New password must be at least 8 characters long.' });
        return;
      }
      if (form.password !== form.confirm_password) {
        setToast({ type: 'error', message: 'New password and confirmation do not match.' });
        return;
      }
      if (['admin', 'super_admin', 'maintenance'].includes(user.role) && !form.current_password) {
        setToast({ type: 'error', message: 'Current password is required to change password.' });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        faculty: form.faculty,
        department: form.department,
        student_id: form.student_id,
        level: form.level,
        profile_picture_url: form.profile_picture_url,
      };

      if (form.password) {
        payload.password = form.password;
        payload.current_password = form.current_password;
      }

      const { user: updated } = await api.updateProfile(payload);
      updateUser(updated);

      setToast({ type: 'success', message: 'Profile settings saved successfully.' });
      // Redirect back to /issues with confirmation message
      setTimeout(() => {
        navigate('/issues', { state: { message: 'Profile settings saved successfully.' } });
      }, 700);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Could not save your profile.' });
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

      <section className="rounded-card border border-line bg-white p-5 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">Profile settings</h1>
          <p className="mt-2 text-base text-gray-600">Update your account details, academic status, and optional profile picture.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-teal text-2xl font-bold text-white shadow-sm">
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
            <label className="text-base font-semibold text-ink">
              Full name
              <input name="name" value={form.name} onChange={updateField} maxLength={60} required className={inputClass} />
            </label>
            <label className="text-base font-semibold text-ink">
              Email address
              <input name="email" type="email" value={form.email} onChange={updateField} maxLength={120} required className={inputClass} />
            </label>
          </div>

          {/* Academic Details for Everyone */}
          <div className="border-t border-line pt-5">
            <h2 className="text-lg font-bold text-ink">Academic details & affiliation</h2>
            <p className="text-sm text-gray-500 mb-3">Keep your faculty, department, student or staff ID, and level up to date.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-base font-semibold text-ink">
                Faculty
                <input name="faculty" placeholder="e.g. Science & Technology" value={form.faculty} onChange={updateField} maxLength={100} className={inputClass} />
              </label>
              <label className="text-base font-semibold text-ink">
                Department
                <input name="department" placeholder="e.g. Computer Science" value={form.department} onChange={updateField} maxLength={100} className={inputClass} />
              </label>
              <label className="text-base font-semibold text-ink">
                Campus / Student / Staff ID
                <input name="student_id" placeholder="e.g. CMP/2026/041" value={form.student_id} onChange={updateField} maxLength={60} className={inputClass} />
              </label>
              <label className="text-base font-semibold text-ink">
                Level / Designation
                <input name="level" placeholder="e.g. 400 Level or Facilities Lead" value={form.level} onChange={updateField} maxLength={40} className={inputClass} />
              </label>
            </div>
          </div>

          {/* Password Security Section */}
          <div className="border-t border-line pt-5">
            <h2 className="text-lg font-bold text-ink">Change password</h2>
            <p className="text-sm text-gray-500 mb-4">Leave these fields blank if you do not wish to change your password.</p>

            <div className="space-y-4">
              {['admin', 'super_admin', 'maintenance'].includes(user.role) && (
                <div>
                  <label className="block text-base font-semibold text-ink">
                    Current password {form.password && <span className="text-statusOpen">*</span>}
                  </label>
                  <div className="relative mt-1">
                    <input
                      name="current_password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={form.current_password}
                      onChange={updateField}
                      autoComplete="current-password"
                      placeholder="Enter current password"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-base font-semibold text-ink">New password</label>
                  <div className="relative mt-1">
                    <input
                      name="password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={updateField}
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-ink">Confirm new password</label>
                  <div className="relative mt-1">
                    <input
                      name="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirm_password}
                      onChange={updateField}
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Repeat new password"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center rounded bg-teal px-6 py-3 text-base font-bold text-white hover:bg-teal-dark btn-interactive disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/issues')}
              className="rounded border border-line bg-white px-5 py-3 text-base font-semibold text-ink hover:border-gray-400 btn-interactive"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
