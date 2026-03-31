"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BsEye, BsEyeSlash } from "react-icons/bs";

type StatusType = "success" | "error" | "info";
type Status = { type: StatusType; text: string } | null;

type Course = { course_id: string; name: string };
type ServicesMap = Record<string, number>;

type SessionPkg = {
  session_id: string;
  name: string;
  price: string;
  is_most_popular?: "0" | "1" | string;
};

const API_URL = process.env.NEXT_PUBLIC_PHP_API_URL!;

async function postForm(body: Record<string, string>) {
  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => fd.append(k, v));

  const res = await fetch(API_URL, {
    method: "POST",
    body: fd,
    cache: "no-store",
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid server response (not JSON).");
  }
}

function moneyUsd(price: string) {
  const n = Number(price);
  return Number.isFinite(n) ? n.toFixed(2) : price;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [servicesMap, setServicesMap] = useState<ServicesMap>({});
  const [sessions, setSessions] = useState<SessionPkg[]>([]);

  const [courseId, setCourseId] = useState("");
  const [serviceType, setServiceType] = useState(""); // "0" | "1" | "2"
  const [sessionId, setSessionId] = useState("");

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const servicesOptions = useMemo(() => {
    return Object.entries(servicesMap)
      .map(([label, value]) => ({ label, value: String(value) }))
      .sort((a, b) => Number(a.value) - Number(b.value));
  }, [servicesMap]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.session_id === sessionId) || null,
    [sessions, sessionId],
  );

  // Load courses + services
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingCourses(true);
        const json = await postForm({ action: "get-course-list" });

        if (!alive) return;

        if (json?.status === 200 && json?.isSuccess) {
          if (Array.isArray(json?.data)) setCourses(json.data);
          if (json?.services && typeof json.services === "object")
            setServicesMap(json.services);
        } else {
          setStatus({
            type: "error",
            text: json?.message || "Failed to load course list.",
          });
        }
      } catch (e: any) {
        if (!alive) return;
        setStatus({
          type: "error",
          text: e?.message || "Failed to load course list.",
        });
      } finally {
        if (!alive) return;
        setLoadingCourses(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Reset when course changes
  useEffect(() => {
    setServiceType("");
    setSessions([]);
    setSessionId("");
  }, [courseId]);

  // Reset when service changes
  useEffect(() => {
    setSessions([]);
    setSessionId("");
  }, [serviceType]);

  // Fetch packages when course + service selected
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!courseId || serviceType === "") return;

      try {
        setLoadingSessions(true);

        const json = await postForm({
          action: "get-package-session-list",
          course_id: courseId,
          service_type: serviceType,
        });

        if (!alive) return;

        if (
          json?.status === 200 &&
          json?.isSuccess &&
          Array.isArray(json?.data)
        ) {
          const list: SessionPkg[] = json.data;
          setSessions(list);

          // Auto-select "Most Popular" if present, else keep existing, else first
          const mostPopular = list.find(
            (p) => String(p.is_most_popular) === "1",
          );
          const keepExisting = list.some((p) => p.session_id === sessionId);

          if (mostPopular) setSessionId(mostPopular.session_id);
          else if (keepExisting) setSessionId(sessionId);
          else if (list[0]) setSessionId(list[0].session_id);
          else setSessionId("");
        } else {
          setStatus({
            type: "error",
            text: json?.message || "Failed to load package list.",
          });
        }
      } catch (e: any) {
        if (!alive) return;
        setStatus({
          type: "error",
          text: e?.message || "Failed to load package list.",
        });
      } finally {
        if (!alive) return;
        setLoadingSessions(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, serviceType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (status?.type === "error") setStatus(null);
  };

  const canSubmit = useMemo(() => {
    return (
      !!form.first_name.trim() &&
      !!form.last_name.trim() &&
      !!form.email.trim() &&
      !!form.mobile.trim() &&
      !!form.password.trim() &&
      !!courseId &&
      serviceType !== "" &&
      !!sessionId &&
      agree &&
      !submitting
    );
  }, [form, courseId, serviceType, sessionId, agree, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!courseId)
      return setStatus({ type: "error", text: "Please select a course." });
    if (serviceType === "")
      return setStatus({ type: "error", text: "Please select a service." });
    if (!sessionId)
      return setStatus({ type: "error", text: "Please select a package." });
    if (!agree)
      return setStatus({
        type: "error",
        text: "Please agree to the terms & conditions.",
      });

    try {
      setSubmitting(true);

      // Registration API call
      const json = await postForm({
        action: "user-registration",
        course_id: courseId,
        session_id: sessionId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        mobile: form.mobile.trim(),
        amount: selectedSession?.price ? String(selectedSession.price) : "",
        payment_source_type: "mobile",
        currency: "usd",
        // If backend requires it:
        // service_type: serviceType,
      });

      if (json?.status === 200 && json?.isSuccess) {
        router.push("/thank-you?method=mobile");
        return;
      }

      setStatus({
        type: "error",
        text: json?.message || "Registration failed.",
      });
    } catch (e: any) {
      setStatus({ type: "error", text: e?.message || "Registration failed." });
    } finally {
      setSubmitting(false);
    }
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
          <div className="col-12 col-md-10 col-lg-7 col-xl-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: 16, overflow: "hidden" }}
            >
              <div
                className="p-4"
                style={{ background: "#002341", color: "white" }}
              >
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
                  {/* 2 dropdowns */}
                  <div className="row g-2 mb-3">
                    {/* Course */}
                    <div className="col-12">
                      <select
                        className="form-select"
                        value={courseId}
                        onChange={(e) => {
                          setCourseId(e.target.value);
                          setStatus(null);
                        }}
                        disabled={loadingCourses}
                        style={{
                          borderRadius: 10,
                          borderColor: "rgba(0,35,65,0.20)",
                          padding: "12px 12px",
                        }}
                      >
                        <option value="">
                          {loadingCourses
                            ? "Loading courses..."
                            : "Select a course"}
                        </option>
                        {courses.map((c) => (
                          <option key={c.course_id} value={c.course_id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Service */}
                    <div className="col-12">
                      <select
                        className="form-select"
                        value={serviceType}
                        onChange={(e) => {
                          setServiceType(e.target.value);
                          setStatus(null);
                        }}
                        disabled={!courseId || servicesOptions.length === 0}
                        style={{
                          borderRadius: 10,
                          borderColor: "rgba(0,35,65,0.20)",
                          padding: "12px 12px",
                        }}
                      >
                        {/* ✅ Always show "Select Service" as initial label */}
                        <option value="">
                          {!courseId ? "Select service" : "Select service"}
                        </option>
                        {servicesOptions.map((s) =>
                          s.value !== "2" ? (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ) : null,
                        )}
                      </select>
                    </div>

                    {/* Package */}
                    <div className="col-12">
                      <select
                        className="form-select"
                        // value={sessionId}
                        onChange={(e) => {
                          setSessionId(e.target.value);
                          setStatus(null);
                        }}
                        disabled={
                          !courseId || serviceType === "" || loadingSessions
                        }
                        style={{
                          borderRadius: 10,
                          borderColor: "rgba(0,35,65,0.20)",
                          padding: "12px 12px",
                        }}
                      >
                        {/* ✅ Always show "Select package" as initial label */}
                        <option value="">
                          {loadingSessions
                            ? "Loading packages..."
                            : "Select your purchased package"}
                        </option>

                        {sessions.map((s) => {
                          const popular = String(s.is_most_popular) === "1";
                          return (
                            <option key={s.session_id} value={s.session_id}>
                              {s.name} — ${moneyUsd(s.price)}
                              {popular ? " (Most Popular)" : ""}
                            </option>
                          );
                        })}
                      </select>

                      {selectedSession && (
                        <div className="mt-2 d-flex align-items-center gap-2">
                          {/* <span className="small text-muted">Selected price:</span>
                          <span className="small fw-semibold" style={{ color: "#002341" }}>
                            ${moneyUsd(selectedSession.price)} USD
                          </span> */}
                          {/* {String(selectedSession.is_most_popular) === "1" && (
                            <span
                              className="badge"
                              style={{
                                background: "#002341",
                                color: "white",
                                borderRadius: 999,
                                padding: "6px 10px",
                              }}
                            >
                              Most Popular
                            </span>
                          )} */}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Names */}
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

                  {/* Password */}
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
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
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
                      {showPassword ? (
                        <BsEyeSlash size={18} />
                      ) : (
                        <BsEye size={18} />
                      )}
                    </button>
                  </div>

                  {/* ✅ Terms checkbox stays in your desired position (before Register), but more visible */}
                  <div className="mt-3 mb-3">
                    <div
                      className="d-flex align-items-start gap-3 p-3"
                      style={{
                        borderRadius: 14,
                        border: "1px solid rgba(0,35,65,0.55)",
                        background: agree
                          ? "rgba(242,161,85,0.10)"
                          : "rgba(255,255,255,0.95)",
                        boxShadow: agree
                          ? "0 10px 28px rgba(0,35,65,0.18)"
                          : "0 8px 22px rgba(0,0,0,0.10)",
                        transition: "all 180ms ease",
                      }}
                    >
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="agree"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        style={{
                          width: 18,
                          height: 18,
                          marginTop: 2,
                          cursor: "pointer",
                        }}
                      />

                      <label
                        htmlFor="agree"
                        className="form-check-label"
                        style={{
                          color: "#002341",
                          fontWeight: 800,
                          lineHeight: 1.35,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        I confirm that I have read and agree to the{" "}
                        <a
                          href="/terms-of-service"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#0d6efd",
                            textDecoration: "underline",
                            fontWeight: 900,
                          }}
                        >
                          Terms &amp; Conditions
                        </a>
                        .
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            opacity: 0.85,
                            marginTop: 4,
                          }}
                        >
                          Required to enable Register
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="btn w-100 fw-bold"
                    disabled={!canSubmit}
                    style={{
                      background: "#f2a155",
                      color: "#002341",
                      borderRadius: 12,
                      padding: "12px 14px",
                      opacity: !canSubmit ? 0.6 : 1,
                      cursor: !canSubmit ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Creating account..." : "Register"}
                  </button>

                  {/* Login link */}
                  <div className="text-center mt-3">
                    <span className="text-muted">
                      Already have an account?{" "}
                    </span>
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
