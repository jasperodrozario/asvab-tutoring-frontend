//app/checkout/CheckoutContent.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SquarePaymentForm, {
  SquarePaymentFormHandle,
  CardState,
} from "@/components/square-payment-form/SquarePaymentForm";
import Image from "next/image";
import NextStepCard from "@/components/next-step-card/NextStepCard";

type PaymentMode = "one_time" | "subscription";
type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

type PaymentMethod = "mobile" | "card";

type EmailCheckResult = {
  exists: boolean | null;
  message: string;
};

function isProduct(x: any): x is Product {
  return (
    x === "ASVAB" ||
    x === "AFOQT" ||
    x === "ASTB" ||
    x === "SIFT" ||
    x === "OAR"
  );
}

function isCadence(x: any): x is Cadence {
  return x === "1M" || x === "3M" || x === "6M" || x === "12M";
}

function isMode(x: any): x is PaymentMode {
  return x === "one_time" || x === "subscription";
}

function inferProductFromCourseId(courseId: string): Product | "" {
  const s = (courseId || "").toLowerCase();
  if (s.includes("asvab")) return "ASVAB";
  if (s.includes("afoqt")) return "AFOQT";
  if (s.includes("astb")) return "ASTB";
  if (s.includes("sift")) return "SIFT";
  if (s.includes("oar")) return "OAR";
  return "";
}

function cadenceLabel(c: Cadence) {
  switch (c) {
    case "1M":
      return "Monthly";
    case "3M":
      return "Quarterly";
    case "6M":
      return "Every 6 months";
    case "12M":
      return "Yearly";
    default:
      return c;
  }
}

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const API_URL = process.env.NEXT_PUBLIC_PHP_API_URL!;
  const EMAIL_CHECK_ACTION = "check-email";

  const course_id = searchParams.get("course_id") || "";
  const session_id = searchParams.get("session_id") || "";
  const package_id = searchParams.get("package_id") || "";

  const amountCents = useMemo(() => {
    const raw = searchParams.get("amount") ?? "0";
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : NaN;
  }, [searchParams]);

  const amountDollarsForUI = useMemo(() => {
    if (!Number.isFinite(amountCents)) return 0;
    return amountCents / 100;
  }, [amountCents]);

  const mode: PaymentMode = useMemo(() => {
    const q = searchParams.get("mode");
    if (isMode(q)) return q;
    return "one_time";
  }, [searchParams]);

  const product: Product = useMemo(() => {
    const q = searchParams.get("product");
    if (isProduct(q)) return q;
    const inferred = inferProductFromCourseId(course_id);
    return inferred || "ASVAB";
  }, [searchParams, course_id]);

  const cadence: Cadence = useMemo(() => {
    const q = searchParams.get("cadence");
    if (isCadence(q)) return q;
    return "1M";
  }, [searchParams]);

  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailCheckMsg, setEmailCheckMsg] = useState<string>("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [lastCheckedEmail, setLastCheckedEmail] = useState<string>("");
  const emailCheckNonceRef = useRef<number>(0);

  const oneOnOneArray: string[] = ["12", "14", "16", "18", "23", "28", "30"];
  const groupArray: string[] = ["15", "19", "29", "31"];
  const service = oneOnOneArray.includes(package_id)
    ? "1-on-1 Tutoring"
    : groupArray.includes(package_id)
      ? "Group Tutoring"
      : "";

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

  const checkEmailExists = async (
    emailRaw: string,
  ): Promise<EmailCheckResult> => {
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
  };

  const runEmailCheck = async (emailRaw: string) => {
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
        result.message || "Unable to verify email right now. Please try again.",
      );
    } catch {
      setEmailExists(false);
      setEmailCheckMsg("Unable to verify email right now. Please try again.");
    } finally {
      setEmailChecking(false);
    }
  };

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
  }, [user.email, emailTouched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      setEmailExists(false);
      setEmailCheckMsg("");
    }
  };

  const invalidBase =
    !course_id ||
    !session_id ||
    !package_id ||
    !Number.isFinite(amountCents) ||
    amountCents <= 0;

  const subscriptionInvalid =
    mode === "subscription" && (!isProduct(product) || !isCadence(cadence));

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    mode === "subscription" ? "card" : "mobile",
  );

  const squareFormRef = useRef<SquarePaymentFormHandle>(null);
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

  useEffect(() => {
    if (mode === "subscription") {
      setPaymentMethod("card");
    }
  }, [mode]);

  const [mobilePay, setMobilePay] = useState({
    mobile: "",
    ref_code: "",
  });

  const [mobileSubmitting, setMobileSubmitting] = useState(false);
  const [mobileResult, setMobileResult] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  const handleMobilePayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMobilePay((prev) => ({ ...prev, [name]: value }));
  };

  const [agreeTerms, setAgreeTerms] = useState(false);

  const canSubmit =
    agreeTerms &&
    looksLikeEmail(user.email) &&
    // !!mobilePay.mobile.trim() &&
    // !!mobilePay.ref_code.trim() &&
    !!user.first_name.trim() &&
    !!user.last_name.trim() &&
    !!user.password.trim() &&
    !!user.mobile.trim() &&
    !emailChecking &&
    !emailExists &&
    !invalidBase;

  const submitMobilePayment = async () => {
    setMobileResult(null);

    if (!agreeTerms) {
      setMobileResult({
        type: "danger",
        text: "Please agree to the Terms & Conditions to continue.",
      });
      return;
    }

    if (!looksLikeEmail(user.email)) {
      setMobileResult({
        type: "danger",
        text: "Please enter a valid email address.",
      });
      return;
    }

    if (!canSubmit) {
      setMobileResult({
        type: "danger",
        text: "Please complete all required registration and mobile payment fields.",
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
      body.append("ref_code", mobilePay.ref_code);
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

  if (invalidBase) {
    return <p className="text-danger">Invalid checkout link.</p>;
  }

  const pageTitle =
    mode === "subscription" ? "Subscription Checkout" : "Checkout";
  const pageSub =
    mode === "subscription"
      ? "Your subscription will renew automatically after 30 days."
      : "One-time payment for your selected package.";

  const TermsCheckbox = () => (
    <div className="mt-3">
      <label className="d-flex align-items-center gap-2 small mb-0">
        <input
          type="checkbox"
          name="agree_terms"
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
            Terms &amp; Conditions
          </a>
        </span>
      </label>
    </div>
  );

  const showPaymentMethodChooser = mode !== "subscription";
  const showMobileUI = showPaymentMethodChooser && paymentMethod === "mobile";
  const showCardUI = mode === "subscription" || paymentMethod === "card";
  const cardBlockedByEmail =
    emailChecking || emailExists || !looksLikeEmail(user.email);

  return (
    <div className="container pb-5" style={{ maxWidth: 1100, paddingTop: 33 }}>
      <div className="row flex-column align-items-center mb-4">
        <div className="col-12 col-lg-6">
          <h1 className="fw-bold mb-2 text-center">{pageTitle}</h1>
          <div className="fw-bold mb-2" style={{ fontSize: 24 }}>
            <span className="text-muted fw-normal" style={{ fontSize: 24 }}>
              Total:
            </span>{" "}
            ${amountDollarsForUI.toFixed(2)}
          </div>
          {mode === "subscription" && (
            <p className="text-muted small mb-1">
              Plan: <span className="fw-semibold">{product}</span> •{" "}
              <span className="fw-semibold">{cadenceLabel(cadence)}</span>
            </p>
          )}
          <p className="text-muted mb-0 small">{pageSub}</p>
        </div>
      </div>

      <div className={"row g-4 flex-column align-items-center"}>
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 w-100">
            <div className="card-body p-0 d-flex flex-column">
              <div className="px-4 border-bottom">
                <div className="checkout-tabs-container">
                  <h5 className="fw-semibold text-muted mb-0">
                    Payment Method
                  </h5>

                  {showPaymentMethodChooser ? (
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
                  ) : (
                    <div className="small text-muted py-2">Card Payment</div>
                  )}
                </div>
              </div>

              <div className="p-4">
                {showMobileUI && (
                  <div>
                    <div className="text-center">
                      <div className="d-flex justify-content-center">
                        <img
                          src="/images/mobile_payment_app_20260204.png"
                          alt="Mobile apps"
                          width={350}
                          height={220}
                          className="img-fluid"
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

                    <div className="mt-4">
                      {/* <div className="col-12">
                        <input
                          className="form-control"
                          name="mobile"
                          placeholder="Payment account number"
                          value={mobilePay.mobile}
                          onChange={handleMobilePayChange}
                        />
                      </div>

                      <div className="col-12">
                        <input
                          className="form-control"
                          name="ref_code"
                          placeholder="Reference Code"
                          value={mobilePay.ref_code}
                          onChange={handleMobilePayChange}
                        />
                      </div> */}

                      {/* <TermsCheckbox />

                      <button
                        type="button"
                        className="btn btn-primary-custom mt-4 px-5 py-2 d-block mx-auto"
                        onClick={submitMobilePayment}
                        disabled={mobileSubmitting || !canSubmit}
                      >
                        {mobileSubmitting ? "Submitting..." : "Submit"}
                      </button>

                      {mobileResult && (
                        <div
                          className={`alert alert-${mobileResult.type} mt-3 mb-0`}
                        >
                          {mobileResult.text}
                        </div>
                      )} */}
                    </div>
                  </div>
                )}

                {showCardUI && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <div className="fw-semibold text-muted">
                        Card Payment Details
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <span className="badge text-bg-light border">VISA</span>
                        <span className="badge text-bg-light border">AMEX</span>
                        <span className="badge text-bg-light border">MC</span>
                        <span className="badge text-bg-light border">DISC</span>
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
                      product={mode === "subscription" ? product : undefined}
                      cadence={mode === "subscription" ? cadence : undefined}
                      onPaymentSuccess={(id?: string) => {
                        let q = id
                          ? `?method=card&id=${encodeURIComponent(id)}`
                          : `?method=card`;
                        if (package_id) {
                          q += `&package_id=${package_id}`;
                        }
                        router.push(`/thank-you${q}`);
                      }}
                      onStateChange={handleCardStateChange}
                    />

                    {/* {!!user.email.trim() &&
                      (emailChecking ||
                        emailExists ||
                        !looksLikeEmail(user.email)) && (
                        <div
                          className={`alert ${emailExists || !looksLikeEmail(user.email)
                            ? "alert-danger"
                            : "alert-info"
                            } mt-3 mb-0 py-2`}
                        >
                          {emailExists
                            ? emailCheckMsg
                            : !looksLikeEmail(user.email)
                              ? "Please enter a valid email address."
                              : "Checking email... Please wait."}
                        </div>
                      )} */}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
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
              />

              <input
                className="form-control mb-2"
                name="last_name"
                placeholder="Last Name"
                value={user.last_name}
                onChange={handleChange}
              />

              <input
                className="form-control mb-2"
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
              />

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
                >
                  {emailCheckMsg}
                </div>
              )}

              <input
                className="form-control mb-2"
                name="mobile"
                placeholder="Mobile"
                value={user.mobile}
                onChange={handleChange}
              />

              <input
                className="form-control mb-0"
                type="password"
                name="password"
                placeholder="Password"
                value={user.password}
                onChange={handleChange}
              />

              {mode === "subscription" && subscriptionInvalid && (
                <div className="alert alert-danger mt-3 mb-0 py-2">
                  Invalid subscription parameters.
                </div>
              )}

              <div className="mt-3 small text-muted">
                We’ll use your email for purchase confirmation and account
                access.
              </div>
              <TermsCheckbox />

              {paymentMethod === "mobile" ? (
                <div>
                  <button
                    type="button"
                    className="btn btn-primary-custom mt-4 px-5 py-2 d-block mx-auto"
                    onClick={submitMobilePayment}
                    disabled={mobileSubmitting || !canSubmit}
                  >
                    {mobileSubmitting ? "Submitting..." : "Submit"}
                  </button>

                  {mobileResult && (
                    <div
                      className={`alert alert-${mobileResult.type} mt-3 mb-0`}
                    >
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
                      subscriptionInvalid ||
                      cardBlockedByEmail ||
                      !agreeTerms ||
                      !cardState.isCardValid ||
                      !canSubmit
                    }
                  >
                    {cardState.completed
                      ? "Paid"
                      : cardState.paying
                        ? "Processing…"
                        : mode === "subscription"
                          ? "Subscribe"
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
                    <p className="mt-3 fw-bold text-center text-danger">
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
    </div>
  );
}
