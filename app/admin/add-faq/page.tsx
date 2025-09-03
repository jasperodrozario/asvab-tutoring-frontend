'use client';
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function AddFaqPage() {
  const [formData, setFormData] = useState({
    question: '',
    course_id: '',
    answers: '',
    related_to: '',
    related_id: '',
    category: '',
    order: '',
    is_online: 'N', // default N
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('action', 'add-faq'); // ✅ required
    fd.append('question', formData.question.trim());
    fd.append('course_id', formData.course_id.trim());
    fd.append('answers', formData.answers.trim());
    fd.append('related_to', formData.related_to.trim());
    fd.append('related_id', formData.related_id.trim());
    fd.append('category', formData.category.trim());
    fd.append('order', formData.order.trim());
    fd.append('is_online', formData.is_online); // ✅ must be "N" or "Y" (string!)

    try {
      const res = await fetch(
        'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
        {
          method: 'POST',
          body: fd,
        }
      );
      const data = await res.json();
      console.log('Response:', data);

      if (data.isSuccess) {
        alert('FAQ inserted successfully!');
      } else {
        alert(data.message || 'Failed to insert FAQ.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Add FAQ</h2>
      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Question</label>
          <input
            type="text"
            className="form-control"
            name="question"
            value={formData.question}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Course ID</label>
          <input
            type="number"
            className="form-control"
            name="course_id"
            value={formData.course_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12">
          <label className="form-label">Answer</label>
          <textarea
            className="form-control"
            name="answers"
            value={formData.answers}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="col-md-6">
          <label className="form-label">Related To</label>
          <input
            type="text"
            className="form-control"
            name="related_to"
            value={formData.related_to}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Related ID</label>
          <input
            type="number"
            className="form-control"
            name="related_id"
            value={formData.related_id}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Category</label>
          <input
            type="text"
            className="form-control"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Order</label>
          <input
            type="number"
            className="form-control"
            name="order"
            value={formData.order}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Is Online</label>
          <select
            className="form-select"
            name="is_online"
            value={formData.is_online}
            onChange={handleChange}
          >
            <option value="N">No</option>
            <option value="Y">Yes</option>
          </select>
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            Submit FAQ
          </button>
        </div>
      </form>
    </div>
  );
}
