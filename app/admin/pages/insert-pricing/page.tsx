'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic CKEditor import (client-side only)
const CKEditorField = dynamic(
  () => import('@/components/ckeditor/CKEditorField'),
  { ssr: false }
);

export default function InsertPricingPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [closingContent, setClosingContent] = useState('');
  const [editorKey, setEditorKey] = useState(0); // 🔑 used to force reset
  const [isOnline, setIsOnline] = useState<'Y' | 'N'>('Y');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('action', 'insert-pricing-page-content');
    formData.append('title', title);
    formData.append('description', description);
    formData.append('closing_content', closingContent);
    formData.append('is_online', isOnline);

    try {
      const res = await fetch(
        'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if (data?.isSuccess) {
        alert('✅ Pricing page content added successfully!');

        // Reset fields
        setTitle('');
        setDescription('');
        setClosingContent('');
        setIsOnline('Y');
        setEditorKey((prev) => prev + 1); // 🔄 re-mount CKEditor to reset
      } else {
        alert(data?.message || '❌ Failed to add Pricing page content');
      }
    } catch (error) {
      console.error(error);
      alert('❌ Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container my-5">
      <h1 className="mb-4">Insert Pricing Page Content</h1>
      <form onSubmit={handleSubmit} className="row g-3">
        {/* Title */}
        <div className="col-12">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter title"
          />
        </div>

        {/* Description */}
        <div className="col-12">
          <label className="form-label">Description</label>
          <CKEditorField
            key={editorKey + '-desc'}
            value={description}
            onChange={(data) => setDescription(data)}
          />
        </div>

        {/* Closing Content */}
        <div className="col-12">
          <label className="form-label">Closing Content</label>
          <CKEditorField
            key={editorKey + '-closing'}
            value={closingContent}
            onChange={(data) => setClosingContent(data)}
          />
        </div>

        {/* is_online Radio Buttons */}
        <div className="col-12">
          <label className="form-label d-block">Is Online?</label>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              id="isOnlineYes"
              value="Y"
              checked={isOnline === 'Y'}
              onChange={(e) => setIsOnline(e.target.value as 'Y')}
            />
            <label className="form-check-label" htmlFor="isOnlineYes">
              Yes
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              id="isOnlineNo"
              value="N"
              checked={isOnline === 'N'}
              onChange={(e) => setIsOnline(e.target.value as 'N')}
            />
            <label className="form-check-label" htmlFor="isOnlineNo">
              No
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary-custom mx-auto d-block mt-3 w-25"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Add Pricing Content'}
          </button>
        </div>
      </form>
    </div>
  );
}
