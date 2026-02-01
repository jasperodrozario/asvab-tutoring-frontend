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

type Props = {
  amount: number;      // cents (e.g. 7500)
  course_id: string;   // from URL/detail page
  session_id: string;  // from API/detail page
  user: User;          // registration form state
};

export default function SquarePaymentForm({ amount, course_id, session_id, user }: Props) {
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const cardInstanceRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const [initializing, setInitializing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

  // Load Square script ONCE
  const loadSquareScript = () =>
    new Promise<void>((resolve, reject) => {
      const existing = document.getElementById("square-js");
      if (existing) return resolve();

      const script = document.createElement("script");
      script.id = "square-js";
      script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Square JS"));
      document.body.appendChild(script);
    });

  // Initialize payment form (ONLY ONCE) + cleanup
  useEffect(() => {
    const init = async () => {
      try {
        if (initializedRef.current) return;
        if (!appId || !locationId) {
          setMessage("Payment is not configured correctly.");
          console.error("Missing Square env variables.");
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

        // Prevent duplicate attach
        initializedRef.current = true;

        const payments = window.Square.payments(appId, locationId);
        const card = await payments.card();
        await card.attach(cardContainerRef.current);

        cardInstanceRef.current = card;
        setMessage(null);
      } catch (error) {
        console.error("Error initializing payment:", error);
        setMessage("Failed to initialize payment.");
      } finally {
        setInitializing(false);
      }
    };

    init();

    return () => {
      try {
        if (cardInstanceRef.current) {
          cardInstanceRef.current.destroy();
          cardInstanceRef.current = null;
        }
        initializedRef.current = false;
      } catch {}
    };
  }, [appId, locationId]);

  const validateUser = () => {
    const required: (keyof User)[] = ["first_name", "last_name", "email", "mobile", "password"];
    for (const k of required) {
      if (!user?.[k] || String(user[k]).trim().length === 0) return false;
    }
    return true;
  };

  // Handle payment request
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

    setPaying(true);
    setMessage(null);

    try {
      const tokenizeResult = await cardInstanceRef.current.tokenize();

      if (tokenizeResult.status !== "OK") {
        console.error("Tokenize error:", tokenizeResult);
        setMessage("Card was declined. Please try again.");
        return;
      }

      const res = await fetch("/api/square-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: tokenizeResult.token,
          amount,      // cents integer
          course_id,
          session_id,
          user,
        }),
      });

      const data = await res.json();

      // Payment failed at Square
      if (!data.success) {
        console.error("Payment API error:", data);
        setMessage("Payment failed. Please try again.");
        return;
      }

      // Payment OK but registration may fail
      if (data.registrationSuccess) {
        setMessage("✅ Payment + Enrollment successful!");
      } else {
        setMessage("✅ Payment successful, but enrollment save failed. Please contact support.");
        console.log("Registration response:", data.registrationResponse);
      }
    } catch (error) {
      console.error("Payment processing failed:", error);
      setMessage("Error while processing payment.");
    } finally {
      setPaying(false);
    }
  };

  const displayAmount = (amount / 100).toFixed(2);

  return (
    <div>
      <div ref={cardContainerRef} className="border p-3 rounded" />

      {initializing ? (
        <p className="mt-3">Loading payment form…</p>
      ) : (
        <button className="btn btn-primary mt-3" onClick={handlePayment} disabled={paying}>
          {paying ? "Processing…" : `Pay $${displayAmount}`}
        </button>
      )}

      {message && <p className="mt-3 fw-bold">{message}</p>}
    </div>
  );
}
