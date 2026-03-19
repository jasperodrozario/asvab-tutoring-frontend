"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import IntroText from "../intro-text/IntroText";
import Link from "next/link";

interface State {
  id: string;
  name: string;
}

type StatusType = "success" | "error" | "info";

export default function Welcome() {
  const API_URL = "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php";




  const [states, setStates] = useState<State[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    state_id: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ✅ Inline status message (no alerts)
  const [status, setStatus] = useState<{
    type: StatusType;
    text: string;
  } | null>(null);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // ✅ remove old error as user edits
    if (status?.type === "error") setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ clear previous message
    setStatus(null);
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
        setStatus({
          type: "success",
          text: "Tutor request submitted successfully! We’ll contact you soon.",
        });

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
                11,000+ successful candidates. Online Test Prep for the ASVAB, ASTB,
                OAR, AFOQT, and SIFT
              </p>

              <div className="mt-4 bg-white p-3 rounded shadow">
                <video
                  controls
                  poster="/images/asvab-video-poster.jpg"
                  className="w-100 rounded"
                  style={{ objectFit: "cover" }}
                >
                  <source src="/videos/ASVAB-Promo-video.mp4" type="video/mp4" />
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
                    <label className="form-label">Email (Use your valid email address)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone (US Only)</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
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
                  <Link href="/mobile-app-list">
                    <Image 
                      src="/images/Google_Play_Store_badge_EN.svg"
                      alt="Google Play"
                      width={180}
                      height={40}
                    />
                  </Link>

                  <Link href="/mobile-app-list">
                    <Image
                      src="/images/download-on-the-app-store.svg"
                      alt="App Store"
                      width={180}
                      height={40}
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <IntroText />
    </>
  );
}
