"use client";

import { useState } from "react";
import Link from "next/link";
import { BsEye, BsEyeSlash } from "react-icons/bs";

type LoginStatus = { type: "success" | "error"; text: string } | null;

type AuthUser = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type PostLoginChoice = {
  portalUrl: string;
  user: AuthUser;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>(null);
  const [choice, setChoice] = useState<PostLoginChoice | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (response.ok && result?.success) {
        setChoice({
          portalUrl: String(result.portalUrl || ""),
          user: result.user,
        });
        setStatus({
          type: "success",
          text: result?.message || "Login successful.",
        });
      } else {
        setStatus({
          type: "error",
          text:
            result?.message || "Invalid email or password. Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: "Failed to connect to the server." });
    } finally {
      setSubmitting(false);
    }
  };

  const stayOnSite = () => {
    window.location.href = "/";
  };

  const goToPortal = () => {
    const url = choice?.portalUrl?.trim();
    if (url) {
      window.location.href = url;
      return;
    }
    window.location.href =
      process.env.NEXT_PUBLIC_RESOURCES_URL ||
      "https://test-prep.asvab-tutoring.com/";
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
          <div className="col-12 col-md-8 col-lg-5">
            <div
              className="card border-0 shadow-sm"
              style={{
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                className="p-4"
                style={{
                  background: "#002341",
                  color: "white",
                }}
              >
                <h3 className="mb-1 fw-bold">
                  {choice ? "You're logged in" : "Login"}
                </h3>
                <p className="mb-0" style={{ opacity: 0.85 }}>
                  {choice
                    ? "Choose where to continue."
                    : "Access your account and continue your preparation."}
                </p>
              </div>

              <div className="card-body p-4">
                {status && (
                  <div
                    className={`alert ${
                      status.type === "success"
                        ? "alert-success"
                        : "alert-danger"
                    }`}
                    role="alert"
                  >
                    {status.text}
                  </div>
                )}

                {choice ? (
                  <div>
                    <p className="mb-4" style={{ color: "#002341" }}>
                      Welcome
                      {choice.user?.first_name
                        ? `, ${choice.user.first_name}`
                        : ""}
                      . Stay on this site to browse and checkout, or continue to
                      the Study Portal for lessons and practice tests.
                    </p>

                    <button
                      type="button"
                      className="btn w-100 fw-bold mb-3"
                      onClick={stayOnSite}
                      style={{
                        background: "#f2a155",
                        color: "#002341",
                        borderRadius: 12,
                        padding: "12px 14px",
                      }}
                    >
                      Stay on website
                    </button>

                    <button
                      type="button"
                      className="btn w-100 fw-bold"
                      onClick={goToPortal}
                      style={{
                        background: "#002341",
                        color: "white",
                        borderRadius: 12,
                        padding: "12px 14px",
                      }}
                    >
                      Continue to Study Portal
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#002341" }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (status?.type === "error") setStatus(null);
                        }}
                        required
                        style={{
                          borderRadius: 10,
                          borderColor: "rgba(0,35,65,0.20)",
                          padding: "12px 12px",
                        }}
                      />
                    </div>

                    <div className="mb-2 position-relative">
                      <label
                        className="form-label fw-semibold"
                        style={{ color: "#002341" }}
                      >
                        Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control pe-5"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (status?.type === "error") setStatus(null);
                        }}
                        required
                        style={{
                          borderRadius: 10,
                          borderColor: "rgba(0,35,65,0.20)",
                          padding: "12px 12px",
                        }}
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((s) => !s)}
                        className="btn btn-link p-0"
                        style={{
                          position: "absolute",
                          right: 12,
                          top: 42,
                          color: "#002341",
                          textDecoration: "none",
                        }}
                      >
                        {showPassword ? (
                          <BsEyeSlash size={18} />
                        ) : (
                          <BsEye size={18} />
                        )}
                      </button>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="rememberMe"
                        />
                        <label
                          className="form-check-label small"
                          htmlFor="rememberMe"
                        >
                          Remember me
                        </label>
                      </div>

                      <Link
                        href="/forgot-password"
                        className="small text-decoration-none"
                      >
                        Forgot password?
                      </Link>
                    </div>

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
                      {submitting ? "Logging in..." : "Login"}
                    </button>

                    <div className="text-center mt-3">
                      <span className="text-muted">Not registered yet? </span>
                      <Link
                        href="/user-registration"
                        className="fw-semibold text-decoration-none"
                        style={{ color: "#f2a155" }}
                      >
                        Register
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="text-center mt-3 small text-muted">
              By logging in, you agree to our terms and privacy policy.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
