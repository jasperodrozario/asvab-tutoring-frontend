// app/checkout/[[...offer]]/OfferCheckout.tsx
"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SquarePaymentForm, {
  SquarePaymentFormHandle,
} from "@/components/square-payment-form/SquarePaymentForm";
import Image from "next/image";
import NextStepCard from "@/components/next-step-card/NextStepCard";
import {
  BsLightningFill,
  BsCalendar3,
  BsFillPeopleFill,
  BsBookFill,
  BsCheckCircleFill,
  BsEye,
  BsEyeSlash,
} from "react-icons/bs";
import { CardState } from "@/components/square-payment-form/SquarePaymentForm";

type PaymentMode = "one_time" | "subscription";
type PaymentMethod = "mobile" | "card";

type EmailCheckResult = {
  exists: boolean | null;
  message: string;
};

function isMode(x: any): x is PaymentMode {
  return x === "one_time" || x === "subscription";
}

function todayYYYYMMDD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function OfferCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const API_URL = process.env.NEXT_PUBLIC_PHP_API_URL!;
  const EMAIL_CHECK_ACTION = "check-email";

  function inferProductFromCourseId(courseId: string) {
    const s = (courseId || "").toLowerCase();
    if (s.includes("asvab")) return "ASVAB";
    if (s.includes("afoqt")) return "AFOQT";
    if (s.includes("astb")) return "ASTB";
    if (s.includes("sift")) return "SIFT";
    if (s.includes("oar")) return "OAR";
    return "ASVAB"; // Default for deals
  }

  // Dynamic values from URL parameters with fallbacks
  const course_id = searchParams.get("course_id") || "";
  const session_id = searchParams.get("session_id") || "";
  const package_id = searchParams.get("package_id") || "";
  const offerTitle = searchParams.get("title") || "Special Offer";

  const amountCents = useMemo(() => {
    const raw = searchParams.get("amount") ?? "25000"; // Default $250 for the deal
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 25000;
  }, [searchParams]);

  const amountDollarsForUI = amountCents / 100;
  const service = inferProductFromCourseId(course_id);

  const mode: PaymentMode = useMemo(() => {
    const q = searchParams.get("mode");
    if (isMode(q)) return q;
    return "one_time";
  }, [searchParams]);

  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    password: "",
    confirm_password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    mobile: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailCheckMsg, setEmailCheckMsg] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [lastCheckedEmail, setLastCheckedEmail] = useState<string>("");
  const emailCheckNonceRef = useRef<number>(0);

  const [cardState, setCardState] = useState<CardState>({
    initializing: true,
    paying: false,
    completed: false,
    message: null,
    paymentId: "",
    isCardValid: false,
  });

  const handleCardStateChange = (state: CardState) => {
    setCardState(state);
  };

  const validateMobile = (mobile: string) => {
    const digits = mobile.replace(/\D/g, "");
    if (digits.length === 0) return "Mobile number is required.";
    if (digits.length !== 10) return "Enter a valid 10-digit US number.";
    if (/^(\d)\1{9}$/.test(digits)) return "Enter a valid US number.";
    if (digits[0] === "0" || digits[0] === "1")
      return "Area code cannot start with 0 or 1.";
    if (digits[3] === "0" || digits[3] === "1")
      return "Exchange code cannot start with 0 or 1.";
    return "";
  };

  const validateConfirmPassword = (confirm: string, pass: string) => {
    if (!confirm) return "Please confirm your password.";
    if (confirm !== pass) return "Passwords do not match.";
    return "";
  };

  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  const looksLikeEmail = (email: string) => {
    const e = normalizeEmail(email);
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  };

  const parseEmailExistsFromResponse = (raw: string): EmailCheckResult => {
    try {
      const data = JSON.parse(raw);
      const serverMsg = data?.message || "";

      if (data?.code === "EMAIL_EXISTS") {
        return {
          exists: true,
          message: serverMsg || "This email address is already registered.",
        };
      }

      if (data?.isSuccess === true) {
        return { exists: false, message: "" };
      }

      return {
        exists: null,
        message: serverMsg || "We could not verify this email right now.",
      };
    } catch {
      const t = raw.trim().toLowerCase();
      if (t.includes("exists")) {
        return {
          exists: true,
          message: "This email address is already registered.",
        };
      }
      if (t.includes("success") || t === "0") {
        return { exists: false, message: "" };
      }
      return {
        exists: null,
        message: "We could not verify this email right now.",
      };
    }
  };

  const checkEmailExists = useCallback(
    async (emailRaw: string): Promise<EmailCheckResult> => {
      const email = normalizeEmail(emailRaw);
      if (!looksLikeEmail(email)) return { exists: null, message: "" };

      const body = new URLSearchParams();
      body.append("action", EMAIL_CHECK_ACTION);
      body.append("email", email);
      if (course_id) body.append("course_id", String(course_id));
      if (session_id) body.append("session_id", String(session_id));

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const raw = await res.text();
        return parseEmailExistsFromResponse(raw);
      } catch {
        return {
          exists: null,
          message: "Unable to check email right now. Please try again.",
        };
      }
    },
    [API_URL, course_id, session_id, looksLikeEmail],
  );

  const runEmailCheck = useCallback(
    async (emailRaw: string) => {
      const email = normalizeEmail(emailRaw);

      if (!looksLikeEmail(email)) {
        setEmailChecking(false);
        setEmailExists(false);
        setEmailCheckMsg("Please enter a valid email address.");
        setLastCheckedEmail("");
        return;
      }

      const nonce = Date.now();
      emailCheckNonceRef.current = nonce;

      setEmailChecking(true);
      setEmailCheckMsg("Checking email...");

      try {
        const result = await checkEmailExists(email);

        if (emailCheckNonceRef.current !== nonce) return;

        setLastCheckedEmail(email);

        if (result.exists === true) {
          setEmailExists(true);
          setEmailCheckMsg(
            result.message || "This email address is already registered.",
          );
          return;
        }

        if (result.exists === false) {
          setEmailExists(false);
          setEmailCheckMsg("");
          return;
        }

        setEmailExists(false);
        setEmailCheckMsg(
          result.message ||
            "Unable to verify email right now. Please try again.",
        );
      } catch {
        setEmailExists(false);
        setEmailCheckMsg("Unable to verify email right now. Please try again.");
      } finally {
        setEmailChecking(false);
      }
    },
    [checkEmailExists, looksLikeEmail],
  );

  useEffect(() => {
    const email = normalizeEmail(user.email);
    if (!emailTouched) return;

    if (!email) {
      setEmailCheckMsg("");
      setEmailExists(false);
      return;
    }

    const t = window.setTimeout(() => {
      runEmailCheck(email);
    }, 650);

    return () => window.clearTimeout(t);
  }, [user.email, emailTouched, runEmailCheck]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length > 10) {
        setFieldErrors((prev) => ({
          ...prev,
          mobile: "Only 10 digits are allowed for US numbers.",
        }));
        // Revert to previous validation state after 2 seconds
        setTimeout(() => {
          setFieldErrors((prev) => ({
            ...prev,
            mobile: validateMobile(user.mobile),
          }));
        }, 2000);
        return;
      }
      setUser((prev) => ({ ...prev, [name]: cleaned }));

      // Active validation for mobile
      if (cleaned.length > 0 && cleaned.length < 10) {
        const err = validateMobile(cleaned);
        setFieldErrors((prev) => ({ ...prev, mobile: err }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          mobile: validateMobile(cleaned),
        }));
      }
    } else if (name === "email") {
      setUser((prev) => ({ ...prev, [name]: value }));
      setEmailExists(false);
      setEmailCheckMsg("");
    } else if (name === "confirm_password") {
      setUser((prev) => ({ ...prev, [name]: value }));
      // Active validation for password match
      setFieldErrors((prev) => ({
        ...prev,
        confirm_password: validateConfirmPassword(value, user.password),
      }));
    } else if (name === "password") {
      setUser((prev) => ({ ...prev, [name]: value }));
      // If user is typing in password field, also re-validate confirm_password if it's not empty
      if (user.confirm_password) {
        setFieldErrors((prev) => ({
          ...prev,
          confirm_password: validateConfirmPassword(
            user.confirm_password,
            value,
          ),
        }));
      }
    } else {
      setUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const squareFormRef = useRef<SquarePaymentFormHandle>(null);

  const canSubmit = useMemo(() => {
    return (
      agreeTerms &&
      !!user.first_name.trim() &&
      !!user.last_name.trim() &&
      !!user.email.trim() &&
      !!user.mobile.trim() &&
      !!user.password.trim() &&
      !!user.confirm_password.trim() &&
      user.password === user.confirm_password &&
      !fieldErrors.mobile &&
      !fieldErrors.confirm_password &&
      !emailChecking &&
      !emailExists
    );
  }, [agreeTerms, user, fieldErrors, emailChecking, emailExists]);

  const [mobileSubmitting, setMobileSubmitting] = useState(false);
  const [mobileResult, setMobileResult] = useState<{
    type: string;
    text: string;
  } | null>(null);

  const submitMobilePayment = async () => {
    setMobileResult(null);

    if (!agreeTerms) {
      setMobileResult({
        type: "danger",
        text: "Please agree to the Terms & Conditions to continue.",
      });
      return;
    }

    const mobileErr = validateMobile(user.mobile);
    const confirmErr = validateConfirmPassword(
      user.confirm_password,
      user.password,
    );

    if (mobileErr || confirmErr) {
      setFieldErrors({
        mobile: mobileErr,
        confirm_password: confirmErr,
      });
      setMobileResult({
        type: "danger",
        text: "Please fix all the errors in the form before submitting.",
      });
      return;
    }

    if (!canSubmit) {
      setMobileResult({
        type: "danger",
        text: "Please complete all required registration and mobile payment fields correctly.",
      });
      return;
    }

    if (normalizeEmail(user.email) !== lastCheckedEmail) {
      await runEmailCheck(user.email);
    }

    if (emailChecking) {
      setMobileResult({
        type: "info",
        text: "We are checking your email. Please wait a moment and try again.",
      });
      return;
    }

    if (emailExists) {
      setMobileResult({
        type: "danger",
        text: emailCheckMsg || "This email address is already registered.",
      });
      return;
    }

    setMobileSubmitting(true);

    try {
      const body = new URLSearchParams();
      body.append("action", "user-registration-mobile-payment");
      body.append("course_id", String(course_id));
      body.append("session_id", String(session_id));
      body.append("package_id", String(package_id));
      body.append("first_name", user.first_name);
      body.append("last_name", user.last_name);
      body.append("email", user.email);
      body.append("password", user.password);
      body.append("mobile", user.mobile);
      body.append("amount", String(amountCents));
      body.append("currency", "USD");
      body.append("created_at", todayYYYYMMDD());

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const raw = await res.text();
      let data: any = null;

      try {
        data = JSON.parse(raw);
      } catch {
        setMobileResult({
          type: "danger",
          text: "We received an unexpected response. Please try again.",
        });
        return;
      }

      if (data?.isSuccess) {
        setMobileResult({
          type: "success",
          text: data?.message || "Submitted successfully.",
        });
        const q = package_id
          ? `?method=mobile&package_id=${package_id}`
          : `?method=mobile`;
        router.push(`/thank-you${q}`);
        return;
      }

      setMobileResult({
        type: "danger",
        text: data?.message || "Submission failed. Please try again.",
      });
    } catch {
      setMobileResult({
        type: "danger",
        text: "Network error. Please try again.",
      });
    } finally {
      setMobileSubmitting(false);
    }
  };
  return (
    <div className="container pb-5" style={{ maxWidth: 1100, paddingTop: 33 }}>
      <div className="row flex-column align-items-center mb-4 text-center">
        <div className="col-12 col-lg-8">
          <h1 className="fw-bold mb-2">{offerTitle}</h1>
        </div>
      </div>

      <div className="row g-4">
        {/* Checkout Form Column */}
        <div className="col-12 col-lg-7">
          <div className="d-flex flex-column gap-4">
            {/* CARD 1: Payment Method & Details */}
            <div className="card shadow-sm border-0 w-100">
              <div className="card-body p-0 d-flex flex-column">
                <div className="px-4 border-bottom">
                  <div className="checkout-tabs-container">
                    <h5 className="fw-semibold text-muted mb-0 py-3">
                      Payment Method
                    </h5>

                    <ul className="nav nav-tabs checkout-payment-methods">
                      <li className="nav-item">
                        <button
                          className={`nav-link tab-btn ${paymentMethod === "mobile" ? "active" : ""}`}
                          onClick={() => {
                            setAgreeTerms(false);
                            setPaymentMethod("mobile");
                          }}
                        >
                          Mobile Payment
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link tab-btn ${paymentMethod === "card" ? "active" : ""}`}
                          onClick={() => {
                            setAgreeTerms(false);
                            setPaymentMethod("card");
                          }}
                        >
                          Card Payment
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4">
                  {paymentMethod === "mobile" ? (
                    <div className="text-center">
                      <div className="d-flex justify-content-center">
                        <Image
                          src="/images/mobile_payment_app_20260204.png"
                          alt="Payment Apps"
                          className="img-fluid"
                          width={350}
                          height={220}
                          style={{ maxWidth: 560, height: "auto" }}
                        />
                      </div>
                      <div className="mt-3">
                        <div className="fw-bold" style={{ fontSize: 18 }}>
                          Send payment to:
                        </div>
                        <div
                          className="fw-bold text-success"
                          style={{ fontSize: 20 }}
                        >
                          (718) 200-6396
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div className="fw-semibold text-muted small">
                          Card Payment Details
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                          <span className="badge text-bg-light border">
                            VISA
                          </span>
                          <span className="badge text-bg-light border">
                            AMEX
                          </span>
                          <span className="badge text-bg-light border">MC</span>
                          <span className="badge text-bg-light border">
                            DISC
                          </span>
                        </div>
                      </div>

                      <SquarePaymentForm
                        ref={squareFormRef}
                        amount={amountCents}
                        course_id={course_id}
                        session_id={session_id}
                        package_id={package_id}
                        user={user}
                        mode={mode}
                        onPaymentSuccess={(id) => {
                          const q = id
                            ? `?method=card&id=${encodeURIComponent(id)}&package_id=${package_id}`
                            : `?method=card&package_id=${package_id}`;
                          router.push(`/thank-you${q}`);
                        }}
                        onStateChange={handleCardStateChange}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 2: Registration Information */}
            <div className="card shadow-sm border-0 w-100">
              <div className="card-body p-4 d-flex flex-column">
                <h5 className="fw-bold mb-3 text-muted">
                  Your Registration Information
                </h5>

                <input
                  className="form-control mb-2"
                  name="first_name"
                  placeholder="First Name"
                  value={user.first_name}
                  onChange={handleChange}
                  required
                />

                <input
                  className="form-control mb-2"
                  name="last_name"
                  placeholder="Last Name"
                  value={user.last_name}
                  onChange={handleChange}
                  required
                />

                <div className="mb-2">
                  <input
                    className="form-control"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={user.email}
                    onChange={handleChange}
                    onBlur={() => {
                      setEmailTouched(true);
                      runEmailCheck(user.email);
                    }}
                    onFocus={() => setEmailTouched(true)}
                    required
                  />
                </div>

                {(emailTouched || !!user.email.trim()) && emailCheckMsg && (
                  <div
                    className={`small mb-2 ${
                      emailExists || !looksLikeEmail(user.email)
                        ? "text-danger"
                        : "text-muted"
                    }`}
                    role={
                      emailExists || !looksLikeEmail(user.email)
                        ? "alert"
                        : undefined
                    }
                    style={{ fontWeight: emailExists ? 600 : 400 }}
                  >
                    {emailCheckMsg}
                  </div>
                )}

                <div className="mb-2">
                  <input
                    className={`form-control ${fieldErrors.mobile ? "is-invalid" : ""}`}
                    name="mobile"
                    placeholder="Mobile"
                    value={user.mobile}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.mobile && (
                    <div
                      className="invalid-feedback"
                      style={{ fontSize: 13, fontWeight: 600 }}
                    >
                      {fieldErrors.mobile}
                    </div>
                  )}
                </div>

                <div className="mb-2 position-relative">
                  <input
                    className="form-control pe-5"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={user.password}
                    onChange={handleChange}
                    required
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

                <div className="mb-0 position-relative">
                  <input
                    className={`form-control pe-5 ${fieldErrors.confirm_password ? "is-invalid" : ""}`}
                    type={showPassword ? "text" : "password"}
                    name="confirm_password"
                    placeholder="Confirm password"
                    value={user.confirm_password}
                    onChange={handleChange}
                    required
                  />
                  {fieldErrors.confirm_password && (
                    <div
                      className="invalid-feedback"
                      style={{ fontSize: 13, fontWeight: 600 }}
                    >
                      {fieldErrors.confirm_password}
                    </div>
                  )}
                </div>

                <div className="mt-3 small text-muted">
                  We’ll use your email for purchase confirmation and account
                  access.
                </div>

                <div className="mt-3">
                  <label className="d-flex align-items-center gap-2 small mb-0">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={() => setAgreeTerms((prev) => !prev)}
                      className="form-check-input mb-1"
                    />
                    <span>
                      Agree{" "}
                      <a
                        href="/terms-of-service"
                        className="text-decoration-underline"
                        style={{ color: "#0573e6" }}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Terms & Conditions
                      </a>
                    </span>
                  </label>
                </div>

                {paymentMethod === "mobile" ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn btn-primary-custom mt-4 px-5 py-2 d-block mx-auto"
                      onClick={submitMobilePayment}
                      disabled={mobileSubmitting || !canSubmit}
                    >
                      {mobileSubmitting ? "Submitting..." : "Submit"}
                    </button>

                    {mobileResult && (
                      <div className={`alert alert-${mobileResult.type} mt-3`}>
                        {mobileResult.text}
                      </div>
                    )}
                    <NextStepCard service={service} />
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn btn-primary-custom mt-2 px-5 py-2 d-block mx-auto"
                      onClick={() => squareFormRef.current?.submitPayment()}
                      disabled={
                        cardState.initializing ||
                        cardState.paying ||
                        cardState.completed ||
                        emailChecking ||
                        emailExists ||
                        !looksLikeEmail(user.email) ||
                        !agreeTerms ||
                        !cardState.isCardValid ||
                        !canSubmit
                      }
                    >
                      {cardState.completed
                        ? "Paid"
                        : cardState.paying
                          ? "Processing…"
                          : `Pay $${amountDollarsForUI.toFixed(2)}`}
                    </button>

                    {cardState.completed && cardState.paymentId && (
                      <div className="mt-3 text-center">
                        <div className="small text-muted">
                          <span className="fw-semibold">Payment ID:</span>{" "}
                          {cardState.paymentId}
                        </div>
                      </div>
                    )}

                    {cardState.message && (
                      <p className="mt-3 fw-bold text-center text-danger small">
                        {cardState.message}
                      </p>
                    )}
                    <NextStepCard service={service} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Summary */}
        <div className="col-12 col-lg-5">
          <div
            className="card shadow-sm border-0 mb-4"
            style={{
              background: "linear-gradient(135deg, #fff 0%, #f8faff 100%)",
              borderRadius: "20px",
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span
                  className="badge rounded-pill px-3 py-2 text-dark fw-bold"
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                    fontSize: "0.7rem",
                    letterSpacing: "1px",
                  }}
                >
                  🔥 LIMITED-TIME OFFER
                </span>
                <div className="text-primary fw-bold h4 mb-0">
                  ${amountDollarsForUI}
                </div>
              </div>

              <div className="d-flex flex-column gap-2 mb-0">
                <div className="d-flex align-items-center gap-2 small">
                  <BsCalendar3 className="text-primary" />
                  <span>4-week program — 3 live sessions/week</span>
                </div>
                <div className="d-flex align-items-center gap-2 small">
                  <BsLightningFill className="text-primary" />
                  <span>Every session recorded</span>
                </div>
                <div className="d-flex align-items-center gap-2 small">
                  <BsFillPeopleFill className="text-primary" />
                  <span>Small-group setting</span>
                </div>
                <div className="d-flex align-items-center gap-2 small">
                  <BsBookFill className="text-primary" />
                  <span>Mathematics & English focused</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0 w-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 text-muted">Order Summary</h5>
              <div className="border-top my-3"></div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="h5 fw-bold mb-0 text-muted">Total</span>
                <span className="h4 fw-bold mb-0 text-primary">
                  ${amountDollarsForUI}
                </span>
              </div>

              <div className="mt-5">
                <div className="d-flex gap-3 align-items-start mb-4">
                  <BsCheckCircleFill className="text-success mt-1 flex-shrink-0" />
                  <div>
                    <div className="fw-bold">Secure Checkout</div>
                    <div className="small text-muted">
                      Your data is encrypted and secure.
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-3 align-items-start mb-4">
                  <BsCheckCircleFill className="text-success mt-1 flex-shrink-0" />
                  <div>
                    <div className="fw-bold">Instant Access</div>
                    <div className="small text-muted">
                      Get access to materials immediately after payment.
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-3 align-items-start">
                  <BsCheckCircleFill className="text-success mt-1 flex-shrink-0" />
                  <div>
                    <div className="fw-bold">Expert Support</div>
                    <div className="small text-muted">
                      Dedicated tutors to help you pass.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mt-4 p-4 text-center rounded-4"
            style={{ border: "1px dashed rgba(0,0,0,0.1)" }}
          >
            <p className="small text-muted mb-0">
              Questions? Email us at:{" "}
              <a
                href="mailto: info.asvab-tutoring.com"
                className="fw- text-primary"
              >
                info.asvab-tutoring.com
              </a>
            </p>
          </div>
        </div>
        <style jsx>{`
          .cursor-pointer {
            cursor: pointer;
          }
          .form-control:focus {
            border-color: #0d6efd !important;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
          }
        `}</style>
      </div>
    </div>
  );
}
