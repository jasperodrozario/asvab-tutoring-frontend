"use client";

import { useState } from "react";

export default function InsertCoursePage() {
    const [form, setForm] = useState({
        course_name: "",
        description: "",
        ord: "",
        group_id: "",
        is_online: "Y",
        subscribe: "0",
        app: "0",
        tutoring: "0",
        overview: "",
        curriculum: "",
        video: "",
        video_title: "",
        cover_image: "",
    });

    const [submitting, setSubmitting] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData();
        formData.append("action", "add-course");
        formData.append("course_name", form.course_name.trim());
        formData.append("description", form.description.trim());
        formData.append("ord", form.ord || "0");
        formData.append("group_id", form.group_id || "0");
        formData.append("is_online", form.is_online || "N");
        formData.append("subscribe", form.subscribe || "0");
        formData.append("app", form.app || "0");
        formData.append("tutoring", form.tutoring || "0");
        formData.append("overview", form.overview || "");
        formData.append("curriculum", form.curriculum || "");
        formData.append("video", form.video || "");
        formData.append("video_title", form.video_title || "");
        formData.append("cover_image", form.cover_image || "");

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
                    description: "",
                    ord: "",
                    group_id: "",
                    is_online: "Y",
                    subscribe: "0",
                    app: "0",
                    tutoring: "0",
                    overview: "",
                    curriculum: "",
                    video: "",
                    video_title: "",
                    cover_image: "",
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

                <div className="col-md-12">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={2}
                        required
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
                        required
                    />
                </div>

                <div className="col-md-3">
                    <label className="form-label">Group ID</label>
                    <input
                        type="number"
                        className="form-control"
                        name="group_id"
                        value={form.group_id}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="col-md-3">
                    <label className="form-label">Is Online</label>
                    <select
                        className="form-select"
                        name="is_online"
                        value={form.is_online}
                        onChange={handleChange}
                    >
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                    </select>
                </div>

                <div className="col-md-3">
                    <label className="form-label">Tutoring</label>
                    <select
                        className="form-select"
                        name="tutoring"
                        value={form.tutoring}
                        onChange={handleChange}
                    >
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                    </select>
                </div>

                <div className="col-md-4">
                    <label className="form-label">Subscribe</label>
                    <select
                        className="form-select"
                        name="subscribe"
                        value={form.subscribe}
                        onChange={handleChange}
                    >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>

                <div className="col-md-4">
                    <label className="form-label">App</label>
                    <select
                        className="form-select"
                        name="app"
                        value={form.app}
                        onChange={handleChange}
                    >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                    </select>
                </div>

                <div className="col-md-4">
                    <label className="form-label">Cover Image Path</label>
                    <input
                        type="text"
                        className="form-control"
                        name="cover_image"
                        value={form.cover_image}
                        onChange={handleChange}
                        placeholder="e.g., images/cover.jpg"
                    />
                </div>

                <div className="col-12">
                    <label className="form-label">Overview</label>
                    <textarea
                        className="form-control"
                        name="overview"
                        value={form.overview}
                        onChange={handleChange}
                        rows={2}
                    />
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
