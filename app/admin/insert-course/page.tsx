"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// ✅ Dynamically import your CKEditorField (client-side only)
const CKEditorField = dynamic(
  () => import("@/components/ckeditor/CKEditorField"),
  { ssr: false }
);

export default function InsertCoursePage() {
  const [form, setForm] = useState({
    course_name: "",
    header: "",
    tagline: "",
    details: "",
    curriculum: "",
    video: "",
    ord: "",
    status: "1",
    course_name_test_prep: "",
    video_title: "",
  });

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailsChange = (data: string) => {
    setForm((prev) => ({ ...prev, details: data }));
  };

  const handleCurriculumChange = (data: string) => {
    setForm((prev) => ({ ...prev, curriculum: data }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("action", "add-course");
    formData.append("course_name", form.course_name.trim());
    formData.append("header", form.header.trim());
    formData.append("tagline", form.tagline.trim());
    formData.append("details", form.details || "");
    formData.append("curriculum", form.curriculum || "");
    formData.append("video", form.video || "");
    formData.append("ord", form.ord || "0");
    formData.append("status", form.status || "1");
    formData.append("course_name_test_prep", form.course_name_test_prep || "");
    formData.append("video_title", form.video_title || "");

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      const res = await fetch(
        "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const text = await res.text(); // 👈 get raw response
      console.log("Raw API Response:", text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response from API");
      }

      console.log("Parsed API Response:", data);

      // ✅ adjust according to backend response structure
      if (data?.isSuccess || data?.success === true || data?.status === "1") {
        alert("Course added successfully!");

        setForm({
          course_name: "",
          header: "",
          tagline: "",
          details: "",
          curriculum: "",
          video: "",
          ord: "",
          status: "1",
          course_name_test_prep: "",
          video_title: "",
        });
        setThumbnail(null);
        setResetCounter((prev) => prev + 1);
      } else {
        alert(data.message || "Submission failed");
      }
    } catch (error) {
      console.error("API error:", error);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Add New Course</h2>
      <form onSubmit={handleSubmit} className="row g-3">
        {/* Course Name */}
        <div className="col-md-6">
          <label className="form-label">Course Name</label>
          <input
            type="text"
            className="form-control"
            name="course_name"
            value={form.course_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Header */}
        <div className="col-md-6">
          <label className="form-label">Header</label>
          <input
            type="text"
            className="form-control"
            name="header"
            value={form.header}
            onChange={handleChange}
          />
        </div>

        {/* Tagline */}
        <div className="col-md-12">
          <label className="form-label">Tagline</label>
          <input
            type="text"
            className="form-control"
            name="tagline"
            value={form.tagline}
            onChange={handleChange}
          />
        </div>

        {/* Details (CKEditor) */}
        <div className="col-12">
          <label className="form-label">Details</label>
          <div className="ckeditor-container">
            <CKEditorField
              key={resetCounter + "-details"}
              value={form.details}
              onChange={handleDetailsChange}
            />
          </div>
        </div>

        {/* Curriculum (CKEditor) */}
        <div className="col-12">
          <label className="form-label">Curriculum</label>
          <div className="ckeditor-container">
            <CKEditorField
              key={resetCounter + "-curriculum"}
              value={form.curriculum}
              onChange={handleCurriculumChange}
            />
          </div>
        </div>

        {/* Video URL */}
        <div className="col-md-6">
          <label className="form-label">Video URL</label>
          <input
            type="text"
            className="form-control"
            name="video"
            value={form.video}
            onChange={handleChange}
          />
        </div>

        {/* Video Title */}
        <div className="col-md-6">
          <label className="form-label">Video Title</label>
          <input
            type="text"
            className="form-control"
            name="video_title"
            value={form.video_title}
            onChange={handleChange}
          />
        </div>

        {/* Thumbnail */}
        <div className="col-md-6">
          <label className="form-label">Thumbnail</label>
          <input
            type="file"
            className="form-control"
            name="thumbnail"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>

        {/* Order */}
        <div className="col-md-3">
          <label className="form-label">Order</label>
          <input
            type="number"
            className="form-control"
            name="ord"
            value={form.ord}
            onChange={handleChange}
          />
        </div>

        {/* Status */}
        <div className="col-md-3">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        {/* Course Name Test Prep */}
        <div className="col-md-6">
          <label className="form-label">Course Name Test Prep</label>
          <input
            type="text"
            className="form-control"
            name="course_name_test_prep"
            value={form.course_name_test_prep}
            onChange={handleChange}
          />
        </div>

        {/* Submit */}
        <div className="col-12">
          <button
            type="submit"
            className="btn btn-primary-custom w-50 mx-auto d-block mt-3"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Add Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
