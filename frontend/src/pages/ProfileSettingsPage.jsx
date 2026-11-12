import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Upload, UserRound } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { ACADEMIC_PROGRAMMES, STANDARD_LEVELS } from '../data/academicData';

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // Detect initial programme by matching current faculty
  const detectProgramme = () => {
    if (!user.faculty) return 'Undergraduate';
    if (ACADEMIC_PROGRAMMES.Postgraduate[user.faculty]) return 'Postgraduate';
    return 'Undergraduate';
  };

  // Detect if current level matches a standard option
  const detectLevelOption = () => {
    if (!user.level) return '100 Level';
    if (STANDARD_LEVELS.includes(user.level)) return user.level;
    return 'Other';
  };

  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    current_password: '',
    password: '',
    confirm_password: '',
    programme: detectProgramme(),
    faculty: user.faculty || '',
    department: user.department || '',
    student_id: user.student_id || '',
    levelOption: detectLevelOption(),
    customLevel: detectLevelOption() === 'Other' ? (user.level || '') : '',
    profile_picture_url: user.profile_picture_url || '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  // Dynamic faculty and department lists
  const currentFaculties = Object.keys(ACADEMIC_PROGRAMMES[form.programme] || {});
  const currentDepartments = form.faculty ? (ACADEMIC_PROGRAMMES[form.programme]?.[form.faculty] || []) : [];

  const handleProgrammeChange = (prog) => {
    setForm((prev) => ({ ...prev, programme: prog, faculty: '', department: '' }));
  };

  const handleFacultyChange = (fac) => {
    setForm((prev) => ({ ...prev, faculty: fac, department: '' }));
  };

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

    const isChangingEmail = form.email && form.email.trim().toLowerCase() !== (user.email || '').toLowerCase();
    const isChangingPassword = Boolean(form.password && form.password.trim());

    if (isChangingPassword) {
      if (form.password.length < 8) {
        setToast({ type: 'error', message: 'New password must be at least 8 characters long.' });
        return;
      }
      if (form.password !== form.confirm_password) {
        setToast({ type: 'error', message: 'New password and confirmation do not match.' });
        return;
      }
    }

    const finalLevel = form.levelOption === 'Other' ? form.customLevel.trim() : form.levelOption;

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        faculty: form.faculty,
        department: form.department,
        student_id: form.student_id,
        level: finalLevel,
        profile_picture_url: form.profile_picture_url,
      };

      if (isChangingPassword) {
        payload.password = form.password;
      }

      const res = await api.updateProfile(payload);
      const updated = res.user;
      updateUser(updated);

      if (res.requiresVerification) {
        const emailSent = res.emailSent !== false;
        setToast({
          type: emailSent ? 'success' : 'error',
          message: emailSent
            ? 'Security updates saved! Check your email to confirm the change.'
            : 'Security updates saved, but the verification email could not be sent. Try resending it.',
        });
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(form.email)}${emailSent ? '' : '&sent=false'}`);
        }, 1200);
        return;
      }

      setToast({ type: 'success', message: 'Profile settings saved successfully.' });
      setTimeout(() => {
        navigate('/issues', { state: { message: 'Profile settings saved successfully.' } });
      }, 700);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Could not save your profile.' });
      setSaving(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal';
  const selectClass = 'mt-1 w-full rounded border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal';

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

          {/* Academic Details with Dropdowns for Everyone */}
          <div className="border-t border-line pt-5">
            <h2 className="text-lg font-bold text-ink">Academic details</h2>
            <p className="text-sm text-gray-500 mb-3">Keep your faculty, department, student ID, and level up to date.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-base font-semibold text-ink">Programme</label>
                <select
                  value={form.programme}
                  onChange={(e) => handleProgrammeChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-ink">Faculty / College</label>
                <select
                  value={form.faculty}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select Faculty...</option>
                  {currentFaculties.map((fac) => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-ink">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  disabled={!form.faculty}
                  className={`${selectClass} disabled:opacity-50`}
                >
                  <option value="">Select Department...</option>
                  {currentDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-base font-semibold text-ink">
                    {user.role === 'student' ? 'Matric Number' : 'Staff / Member ID'}
                  </label>
                  {user.role === 'student' && (
                    
                  )}
                </div>
                <input
                  name="student_id"
                  inputMode={user.role === 'student' ? 'numeric' : 'text'}
                  value={form.student_id}
                  onChange={(e) => {
                    const val = user.role === 'student'
                      ? e.target.value.replace(/\D/g, '').slice(0, 9)
                      : e.target.value;
                    setForm({ ...form, student_id: val });
                  }}
                  maxLength={user.role === 'student' ? 9 : 60}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-ink">Level</label>
                <select
                  value={form.levelOption}
                  onChange={(e) => setForm({ ...form, levelOption: e.target.value })}
                  className={selectClass}
                >
                  {STANDARD_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
                {form.levelOption === 'Other' && (
                  <input
                    type="text"
                    value={form.customLevel}
                    onChange={(e) => setForm({ ...form, customLevel: e.target.value })}
                    maxLength={40}
                    required
                    className={`${inputClass} mt-2`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Password Security Section */}
          <div className="border-t border-line pt-5">
            <h2 className="text-lg font-bold text-ink">Change password</h2>
            <p className="text-sm text-gray-500 mb-4">Leave these fields blank if you do not wish to change your password.</p>

            <div className="space-y-4">
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
