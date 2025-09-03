'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic CKEditor import (client-side only)
const CKEditorField = dynamic(
  () => import('@/components/ckeditor/CKEditorField'),
  { ssr: false }
);

export default function InsertAboutUsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('action', 'add-about-us');
    formData.append('title', title);
    formData.append('description', description);

    try {
      const res = await fetch(
        'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if ((data as any)?.isSuccess) {
        alert('✅ About Us added successfully!');
        setTitle('');
        setDescription('');
      } else {
        alert((data as any)?.message || '❌ Failed to add About Us');
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
      <h1 className="mb-4">Insert About Us</h1>
      <form onSubmit={handleSubmit} className="row g-3">
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

        <div className="col-12">
          <label className="form-label">Description</label>
          <CKEditorField
            value={description}
            onChange={(data) => setDescription(data)}
          />
        </div>

        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary w-50 d-block mx-auto mt-4"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Add About Us'}
          </button>
        </div>
      </form>
    </div>
  );
}
