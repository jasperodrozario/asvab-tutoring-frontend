"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Square?: any;
  }
}

type User = {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  password: string;
};

type PaymentMode = "one_time" | "subscription";
type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

type Props = {
  amount: number; // cents (e.g., 1500)
  course_id: string;
  session_id: string;
  user: User;

  mode?: PaymentMode; // must be passed from CheckoutContent
  product?: Product; // required when mode="subscription"
  cadence?: Cadence; // required when mode="subscription"

  disabled?: boolean;
};

function isProduct(x: any): x is Product {
  return x === "ASVAB" || x === "AFOQT" || x === "ASTB" || x === "SIFT" || x === "OAR";
}
function isCadence(x: any): x is Cadence {
  return x === "1M" || x === "3M" || x === "6M" || x === "12M";
}

export default function SquarePaymentForm({
  amount,
  course_id,
  session_id,
  user,
  mode = "one_time",
  product,
  cadence,
  disabled = false,
}: Props) {
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const cardInstanceRef = useRef<any>(null);

  const [initializing, setInitializing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

  const squareScriptSrc = (() => {
    const isSandbox = (appId || "").startsWith("sandbox-");
    return isSandbox
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";
  })();

  const loadSquareScript = () =>
    new Promise<void>((resolve, reject) => {
      const existing = document.getElementById("square-js");
      if (existing) return resolve();

      const script = document.createElement("script");
      script.id = "square-js";
      script.src = squareScriptSrc;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Square JS"));
      document.body.appendChild(script);
    });

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setInitializing(true);

        if (!appId || !locationId) {
          setMessage("Payment is not configured correctly.");
          console.error("Missing NEXT_PUBLIC_SQUARE_APPLICATION_ID or NEXT_PUBLIC_SQUARE_LOCATION_ID");
          return;
        }

        await loadSquareScript();

        if (!window.Square) {
          setMessage("Unable to load payment form.");
          console.error("Square object not available.");
          return;
        }

        if (!cardContainerRef.current) {
          setMessage("Card container not found.");
          console.error("Card container ref missing.");
          return;
        }

        // Prevent duplicate attach (React StrictMode)
        cardContainerRef.current.innerHTML = "";

        const payments = window.Square.payments(appId, locationId);
        const card = await payments.card();

        if (cancelled) return;

        await card.attach(cardContainerRef.current);
        cardInstanceRef.current = card;

        setMessage(null);
      } catch (err) {
        console.error("Error initializing payment:", err);
        setMessage("Failed to initialize payment.");
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      try {
        if (cardInstanceRef.current) {
          cardInstanceRef.current.destroy();
          cardInstanceRef.current = null;
        }
        if (cardContainerRef.current) {
          cardContainerRef.current.innerHTML = "";
        }
      } catch {}
    };
  }, [appId, locationId, squareScriptSrc]);

  const validateUser = () => {
    const required: (keyof User)[] = ["first_name", "last_name", "email", "mobile", "password"];
    for (const k of required) {
      if (!user?.[k] || String(user[k]).trim().length === 0) return false;
    }
    return true;
  };

  const validateSubscriptionSelection = () => {
    if (mode !== "subscription") return true;
    return isProduct(product) && isCadence(cadence);
  };

  const handlePayment = async () => {
    if (!cardInstanceRef.current) {
      setMessage("Payment form not ready.");
      return;
    }

    if (!validateUser()) {
      setMessage("Please fill in all registration fields first.");
      return;
    }

    if (!course_id || !session_id) {
      setMessage("Missing course/session info. Please open checkout from the course page again.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Invalid amount. Please open checkout from the course page again.");
      return;
    }

    if (mode === "subscription" && !validateSubscriptionSelection()) {
      setMessage("Please select product + duration for subscription.");
      return;
    }

    setPaying(true);
    setMessage(null);

    try {
      const tokenizeResult = await cardInstanceRef.current.tokenize();

      if (tokenizeResult.status !== "OK") {
        console.error("Tokenize error:", tokenizeResult);
        setMessage("Card was declined. Please try again.");
        return;
      }

      const sourceId = tokenizeResult.token;

      // ✅ SUBSCRIPTION
      if (mode === "subscription") {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId,
            product,
            cadence,
            userEmail: user.email,
            userName: `${user.first_name} ${user.last_name}`.trim(),

            // ✅ FIX: REQUIRED by your route.ts for RELATIVE pricing
            amount, // cents (e.g., 1500)

            course_id,
            session_id,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          console.error("Subscribe API error:", data);
          setMessage(data.error || "Subscription failed. Please try again.");
          return;
        }

        setMessage(
          `✅ Subscription created successfully! ID: ${data.subscriptionId ?? "(no id returned)"}`
        );
        return;
      }

      // ✅ ONE-TIME PAYMENT
      const res = await fetch("/api/square-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          amount,
          course_id,
          session_id,
          user,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        console.error("Payment API error:", data);
        setMessage("Payment failed. Please try again.");
        return;
      }

      if (data.registrationSuccess) {
        setMessage("✅ Payment + Enrollment successful!");
      } else {
        setMessage("✅ Payment successful, but enrollment save failed. Please contact support.");
      }
    } catch (err) {
      console.error("Payment processing failed:", err);
      setMessage("Error while processing payment.");
    } finally {
      setPaying(false);
    }
  };

  const displayAmount = (amount / 100).toFixed(2);
  const buttonLabel = mode === "subscription" ? "Subscribe" : `Pay $${displayAmount}`;
  const uiDisabled = paying || disabled || (mode === "subscription" && !validateSubscriptionSelection());

  return (
    <div>
      <div ref={cardContainerRef} className="border p-3 rounded" />

      {/* Debug line (keep during testing, remove later) */}
      {/* <p className="mt-2 small">
        mode: <b>{mode}</b> | product: <b>{product ?? "-"}</b> | cadence: <b>{cadence ?? "-"}</b> | amount(cents):{" "}
        <b>{Number.isFinite(amount) ? amount : "-"}</b>
      </p> */}

      {initializing ? (
        <p className="mt-3">Loading payment form…</p>
      ) : (
        <button className="btn btn-primary-custom mt-4 px-5 py-2" onClick={handlePayment} disabled={uiDisabled}>
          {paying ? "Processing…" : buttonLabel}
        </button>
      )}

      {message && <p className="mt-3 fw-bold">{message}</p>}
    </div>
  );
}
