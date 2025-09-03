'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import CKEditor so it only loads on client
const CKEditor = dynamic(
  async () => {
    const { CKEditor } = await import('@ckeditor/ckeditor5-react');
    const ClassicEditor = (await import('@ckeditor/ckeditor5-build-classic')).default;
    return function CKEditorWrapper(props: any) {
      return <CKEditor editor={ClassicEditor} {...props} />;
    };
  },
  { ssr: false }
);

export default function InsertAboutUsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOnline, setIsOnline] = useState<'Y' | 'N'>('Y');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('action', 'insert-about-us');
    formData.append('title', title);
    formData.append('description', description);
    formData.append('is_online', isOnline);

    const res = await fetch(
      'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
      { method: 'POST', body: formData }
    );

    const data = await res.json();
    console.log('Response:', data);
    alert('About Us inserted successfully!');
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Insert About Us</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className="block font-medium">Description</label>
          <CKEditor
            data={description}
            onChange={(event: any, editor: any) => setDescription(editor.getData())}
          />
        </div>

        <div>
          <label className="block font-medium">Is Online?</label>
          <select
            value={isOnline}
            onChange={(e) => setIsOnline(e.target.value as 'Y' | 'N')}
            className="border rounded p-2"
          >
            <option value="Y">Yes</option>
            <option value="N">No</option>
          </select>
        </div>

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
