"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SquarePaymentForm from "@/components/square-payment-form/SquarePaymentForm";

type PaymentMode = "one_time" | "subscription";
type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

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

export default function CheckoutContent() {
  const searchParams = useSearchParams();

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

  // ✅ Mode from query only (no toggle)
  const mode: PaymentMode = useMemo(() => {
    const q = searchParams.get("mode");
    if (isMode(q)) return q;
    return "one_time";
  }, [searchParams]);

  // ✅ Product (query -> infer -> default), read-only
  const product: Product = useMemo(() => {
    const q = searchParams.get("product");
    if (isProduct(q)) return q;

    const inferred = inferProductFromCourseId(course_id);
    return inferred || "ASVAB";
  }, [searchParams, course_id]);

  // ✅ Cadence from query, read-only
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

  if (invalidBase) {
    return <p className="text-danger">Invalid checkout link.</p>;
  }

  const pageTitle = mode === "subscription" ? "Subscription Checkout" : "Checkout";
  const pageSub =
    mode === "subscription"
      ? "Your subscription will renew automatically based on your plan."
      : "One-time payment for your selected package.";

  return (
    <div className="container py-5" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">{pageTitle}</h1>
          <p className="text-muted mb-0">{pageSub}</p>

          {/* Optional subscription detail (not debug text) */}
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

      {/* ✅ Left & Right same level + responsive */}
      <div className="row g-4 align-items-stretch">
        {/* Left */}
        <div className="col-12 col-lg-6 d-flex">
          <div className="card shadow-sm border-0 w-100">
            <div className="card-body p-4 d-flex flex-column">
              <h5 className="fw-bold mb-3">Your Information</h5>

              {/* ✅ First name + last name separate lines */}
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

        {/* Right */}
        <div className="col-12 col-lg-6 d-flex">
          <div className="card shadow-sm border-0 w-100">
            <div className="card-body p-0 d-flex flex-column">
              <div className="px-4 pt-4 pb-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-semibold text-muted">Payment Details</div>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="badge text-bg-light border">VISA</span>
                    <span className="badge text-bg-light border">MC</span>
                    <span className="badge text-bg-light border">AMEX</span>
                    <span className="badge text-bg-light border">DISC</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* ✅ Keep your working Square component (logic unchanged) */}
                <SquarePaymentForm
                  amount={amountCents}
                  course_id={course_id}
                  session_id={session_id}
                  user={user}
                  mode={mode}
                  product={mode === "subscription" ? product : undefined}
                  cadence={mode === "subscription" ? cadence : undefined}
                  disabled={subscriptionInvalid}
                />

                <div className="small text-muted mt-3">
                  Secure payment • PCI compliant
                </div>
              </div>

              {/* {mode === "subscription" && (
                <div className="px-4 pb-4">
                  <div className="small text-muted">
                    You can cancel your subscription anytime from your account settings.
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
