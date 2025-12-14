"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Square?: any;
  }
}

type Props = {
  amount: number; // in cents
};

export default function SquarePaymentForm({ amount }: Props) {
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const [card, setCard] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

  // Load Square script ONCE
  const loadSquareScript = () =>
    new Promise<void>((resolve, reject) => {
      const existing = document.getElementById("square-js");
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.id = "square-js";
      script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Square JS"));
      document.body.appendChild(script);
    });

  // Initialize payment form
  useEffect(() => {
    const init = async () => {
      try {
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

        const payments = window.Square.payments(appId, locationId);

        const cardInstance = await payments.card();
        await cardInstance.attach(cardContainerRef.current);

        setCard(cardInstance);
        setMessage(null);
      } catch (error) {
        console.error("Error initializing payment:", error);
        setMessage("Failed to initialize payment.");
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, [appId, locationId]);

  // Handle payment request
  const handlePayment = async () => {
    if (!card) {
      setMessage("Payment form not ready.");
      return;
    }

    setPaying(true);
    setMessage(null);

    try {
      const tokenizeResult = await card.tokenize();

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
          amount,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Payment successful!");
        // Optional: disable button after success
        setPaying(false);
        return;
      }

      console.error("Payment API error:", data.error);
      setMessage("Payment failed. Please try again.");
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
      {/* Card container */}
      <div
        id="card-container"
        ref={cardContainerRef}
        className="border p-3 rounded"
      />

      {/* Payment button */}
      {initializing ? (
        <p className="mt-3">Loading payment form…</p>
      ) : (
        <button
          className="btn btn-primary mt-3"
          onClick={handlePayment}
          disabled={paying}
        >
          {paying ? "Processing…" : `Pay $${displayAmount}`}
        </button>
      )}

      {message && <p className="mt-3 fw-bold">{message}</p>}

      {/* Sandbox card for testing */}
      <div className="mt-4 p-3 bg-light border rounded">
        <strong>Sandbox Test Card:</strong>
        <p>Number: 4111 1111 1111 1111</p>
        <p>Expiry: 12/30 • CVV: 111 • ZIP: 12345</p>
      </div>
    </div>
  );
}
