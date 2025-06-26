"use client";

import { useState } from "react";

export default function TutoringPackagePage() {
    const [form, setForm] = useState({
        name: "",
        description: "",
        course_id: "",
        price: "",
        sessions: "",
        free_sessions: "",
        cover_image: "",
        payment_methode: "",
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
        formData.append("action", "add-tutoring-package");
        formData.append("name", form.name);
        formData.append("description", form.description);
        formData.append("course_id", form.course_id);
        formData.append("price", form.price);
        formData.append("sessions", form.sessions);
        formData.append("free_sessions", form.free_sessions);
        formData.append("cover_image", form.cover_image);
        formData.append("payment_methode", form.payment_methode);

        try {
            const res = await fetch("/api/proxy", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data?.isSuccess) {
                alert("Tutoring package added successfully!");
                setForm({
                    name: "",
                    description: "",
                    course_id: "",
                    price: "",
                    sessions: "",
                    free_sessions: "",
                    cover_image: "",
                    payment_methode: "",
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

                <div className="col-md-6">
                    <label className="form-label">Cover Image Path</label>
                    <input
                        type="text"
                        className="form-control"
                        name="cover_image"
                        value={form.cover_image}
                        onChange={handleChange}
                        required
                        placeholder="e.g., images/cover.jpg"
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label">Payment Method Image</label>
                    <input
                        type="text"
                        className="form-control"
                        name="payment_methode"
                        value={form.payment_methode}
                        onChange={handleChange}
                        required
                        placeholder="e.g., paypal.png"
                    />
                </div>

                <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                        required
                        placeholder="Enter package description"
                    />
                </div>

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
