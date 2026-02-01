"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SquarePaymentForm from "@/components/square-payment-form/SquarePaymentForm";

type PaymentMode = "one_time" | "subscription";
type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

const PRODUCT_OPTIONS: Array<{ value: Product; label: string }> = [
  { value: "ASVAB", label: "ASVAB" },
  { value: "AFOQT", label: "AFOQT" },
  { value: "ASTB", label: "ASTB" },
  { value: "SIFT", label: "SIFT" },
  { value: "OAR", label: "OAR" },
];

const CADENCE_OPTIONS: Array<{ value: Cadence; label: string }> = [
  { value: "1M", label: "1-month" },
  { value: "3M", label: "3-month" },
  { value: "6M", label: "6-month" },
  { value: "12M", label: "12-month" },
];

function isProduct(x: any): x is Product {
  return x === "ASVAB" || x === "AFOQT" || x === "ASTB" || x === "SIFT" || x === "OAR";
}
function isCadence(x: any): x is Cadence {
  return x === "1M" || x === "3M" || x === "6M" || x === "12M";
}
function isMode(x: any): x is PaymentMode {
  return x === "one_time" || x === "subscription";
}

/**
 * Optional: infer product from course_id if your checkout URLs include it.
 * Adjust the rules if your real course_id values are different.
 */
function inferProductFromCourseId(courseId: string): Product | "" {
  const s = (courseId || "").toLowerCase();
  if (s.includes("asvab")) return "ASVAB";
  if (s.includes("afoqt")) return "AFOQT";
  if (s.includes("astb")) return "ASTB";
  if (s.includes("sift")) return "SIFT";
  if (s.includes("oar")) return "OAR";
  return "";
}

export default function CheckoutContent() {
  const searchParams = useSearchParams();

  const course_id = searchParams.get("course_id") || "";
  const session_id = searchParams.get("session_id") || "";

  // amount is expected to be cents in your flow (e.g., 1500 => $15.00)
  const amountCents = useMemo(() => {
    const raw = searchParams.get("amount") ?? "0";
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : NaN;
  }, [searchParams]);

  const amountDollarsForUI = useMemo(() => {
    if (!Number.isFinite(amountCents)) return 0;
    return amountCents / 100;
  }, [amountCents]);

  // Mode: allow query param override
  const [mode, setMode] = useState<PaymentMode>(() => {
    const q = searchParams.get("mode");
    if (isMode(q)) return q;
    return "one_time";
  });

  // Product: allow query param override, else infer, else default
  const [product, setProduct] = useState<Product>(() => {
    const q = searchParams.get("product");
    if (isProduct(q)) return q;

    const inferred = inferProductFromCourseId(course_id);
    return inferred || "ASVAB";
  });

  // Cadence: allow query param override, else default to 1M
  const [cadence, setCadence] = useState<Cadence>(() => {
    const q = searchParams.get("cadence");
    if (isCadence(q)) return q;
    return "1M";
  });

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

  const subscriptionInvalid = mode === "subscription" && (!isProduct(product) || !isCadence(cadence));

  if (invalidBase) {
    return <p className="text-danger">Invalid checkout link.</p>;
  }

  return (
    <div className="container py-5">
      <h1 className="mb-3">Checkout</h1>

      <div className="mb-3">
        <label className="me-3">
          <input
            type="radio"
            name="mode"
            checked={mode === "one_time"}
            onChange={() => setMode("one_time")}
          />{" "}
          One-time payment
        </label>

        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === "subscription"}
            onChange={() => setMode("subscription")}
          />{" "}
          Subscription
        </label>
      </div>

      <p className="fs-5">
        <strong>Total:</strong> ${amountDollarsForUI.toFixed(2)}
      </p>

      {/* User fields */}
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
        className="form-control mb-3"
        type="password"
        name="password"
        placeholder="Password"
        value={user.password}
        onChange={handleChange}
      />

      {/* Subscription selectors */}
      {mode === "subscription" && (
        <div className="mb-3">
          <label className="form-label fw-semibold">Subscription option</label>

          <div className="row g-2">
            <div className="col-md-6">
              <select
                className="form-select"
                value={product}
                onChange={(e) => setProduct(e.target.value as Product)}
              >
                {PRODUCT_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <select
                className="form-select"
                value={cadence}
                onChange={(e) => setCadence(e.target.value as Cadence)}
              >
                {CADENCE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {subscriptionInvalid && (
            <div className="text-danger mt-2">
              Please select a valid subscription option to continue.
            </div>
          )}
        </div>
      )}

      {/* ✅ CRITICAL: pass mode/product/cadence so SquarePaymentForm can call /api/subscribe */}
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
    </div>
  );
}
