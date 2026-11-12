// frontend/src/components/IssueForm.jsx
import React, { useState, useRef } from 'react';
import { Loader2, Camera, Upload, X, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = ['Electrical', 'Plumbing', 'Furniture', 'Network', 'Other'];

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
    category_detail: initialData.category_detail || '',
    location: initialData.location || '',
    description: initialData.description || '',
    image_url: initialData.image_url || '',
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [shakingFields, setShakingFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState('');

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
    if (formData.category === 'Other' && !formData.category_detail.trim()) {
      errs.category_detail = 'Describe the category';
      triggerShake('category_detail');
    } else if (formData.category_detail.trim().length > 100) {
      errs.category_detail = 'Keep the description to 100 characters or fewer';
      triggerShake('category_detail');
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' && value !== 'Other' ? { category_detail: '' } : {}),
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImageError('Please select a PNG, JPEG, or WebP photo.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError('Photo size must be 2 MB or less.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
          {formData.category === 'Other' && (
            <div className="mt-3">
              <label htmlFor="category_detail" className="block text-xs font-semibold text-ink mb-1.5">
                Specify the category
              </label>
              <input
                id="category_detail"
                name="category_detail"
                type="text"
                maxLength={100}
                value={formData.category_detail}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm bg-white border rounded focus:outline-none focus:ring-1 focus:ring-teal ${errors.category_detail ? 'border-statusOpen' : 'border-line focus:border-teal'} ${shakingFields.category_detail ? 'animate-field-shake' : ''}`}
              />
              {errors.category_detail && <p className="mt-1 text-xs text-statusOpen">{errors.category_detail}</p>}
            </div>
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

      {/* Photo Attachment (Upload / Snap Photo) */}
      <div className="border-t border-line pt-4">
        <label className="block text-xs font-semibold text-ink mb-1.5">
          Attach photo of broken item <span className="font-normal text-gray-500">(Optional, max 2 MB)</span>
        </label>

        {formData.image_url ? (
          <div className="relative rounded border border-line bg-[#FAFBFB] p-3 flex items-center gap-4">
            <div className="w-24 h-24 rounded border border-line overflow-hidden bg-white shrink-0">
              <img
                src={formData.image_url}
                alt="Broken issue preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink">Photo attached</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Admins and maintenance staff will see this photo when reviewing the report.</p>
              <button
                type="button"
                onClick={removeImage}
                className="inline-flex items-center gap-1 text-xs font-semibold text-statusOpen hover:underline mt-2"
              >
                <X size={14} /> Remove photo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageFile}
              className="sr-only"
            />
            {/* Camera input on mobile browsers */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageFile}
              className="sr-only"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-line bg-white text-ink text-xs font-semibold rounded hover:border-teal hover:text-teal btn-interactive"
              >
                <Upload size={14} /> Upload image
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-line bg-white text-ink text-xs font-semibold rounded hover:border-teal hover:text-teal btn-interactive"
              >
                <Camera size={14} /> Snap photo
              </button>
            </div>
            {imageError && (
              <p className="text-xs text-statusOpen mt-1">{imageError}</p>
            )}
          </div>
        )}
      </div>

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
    </form>
  );
}
