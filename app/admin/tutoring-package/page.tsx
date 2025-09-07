'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const CKEditorField = dynamic(
  () => import('@/components/ckeditor/CKEditorField'),
  { ssr: false }
);

interface Course {
  course_id: string;
  name: string;
}

interface FormState {
  course_id: string;
  title: string;
  description: string;
  code_name: string;
  num_of_sessions: string;
  order: string;
}

export default function TutoringPackagePage() {
  const [form, setForm] = useState<FormState>({
    course_id: '',
    title: '',
    description: '',
    code_name: '',
    num_of_sessions: '',
    order: '',
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch course list
  useEffect(() => {
    const fetchCourses = async () => {
      const formData = new FormData();
      formData.append('action', 'course-list-tutoring-package');

      const res = await fetch(
        'https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php',
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data?.isSuccess) setCourses(data.data);
    };
    fetchCourses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('action', 'add-tutoring-package');
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
        alert('✅ Tutoring package added successfully!');
        setForm({
          course_id: '',
          title: '',
          description: '',
          code_name: '',
          num_of_sessions: '',
          order: '',
        });
      } else {
        alert(data?.message || '❌ Failed to add package');
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

        {/* Course Dropdown */}
        <div className="col-md-6">
          <label className="form-label">Select Course</label>
          <select
            className="form-select"
            name="course_id"
            value={form.course_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Course --</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="col-md-6">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Code Name */}
        <div className="col-md-6">
          <label className="form-label">Code Name</label>
          <input
            type="text"
            className="form-control"
            name="code_name"
            value={form.code_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Number of Sessions */}
        <div className="col-md-6">
          <label className="form-label">Number of Sessions</label>
          <input
            type="number"
            className="form-control"
            name="num_of_sessions"
            value={form.num_of_sessions}
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

        {/* Description */}
        <div className="col-12">
          <label className="form-label">Description</label>
          <CKEditorField
            value={form.description}
            onChange={(data) => setForm((prev) => ({ ...prev, description: data }))}
          />
        </div>

        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary-custom mt-4 px-5 py-2"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Add Package'}
          </button>
        </div>
      </form>
    </div>
  );
}
