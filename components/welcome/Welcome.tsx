"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import IntroText from "../intro-text/IntroText";
import Link from "next/link";
import NoticeContent from "@/components/notice-content/NoticeContent";
import TutorRequestSuccessModal from "../tutor-request-success-modal/TutorRequestSuccessModal";

interface State {
  id: string;
  name: string;
}

type StatusType = "success" | "error" | "info";

export default function Welcome() {
  const API_URL = process.env.NEXT_PUBLIC_PHP_API_URL!;

  const [states, setStates] = useState<State[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    state_id: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [status, setStatus] = useState<{
    type: StatusType;
    text: string;
  } | null>(null);

  const [fieldErrors, setFieldErrors] = useState({
    phone: "",
    email: "",
  });

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 0) return "Phone number is required.";
    if (digits.length !== 10) return "Enter a valid 10-digit US number.";
    if (/^(\d)\1{9}$/.test(digits)) return "Enter a valid US number."; // All same digits
    if (digits[0] === "0" || digits[0] === "1")
      return "Area code cannot start with 0 or 1.";
    if (digits[3] === "0" || digits[3] === "1")
      return "Exchange code cannot start with 0 or 1.";
    return "";
  };

  const validateEmail = (email: string) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!email) return "Email is required.";
    if (!re.test(String(email).toLowerCase()))
      return "Please enter a valid email address.";
    return "";
  };

  // ✅ Safe JSON parser: avoids "unexpected character" crash
  const safeJson = async (res: Response) => {
    const raw = await res.text();
    try {
      return { ok: true, data: JSON.parse(raw), raw };
    } catch {
      return { ok: false, data: null, raw };
    }
  };

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            action: "get-state-list",
          }),
        });

        const parsed = await safeJson(res);

        if (!parsed.ok) {
          console.error("get-state-list returned non-JSON:", parsed.raw);
          setStates([]);
          setStatus({
            type: "error",
            text: "Unable to load state list right now. Please refresh and try again.",
          });
          return;
        }

        const data = parsed.data;

        // ✅ Support both: {isSuccess, data:[...]} OR direct array
        if (data?.isSuccess && Array.isArray(data.data)) {
          setStates(data.data);
          setStatus(null);
        } else if (Array.isArray(data)) {
          setStates(data);
          setStatus(null);
        } else {
          console.error("API returned invalid state data:", data);
          setStates([]);
          setStatus({
            type: "error",
            text: "State list data is invalid. Please try again later.",
          });
        }
      } catch (error) {
        console.error("Failed to fetch states:", error);
        setStates([]);
        setStatus({
          type: "error",
          text: "Network error while loading states. Please try again.",
        });
      }
    };

    fetchStates();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length > 10) {
        setFieldErrors((prev) => ({
          ...prev,
          phone: "Only 10 digits are allowed for US numbers.",
        }));
        // Revert to previous validation state after 2 seconds
        setTimeout(() => {
          setFieldErrors((prev) => ({
            ...prev,
            phone: validatePhone(form.phone),
          }));
        }, 2000);
        return;
      }
      setForm((prev) => ({ ...prev, [name]: cleaned }));

      // Active validation for phone
      if (cleaned.length > 0 && cleaned.length < 10) {
        const err = validatePhone(cleaned);
        setFieldErrors((prev) => ({ ...prev, phone: err }));
      } else {
        setFieldErrors((prev) => ({ ...prev, phone: validatePhone(cleaned) }));
      }
    } else if (name === "email") {
      setForm((prev) => ({ ...prev, [name]: value }));
      // Active validation for email
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // ✅ remove old error as user edits
    if (status?.type === "error") setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ clear previous message
    setStatus(null);

    const phoneErr = validatePhone(form.phone);
    const emailErr = validateEmail(form.email);

    if (phoneErr || emailErr) {
      setFieldErrors({ phone: phoneErr, email: emailErr });
      setStatus({
        type: "error",
        text: "Please fix all the errors in the form before submitting.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          action: "tutor-request",
          name: form.name,
          email: form.email,
          phone: form.phone,
          state_id: form.state_id,
          message: form.message,
        }),
      });

      const parsed = await safeJson(res);

      if (!parsed.ok) {
        console.error("tutor-request returned non-JSON:", parsed.raw);
        setStatus({
          type: "error",
          text: "Server returned an invalid response. Please try again.",
        });
        return;
      }

      const data = parsed.data;

      if (data?.isSuccess) {
        setShowSuccessModal(true);
        setForm({ name: "", email: "", phone: "", state_id: "", message: "" });
      } else {
        setStatus({
          type: "error",
          text: data?.message || "Submission failed. Please try again.",
        });
        console.error("tutor-request failed payload:", data);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setStatus({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusClass =
    status?.type === "success"
      ? "alert alert-success"
      : status?.type === "error"
        ? "alert alert-danger"
        : "alert alert-info";

  return (
    <>
      {/* Hero Section */}
      <div className="min-vh-100 d-flex align-items-center bg-hero text-white py-5 px-3">
        <div className="container hero-content">
          <div className="row align-items-center g-5">
            {/* Left Content */}
            <div className="col-lg-6 text-center">
              <h1 className="display-5 fw-bold">
                Welcome To <br />
                <span className="primary-color-custom">ASVAB Tutoring</span>
              </h1>

              <p className="lead mt-3">
                11,000+ successful candidates. Online Test Prep for the ASVAB,
                ASTB, OAR, AFOQT, and SIFT
              </p>

              <div className="mt-4 bg-white rounded shadow pt-2 px-2">
                <video
                  controls
                  poster="/images/asvab-video-poster.jpg"
                  className="w-100 rounded"
                  style={{ objectFit: "cover" }}
                >
                  <source
                    src="/videos/ASVAB-Promo-video.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Right Form */}
            <div className="col-lg-6">
              <div className="bg-custom-dark p-4 rounded shadow text-white">
                <h2 className="text-center mb-4">REQUEST A TUTOR NOW!</h2>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                      placeholder="Enter a valid email address"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                    {fieldErrors.email && (
                      <div className="invalid-feedback">
                        {fieldErrors.email}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone (US Only)</label>
                    <input
                      type="tel"
                      className={`form-control ${fieldErrors.phone ? "is-invalid" : ""}`}
                      placeholder="Enter a valid phone number"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                    {fieldErrors.phone && (
                      <div className="invalid-feedback">
                        {fieldErrors.phone}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">State</label>
                    <select
                      className="form-select"
                      name="state_id"
                      value={form.state_id}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    >
                      <option value="">—Please choose an option—</option>
                      {states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      disabled={submitting}
                      placeholder="Write us a message..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary-custom w-50 d-block mx-auto mt-4"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>

                  {/* ✅ Polished inline status message below button */}
                  {status && (
                    <div className={`${statusClass} mt-3 mb-0`} role="alert">
                      {status.text}
                    </div>
                  )}
                </form>

                <div className="d-flex justify-content-center gap-2 mt-4">
                  <Link href="/our-mobile-apps" className="app-link-btn">
                    <Image
                      src="/images/download-on-the-app-store.svg"
                      alt="App Store"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: "auto", height: "40px" }}
                    />
                  </Link>
                  <Link href="/our-mobile-apps" className="app-link-btn">
                    <Image
                      src="/images/Google_Play_Store_badge_EN.svg"
                      alt="Google Play"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: "auto", height: "40px" }}
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NoticeContent />

      {/* Welcome Section */}
      <IntroText />

      <TutorRequestSuccessModal
        show={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </>
  );
}
