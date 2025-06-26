"use client";

import { useState } from "react";

export default function InsertTutorPage() {
    const [form, setForm] = useState({
        user_id: "",
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

        const formData = new FormData();
        formData.append("action", "insert-tutor");
        formData.append("user_id", form.user_id);
        formData.append("photo", form.photo);
        formData.append("about", form.about);
        formData.append("education", form.education || "");
        formData.append("specialization", form.specialization || "");
        formData.append("language", form.language || "");

        try {
            const res = await fetch("/api/proxy", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data?.isSuccess) {
                alert("Tutor inserted successfully!");
                setForm({
                    user_id: "",
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
                <div className="col-md-6">
                    <label className="form-label">User ID</label>
                    <input
                        type="text"
                        className="form-control"
                        name="user_id"
                        value={form.user_id}
                        onChange={handleChange}
                        required
                        placeholder="Enter User ID"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">Photo Path</label>
                    <input
                        type="text"
                        className="form-control"
                        name="photo"
                        value={form.photo}
                        onChange={handleChange}
                        required
                        placeholder="e.g., uploads/tutor/your_image.png"
                    />
                </div>

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

                <div className="col-12">
                    <button
                        type="submit"
                        className="btn btn-primary-custom w-50 d-block mx-auto mt-4"
                        disabled={submitting}
                    >
                        {submitting ? "Submitting..." : "Insert Tutor"}
                    </button>
                </div>
            </form>
        </div>
    );
}
