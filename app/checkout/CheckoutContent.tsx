"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SquarePaymentForm from "@/components/square-payment-form/SquarePaymentForm";
import Image from "next/image";

type PaymentMode = "one_time" | "subscription";
type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

type PaymentMethod = "mobile" | "card";

function isProduct(x: any): x is Product {
  return x === "ASVAB" || x === "AFOQT" || x === "ASTB" || x === "SIFT" || x === "OAR";
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

  const API_URL = "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php";

  const course_id = searchParams.get("course_id") || "";
  const session_id = searchParams.get("session_id") || "";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const invalidBase =
    !course_id || !session_id || !Number.isFinite(amountCents) || amountCents <= 0;

  const subscriptionInvalid =
    mode === "subscription" && (!isProduct(product) || !isCadence(cadence));

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile");

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

  // Agreement state (shared between mobile & card if needed)
  const [agreeTerms, setAgreeTerms] = useState(false);

  const canSubmitMobile =
    agreeTerms &&
    !!mobilePay.mobile.trim() &&
    !!mobilePay.ref_code.trim() &&
    !!user.first_name.trim() &&
    !!user.last_name.trim() &&
    !!user.email.trim() &&
    !!user.password.trim() &&
    !!user.mobile.trim() &&
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

    if (!canSubmitMobile) {
      setMobileResult({
        type: "danger",
        text: "Please complete your registration info + mobile payment details first.",
      });
      return;
    }

    setMobileSubmitting(true);

    try {
      const body = new URLSearchParams();
      body.append("action", "user-registration-mobile-payment");
      body.append("course_id", String(course_id));
      body.append("session_id", String(session_id));
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
          text: "Server returned invalid response. Please try again.",
        });
        return;
      }

      if (data?.isSuccess) {
        setMobileResult({
          type: "success",
          text: data?.message || "Mobile payment request submitted successfully.",
        });

        router.push("/thank-you?method=mobile");
        return;
      }

      setMobileResult({
        type: "danger",
        text: data?.message || "Submission failed. Please check your info and try again.",
      });
    } catch (err) {
      console.error(err);
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

  const pageTitle = mode === "subscription" ? "Subscription Checkout" : "Checkout";
  const pageSub =
    mode === "subscription"
      ? "Your subscription will renew automatically based on your plan."
      : "One-time payment for your selected package.";

  // Mobile-only terms radio (kept as-is)
  const TermsRadio = () => (
    <div className="mt-3">
      <label className="d-flex align-items-center gap-2 small mb-0">
        <input
          type="radio"
          name="agree_terms"
          checked={agreeTerms}
          onChange={() => setAgreeTerms(true)}
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

      {!agreeTerms && <div className="small text-muted mt-2">Please agree to enable the button.</div>}
    </div>
  );

  return (
    <div className="container py-5" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">{pageTitle}</h1>
          <p className="text-muted mb-0">{pageSub}</p>

          {mode === "subscription" && (
            <p className="text-muted small mb-0 mt-2">
              Plan: <span className="fw-semibold">{product}</span> •{" "}
              <span className="fw-semibold">{cadenceLabel(cadence)}</span>
            </p>
          )}
        </div>

        <div className="text-end">
          <div className="text-muted small">Total</div>
          <div className="fw-bold" style={{ fontSize: 28 }}>
            ${amountDollarsForUI.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="row g-4 align-items-stretch">
        <div className="col-12 col-lg-6 d-flex">
          <div className="card shadow-sm border-0 w-100">
            <div className="card-body p-4 d-flex flex-column">
              <h5 className="fw-bold mb-3">Your Registration Information</h5>

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
              />
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
                  Invalid subscription parameters in checkout link.
                </div>
              )}

              <div className="mt-3 small text-muted">
                We’ll use your email for purchase confirmation and account access.
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6 d-flex">
          <div className="card shadow-sm border-0 w-100">
            <div className="card-body p-0 d-flex flex-column">
              <div className="px-4 pt-4 pb-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="fw-semibold text-muted">Payment Method</div>

                  <div className="d-flex align-items-center gap-3">
                    <label className="d-flex align-items-center gap-2 small mb-0">
                      <input
                        type="radio"
                        name="pay_method"
                        checked={paymentMethod === "mobile"}
                        onChange={() => setPaymentMethod("mobile")}
                      />
                      Mobile Payment
                    </label>

                    <label className="d-flex align-items-center gap-2 small mb-0">
                      <input
                        type="radio"
                        name="pay_method"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                      />
                      Card Payment
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {paymentMethod === "mobile" && (
                  <div>
                    <div className="text-center">
                      <div className="d-flex justify-content-center">
                        <Image
                          src="/images/mobile_payment_app_20260204.png"
                          alt="Mobile payment apps"
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
                        <div className="fw-bold text-success" style={{ fontSize: 20 }}>
                          (718) 200-6396
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="row g-2">
                        <div className="col-12">
                          <input
                            className="form-control"
                            name="mobile"
                            placeholder="payment account number"
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
                        </div>
                      </div>

                      <TermsRadio />

                      <button
                        type="button"
                        className="btn btn-primary-custom mt-4 px-5 py-2 d-block mx-auto"
                        onClick={submitMobilePayment}
                        disabled={mobileSubmitting || !canSubmitMobile}
                      >
                        {mobileSubmitting ? "Submitting..." : "Submit"}
                      </button>

                      {mobileResult && (
                        <div className={`alert alert-${mobileResult.type} mt-3 mb-0`}>
                          {mobileResult.text}
                        </div>
                      )}

                      <div className="small text-muted mt-3">
                        After sending payment, please enter your payment mobile number and reference code
                        so we can verify and activate your access.
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <div className="fw-semibold text-muted">Card Payment Details</div>
                      <div className="d-flex gap-2 flex-wrap">
                        <span className="badge text-bg-light border">VISA</span>
                        <span className="badge text-bg-light border">AMEX</span>
                        <span className="badge text-bg-light border">MC</span>
                        <span className="badge text-bg-light border">DISC</span>
                      </div>
                    </div>

                    <SquarePaymentForm
                      amount={amountCents}
                      course_id={course_id}
                      session_id={session_id}
                      user={user}
                      mode={mode}
                      product={mode === "subscription" ? product : undefined}
                      cadence={mode === "subscription" ? cadence : undefined}
                      disabled={subscriptionInvalid}
                      agreeTerms={agreeTerms}
                      onAgreeTermsChange={setAgreeTerms}
                      onPaymentSuccess={(id?: string) => {
                        const q = id ? `?method=card&id=${encodeURIComponent(id)}` : `?method=card`;
                        router.push(`/thank-you${q}`);
                      }}
                    />

                    <div className="small text-muted mt-3">Secure payment • PCI compliant</div>
                  </>
                )}
              </div>

              <div className="px-4 pb-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
