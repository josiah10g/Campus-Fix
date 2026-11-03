// frontend/src/components/IssueForm.jsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const CATEGORIES = ['Electrical', 'Plumbing', 'Furniture', 'Network', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];

export default function IssueForm({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false,
  currentUser,
}) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    category: initialData.category || '',
    location: initialData.location || '',
    description: initialData.description || '',
    status: initialData.status || 'Open',
  });

  const [errors, setErrors] = useState({});
  const [shakingFields, setShakingFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEditStatus =
    isEdit && ['maintenance', 'admin', 'super_admin'].includes(currentUser?.role);

  const triggerShake = (fieldName) => {
    setShakingFields((prev) => ({ ...prev, [fieldName]: true }));
    setTimeout(() => {
      setShakingFields((prev) => ({ ...prev, [fieldName]: false }));
    }, 260);
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required';
      triggerShake('title');
    } else if (formData.title.trim().length > 100) {
      errs.title = 'Title cannot exceed 100 characters';
      triggerShake('title');
    }

    if (!formData.category) {
      errs.category = 'Please select a category';
      triggerShake('category');
    }

    if (!formData.location.trim()) {
      errs.location = 'Location is required';
      triggerShake('location');
    } else if (formData.location.trim().length > 100) {
      errs.location = 'Location cannot exceed 100 characters';
      triggerShake('location');
    }

    if (!formData.description.trim()) {
      errs.description = 'Description is required';
      triggerShake('description');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Title Field with Character Counter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="title" className="block text-xs font-semibold text-ink">
            Title
          </label>
          <span className="text-xs text-gray-400">
            {formData.title.length}/100
          </span>
        </div>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={100}
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Broken desk"
          className={`w-full px-3 py-2 text-sm bg-white border rounded focus:outline-none focus:ring-1 focus:ring-teal transition-colors ${
            errors.title
              ? 'border-statusOpen focus:border-statusOpen ring-statusOpen'
              : 'border-line focus:border-teal'
          } ${shakingFields.title ? 'animate-field-shake' : ''}`}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-statusOpen">{errors.title}</p>
        )}
      </div>

      {/* Category and Location side-by-side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-xs font-semibold text-ink mb-1.5">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm bg-white border rounded focus:outline-none focus:ring-1 focus:ring-teal transition-colors ${
              errors.category
                ? 'border-statusOpen focus:border-statusOpen'
                : 'border-line focus:border-teal'
            } ${shakingFields.category ? 'animate-field-shake' : ''}`}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-statusOpen">{errors.category}</p>
          )}
        </div>

        <div>
          <label htmlFor="location" className="block text-xs font-semibold text-ink mb-1.5">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            maxLength={100}
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Library, 2nd floor"
            className={`w-full px-3 py-2 text-sm bg-white border rounded focus:outline-none focus:ring-1 focus:ring-teal transition-colors ${
              errors.location
                ? 'border-statusOpen focus:border-statusOpen'
                : 'border-line focus:border-teal'
            } ${shakingFields.location ? 'animate-field-shake' : ''}`}
          />
          {errors.location && (
            <p className="mt-1 text-xs text-statusOpen">{errors.location}</p>
          )}
        </div>
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-xs font-semibold text-ink mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          placeholder={isEdit ? "Describe the issue in detail..." : "Describe the problem so staff can find it."}
          className={`w-full px-3 py-2 text-sm bg-white border rounded focus:outline-none focus:ring-1 focus:ring-teal transition-colors ${
            errors.description
              ? 'border-statusOpen focus:border-statusOpen'
              : 'border-line focus:border-teal'
          } ${shakingFields.description ? 'animate-field-shake' : ''}`}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-statusOpen">{errors.description}</p>
        )}
      </div>

      {/* Status Field (Edit only & privileged role) */}
      {canEditStatus && (
        <div>
          <label htmlFor="status" className="block text-xs font-semibold text-ink mb-1.5">
            Status
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full sm:w-60 px-3 py-2 text-sm bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">
              Maintenance, admin, super admin only
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex items-center justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-line text-xs font-semibold text-ink rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-medium text-sm rounded shadow-none btn-interactive disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'Save changes' : 'Submit report'}
        </button>
      </div>

      {!isEdit && (
        <p className="text-xs text-gray-400 mt-2">
          Create: all five roles
        </p>
      )}
    </form>
  );
}
