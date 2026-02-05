"use client";

import { useState } from "react";
import Link from "next/link";
import { BsEye, BsEyeSlash } from "react-icons/bs";

type StatusType = "success" | "error" | "info";
type Status = { type: StatusType; text: string } | null;

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (status?.type === "error") setStatus(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setStatus(null);

    const missing =
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim() ||
      !form.mobile.trim() ||
      !form.password.trim();

    if (missing) {
      setStatus({ type: "error", text: "Please fill in all fields." });
      setSubmitting(false);
      return;
    }

    // UI only for now (API hookup later)
    setTimeout(() => {
      setSubmitting(false);
      setStatus({
        type: "success",
        text: "Registration form is ready. API connection will be added next.",
      });
    }, 600);
  };

  return (
    <section
      className="py-5"
      style={{
        background:
          "linear-gradient(135deg, rgba(242,161,85,0.12) 0%, rgba(0,35,65,0.08) 100%)",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-6 col-xl-5">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: 16, overflow: "hidden" }}
            >
              {/* Header strip */}
              <div className="p-4" style={{ background: "#002341", color: "white" }}>
                <h3 className="mb-1 fw-bold">Create Account</h3>
                <p className="mb-0" style={{ opacity: 0.85 }}>
                  Register to access your courses and study materials.
                </p>
              </div>

              <div className="card-body p-4">
                {status && (
                  <div
                    className={`alert ${
                      status.type === "success"
                        ? "alert-success"
                        : status.type === "error"
                        ? "alert-danger"
                        : "alert-info"
                    }`}
                    role="alert"
                  >
                    {status.text}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* First + Last (same row, compact) */}
                  <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        placeholder="First name"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                        style={{
                          borderRadius: 10,
                          borderColor: "rgba(0,35,65,0.20)",
                          padding: "12px 12px",
                        }}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        placeholder="Last name"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                        style={{
                          borderRadius: 10,
                          borderColor: "rgba(0,35,65,0.20)",
                          padding: "12px 12px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={handleChange}
                      required
                      style={{
                        borderRadius: 10,
                        borderColor: "rgba(0,35,65,0.20)",
                        padding: "12px 12px",
                      }}
                    />
                  </div>

                  {/* Mobile */}
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      name="mobile"
                      placeholder="Mobile number"
                      value={form.mobile}
                      onChange={handleChange}
                      required
                      style={{
                        borderRadius: 10,
                        borderColor: "rgba(0,35,65,0.20)",
                        padding: "12px 12px",
                      }}
                    />
                  </div>

                  {/* Password with toggle (compact) */}
                  <div className="mb-2 position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control pe-5"
                      name="password"
                      placeholder="Create password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      style={{
                        borderRadius: 10,
                        borderColor: "rgba(0,35,65,0.20)",
                        padding: "12px 12px",
                      }}
                    />

                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      className="btn btn-link p-0"
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#002341",
                        textDecoration: "none",
                      }}
                    >
                      {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                    </button>
                  </div>

                  <div className="small text-muted mb-3">
                    Use a strong password you can remember.
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="btn w-100 fw-bold"
                    disabled={submitting}
                    style={{
                      background: "#f2a155",
                      color: "#002341",
                      borderRadius: 12,
                      padding: "12px 14px",
                    }}
                  >
                    {submitting ? "Creating account..." : "Register"}
                  </button>

                  {/* Login link */}
                  <div className="text-center mt-3">
                    <span className="text-muted">Already have an account? </span>
                    <Link
                      href="/user-login"
                      className="fw-semibold text-decoration-none"
                      style={{ color: "#f2a155" }}
                    >
                      Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            <div className="text-center mt-3 small text-muted">
              By registering, you agree to our terms and privacy policy.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
