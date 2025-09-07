'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const CKEditorField = dynamic(
  () => import('@/components/ckeditor/CKEditorField'),
  { ssr: false }
);

interface Package {
  package_id: string;
  title: string;
}

interface FormState {
  package_id: string;
  title: string;
  price: string;
  feature: string;
  is_most_popular: '0' | '1';
  order: string;
}

export default function AddTutoringPackageSessions() {
  const [form, setForm] = useState<FormState>({
    package_id: '',
    title: '',
    price: '',
    feature: '',
    is_most_popular: '0',
    order: '',
  });

  const [packages, setPackages] = useState<Package[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch package list
  useEffect(() => {
    const fetchPackages = async () => {
      const formData = new FormData();
      formData.append('action', 'get-tutoring-packages');

      const res = await fetch(
        'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data?.isSuccess) setPackages(data.data);
    };
    fetchPackages();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setForm((prev) => ({ ...prev, is_most_popular: checked ? '1' : '0' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('action', 'add-tutoring-package-sessions');
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const res = await fetch(
        'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data?.isSuccess) {
        alert('✅ Tutoring package session added successfully!');
        setForm({
          package_id: '',
          title: '',
          price: '',
          feature: '',
          is_most_popular: '0',
          order: '',
        });
      } else {
        alert(data?.message || '❌ Failed to add session');
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
      <h1 className="mb-4">Add Tutoring Package Session</h1>
      <form onSubmit={handleSubmit} className="row g-3">

        {/* Package Dropdown */}
        <div className="col-md-6">
          <label className="form-label">Select Package</label>
          <select
            className="form-select"
            name="package_id"
            value={form.package_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Package --</option>
            {packages.map((pkg) => (
              <option key={pkg.package_id} value={pkg.package_id}>
                {pkg.title}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="col-md-6">
          <label className="form-label">Session Title</label>
          <input
            type="text"
            className="form-control"
            name="title"
            value={form.title}
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

        {/* Order */}
        <div className="col-md-6">
          <label className="form-label">Order</label>
          <input
            type="number"
            className="form-control"
            name="order"
            value={form.order}
            onChange={handleChange}
            required
          />
        </div>

        {/* Feature (CKEditor) */}
        <div className="col-12">
          <label className="form-label">Feature</label>
          <CKEditorField
            value={form.feature}
            onChange={(data) => setForm((prev) => ({ ...prev, feature: data }))}
          />
        </div>

        {/* Is Most Popular */}
        <div className="col-12">
          <div className="form-check mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="is_most_popular"
              checked={form.is_most_popular === '1'}
              onChange={handleCheckboxChange}
            />
            <label className="form-check-label" htmlFor="is_most_popular">
              Mark as Most Popular
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary-custom mt-4 px-5 py-2"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Add Session'}
          </button>
        </div>
      </form>
    </div>
  );
}
