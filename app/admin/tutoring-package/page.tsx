'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const CKEditorField = dynamic(
  () => import('@/components/ckeditor/CKEditorField'),
  { ssr: false }
);

interface FormState {
  name: string;
  description: string;
  course_id: string;
  price: string;
  sessions: string;
  free_sessions: string;
  is_one_to_one: 'Y' | 'N';
  is_group_tutoring: 'Y' | 'N';
  is_web_subcription: 'Y' | 'N';
  cover_image: File | null;
  payment_methode: File | null;
}

export default function TutoringPackagePage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    course_id: '',
    price: '',
    sessions: '',
    free_sessions: '',
    is_one_to_one: 'N',
    is_group_tutoring: 'N',
    is_web_subcription: 'N',
    cover_image: null,
    payment_methode: null,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked ? 'Y' : 'N' }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'cover_image' | 'payment_methode'
  ) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('action', 'add-tutoring-package');
    Object.entries(form).forEach(([key, value]) => {
      if (value instanceof File) formData.append(key, value);
      else formData.append(key, value ?? ''); // ✅ ensure string
    });

    try {
      const res = await fetch(
        'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if ((data as any)?.isSuccess) {
        alert('✅ Tutoring package added successfully!');
        setForm({
          name: '',
          description: '',
          course_id: '',
          price: '',
          sessions: '',
          free_sessions: '',
          is_one_to_one: 'N',
          is_group_tutoring: 'N',
          is_web_subcription: 'N',
          cover_image: null,
          payment_methode: null,
        });
      } else {
        alert((data as any)?.message || '❌ Failed to add package');
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
      <h1 className="mb-4">Add New Tutoring Package</h1>
      <form onSubmit={handleSubmit} className="row g-3">
        {/* Name */}
        <div className="col-md-6">
          <label className="form-label">Package Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Course ID */}
        <div className="col-md-6">
          <label className="form-label">Course ID</label>
          <input
            type="text"
            className="form-control"
            name="course_id"
            value={form.course_id}
            onChange={handleChange}
            required
          />
        </div>

        {/* Price */}
        <div className="col-md-6">
          <label className="form-label">Price</label>
          <input
            type="number"
            className="form-control"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>

        {/* Sessions */}
        <div className="col-md-6">
          <label className="form-label">Total Sessions</label>
          <input
            type="number"
            className="form-control"
            name="sessions"
            value={form.sessions}
            onChange={handleChange}
            required
          />
        </div>

        {/* Free Sessions */}
        <div className="col-md-6">
          <label className="form-label">Free Sessions</label>
          <input
            type="number"
            className="form-control"
            name="free_sessions"
            value={form.free_sessions}
            onChange={handleChange}
            required
          />
        </div>

        {/* Cover Image */}
        <div className="col-md-6">
          <label className="form-label">Cover Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'cover_image')}
            required
          />
        </div>

        {/* Payment Method */}
        <div className="col-md-6">
          <label className="form-label">Payment Method</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'payment_methode')}
            required
          />
        </div>

        {/* Description */}
        <div className="col-12">
          <label className="form-label">Description</label>
          <CKEditorField
            value={form.description}
            onChange={(data) => setForm((prev) => ({ ...prev, description: data }))}
          />
        </div>

        {/* Package Type */}
        <div className="col-12 d-flex gap-4 mt-3">
          {['is_one_to_one', 'is_group_tutoring', 'is_web_subcription'].map((key) => (
            <div key={key} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name={key}
                checked={(form as any)[key] === 'Y'}
                onChange={handleCheckboxChange}
              />
              <label className="form-check-label">{key.replace(/_/g, ' ')}</label>
            </div>
          ))}
        </div>

        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary w-50 d-block mx-auto mt-4"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Add Package'}
          </button>
        </div>
      </form>
    </div>
  );
}
