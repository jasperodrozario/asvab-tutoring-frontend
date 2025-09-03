'use client';

import React, { useState } from 'react';
import CKEditorField from '@/components/ckeditor/CKEditorField';

export default function InsertHowItWorksPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      console.log('Response:', data);
      alert('How It Works inserted successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to insert How It Works.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Insert How It Works</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium">Description</label>
          <CKEditorField
            value={description}
            onChange={setDescription}
            placeholder="Enter description..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary-custom mt-4 px-5 py-2"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
