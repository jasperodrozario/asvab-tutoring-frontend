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
        thumb_pic: "",
        ord: "",
        status: "1",
        course_name_test_prep: "",
        video_title: "",
        course_id: "",
    });

    const [submitting, setSubmitting] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDetailsChange = (data: string) => {
        setForm((prev) => ({ ...prev, details: data }));
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
        formData.append("thumb_pic", form.thumb_pic || "");
        formData.append("ord", form.ord || "0");
        formData.append("status", form.status || "1");
        formData.append("course_name_test_prep", form.course_name_test_prep || "");
        formData.append("video_title", form.video_title || "");
        formData.append("course_id", form.course_id || "");

        try {
            const res = await fetch("/api/proxy", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data?.isSuccess) {
                alert("Course added successfully!");
                setForm({
                    course_name: "",
                    header: "",
                    tagline: "",
                    details: "",
                    curriculum: "",
                    video: "",
                    thumb_pic: "",
                    ord: "",
                    status: "1",
                    course_name_test_prep: "",
                    video_title: "",
                    course_id: "",
                });
            } else {
                alert(data.message || "Submission failed");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container py-5">
            <h2 className="mb-4">Add New Course</h2>
            <form onSubmit={handleSubmit} className="row g-3">
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

                {/* ✅ CKEditor for details */}
                <div className="col-12">
                    <label className="form-label">Details</label>
                    <div className="ckeditor-container">
                        <CKEditorField value={form.details} onChange={handleDetailsChange} />
                    </div>
                </div>

                <div className="col-12">
                    <label className="form-label">Curriculum</label>
                    <textarea
                        className="form-control"
                        name="curriculum"
                        value={form.curriculum}
                        onChange={handleChange}
                        rows={2}
                    />
                </div>

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

                <div className="col-md-6">
                    <label className="form-label">Thumbnail Path</label>
                    <input
                        type="text"
                        className="form-control"
                        name="thumb_pic"
                        value={form.thumb_pic}
                        onChange={handleChange}
                        placeholder="e.g., uploads/course/thumb.png"
                    />
                </div>

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

                <div className="col-md-6">
                    <label className="form-label">Course ID</label>
                    <input
                        type="text"
                        className="form-control"
                        name="course_id"
                        value={form.course_id}
                        onChange={handleChange}
                    />
                </div>

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
