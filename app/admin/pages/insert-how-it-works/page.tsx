'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const CKEditorField = dynamic(
  () => import('@/components/ckeditor/CKEditorField'),
  { ssr: false }
);

export default function InsertHowItWorksPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // new state to force CKEditor reset

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('action', 'insert-how-it-works');
    formData.append('title', title);
    formData.append('description', description);

    try {
      const res = await fetch(
        'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if ((data as any)?.isSuccess) {
        alert('✅ How It Works added successfully!');

        // reset form fields
        setTitle('');
        setDescription('');
        setEditorKey(prev => prev + 1); // force CKEditor remount
      } else {
        alert((data as any)?.message || '❌ Failed to add How It Works');
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
      <h1 className="mb-4">Insert How It Works</h1>
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
            key={editorKey} // add this to reset
            value={description}
            onChange={(data) => setDescription(data)}
          />
        </div>

        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary-custom mx-auto d-block mt-3 w-25"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Add Page'}
          </button>
        </div>
      </form>
    </div>
  );
}
