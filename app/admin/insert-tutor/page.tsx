"use client";

import { useState } from "react";

interface TutorForm {
  name: string;
  designation: string;
  tutor_order: string;
  photo: string | File; // can be string path or File
  about: string;
  education: string;
  specialization: string;
  language: string;
}

export default function InsertTutorPage() {
  const [form, setForm] = useState<TutorForm>({
    name: "",
    designation: "",
    tutor_order: "",
    photo: "",
    about: "",
    education: "",
    specialization: "",
    language: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("action", "insert-tutor");
      formData.append("name", form.name);
      formData.append("designation", form.designation);
      formData.append("tutor_order", form.tutor_order);

      // Handle File or string for photo
      if (form.photo instanceof File) {
        formData.append("photo", form.photo);
      } else {
        formData.append("photo", form.photo);
      }

      formData.append("about", form.about);
      formData.append("education", form.education || "");
      formData.append("specialization", form.specialization || "");
      formData.append("language", form.language || "");

      const res = await fetch(
        "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data?.isSuccess) {
        alert("Tutor inserted successfully!");
        setForm({
          name: "",
          designation: "",
          tutor_order: "",
          photo: "",
          about: "",
          education: "",
          specialization: "",
          language: "",
        });
      } else {
        alert(data?.message || "Insertion failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container my-5">
      <h1 className="mb-4">Insert Tutor</h1>

      <form onSubmit={handleSubmit} className="row g-3">
        {/* Name */}
        <div className="col-md-4">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter tutor's name"
          />
        </div>

        {/* Designation */}
        <div className="col-md-4">
          <label className="form-label">Designation</label>
          <input
            type="text"
            className="form-control"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            required
            placeholder="e.g., Math Tutor"
          />
        </div>

        {/* Tutor Order */}
        <div className="col-md-4">
          <label className="form-label">Tutor Order</label>
          <input
            type="number"
            className="form-control"
            name="tutor_order"
            value={form.tutor_order}
            onChange={handleChange}
            required
            placeholder="Display order (e.g., 1, 2, 3)"
          />
        </div>

        {/* Upload Photo */}
        <div className="col-md-6">
          <label className="form-label">Upload Photo</label>
          <input
            type="file"
            className="form-control"
            name="photo"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setForm((prev) => ({
                  ...prev,
                  photo: e.target.files![0],
                }));
              }
            }}
            required
          />
        </div>

        {/* About */}
        <div className="col-12">
          <label className="form-label">About</label>
          <textarea
            className="form-control"
            name="about"
            value={form.about}
            onChange={handleChange}
            rows={3}
            placeholder="Write about the tutor"
          />
        </div>

        {/* Education */}
        <div className="col-md-4">
          <label className="form-label">Education</label>
          <input
            type="text"
            className="form-control"
            name="education"
            value={form.education}
            onChange={handleChange}
            placeholder="Education details"
          />
        </div>

        {/* Specialization */}
        <div className="col-md-4">
          <label className="form-label">Specialization</label>
          <input
            type="text"
            className="form-control"
            name="specialization"
            value={form.specialization}
            onChange={handleChange}
            placeholder="Specialization area"
          />
        </div>

        {/* Language */}
        <div className="col-md-4">
          <label className="form-label">Language</label>
          <input
            type="text"
            className="form-control"
            name="language"
            value={form.language}
            onChange={handleChange}
            placeholder="Languages spoken"
          />
        </div>

        {/* Submit Button */}
        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary-custom mt-4 px-5 py-2"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Insert Tutor"}
          </button>
        </div>
      </form>
    </div>
  );
}
