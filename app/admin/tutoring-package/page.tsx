'use client';

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import CKEditor and ClassicEditor (SSR-safe)
const CKEditor = dynamic(
  async () => {
    const { CKEditor } = await import("@ckeditor/ckeditor5-react");
    const ClassicEditor =
      (await import("@ckeditor/ckeditor5-build-classic")).default;
    return function CKEditorWrapper(props: any) {
      return <CKEditor editor={ClassicEditor} {...props} />;
    };
  },
  { ssr: false }
);

export default function TutoringPackagePage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    course_id: "",
    price: "",
    sessions: "",
    free_sessions: "",
    is_one_to_one: "N",
    is_group_tutoring: "N",
    is_web_subcription: "N",
    cover_image: null as File | null,
    payment_methode: null as File | null,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked ? "Y" : "N" }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "cover_image" | "payment_methode"
  ) => {
    if (e.target.files && e.target.files[0]) {
      setForm((prev) => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("action", "add-tutoring-package");
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("course_id", form.course_id);
    formData.append("price", form.price);
    formData.append("sessions", form.sessions);
    formData.append("free_sessions", form.free_sessions);
    formData.append("is_one_to_one", form.is_one_to_one);
    formData.append("is_group_tutoring", form.is_group_tutoring);
    formData.append("is_web_subcription", form.is_web_subcription);

    if (form.cover_image) {
      formData.append("cover_image", form.cover_image); // no file.name
    }
    if (form.payment_methode) {
      formData.append("payment_methode", form.payment_methode); // no file.name
    }

    // 🔍 Debug: log what files are included
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const res = await fetch(
        "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      console.log("API Response:", data);

      if (data?.isSuccess) {
        alert("Tutoring package added successfully!");
        setForm({
          name: "",
          description: "",
          course_id: "",
          price: "",
          sessions: "",
          free_sessions: "",
          is_one_to_one: "N",
          is_group_tutoring: "N",
          is_web_subcription: "N",
          cover_image: null,
          payment_methode: null,
        });
      } else {
        alert(data?.message || "Failed to add package.");
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
      <h1 className="mb-4">Add New Tutoring Package</h1>

      <form onSubmit={handleSubmit} className="row g-3">
        {/* Package Name */}
        <div className="col-md-6">
          <label className="form-label">Package Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter package name"
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
            placeholder="Enter course ID"
          />
        </div>

        {/* Price */}
        <div className="col-md-6">
          <label className="form-label">Price (USD)</label>
          <input
            type="number"
            step="0.01"
            className="form-control"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            placeholder="Enter price"
          />
        </div>

        {/* Total Sessions */}
        <div className="col-md-6">
          <label className="form-label">Total Sessions</label>
          <input
            type="number"
            className="form-control"
            name="sessions"
            value={form.sessions}
            onChange={handleChange}
            required
            placeholder="Enter total sessions"
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
            placeholder="Enter free sessions"
          />
        </div>

        {/* Cover Image */}
        <div className="col-md-6">
          <label className="form-label">Cover Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "cover_image")}
            required
          />
        </div>

        {/* Payment Method Image */}
        <div className="col-md-6">
          <label className="form-label">Payment Method Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "payment_methode")}
            required
          />
        </div>

        {/* CKEditor for Description */}
        <div className="col-12">
          <label className="form-label">Description</label>
          <CKEditor
            data={form.description}
            onChange={(event: unknown, editor: any) =>
              setForm((prev) => ({ ...prev, description: editor.getData() }))
            }
          />
        </div>

        {/* Package Type Toggles */}
        <div className="col-12 d-flex gap-4 mt-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_one_to_one"
              checked={form.is_one_to_one === "Y"}
              onChange={handleCheckboxChange}
              id="oneToOne"
            />
            <label className="form-check-label" htmlFor="oneToOne">
              One-to-One
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_group_tutoring"
              checked={form.is_group_tutoring === "Y"}
              onChange={handleCheckboxChange}
              id="groupTutoring"
            />
            <label className="form-check-label" htmlFor="groupTutoring">
              Group Tutoring
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_web_subcription"
              checked={form.is_web_subcription === "Y"}
              onChange={handleCheckboxChange}
              id="webSubscription"
            />
            <label className="form-check-label" htmlFor="webSubscription">
              Web Subscription
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary-custom w-50 d-block mx-auto mt-4"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Add Package"}
          </button>
        </div>
      </form>
    </div>
  );
}
