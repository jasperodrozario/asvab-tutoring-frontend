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
  amount: number;
  course_id: string;
  session_id: string;

  // ✅ ADDED
  package_id: string;

  user: User;

  mode?: PaymentMode;
  product?: Product;
  cadence?: Cadence;

  disabled?: boolean;

  /**
   * If provided, the Pay/Subscribe button will stay disabled until the user agrees.
   * Parent keeps the source of truth.
   */
  agreeTerms?: boolean;
  onAgreeTermsChange?: (next: boolean) => void;

  onPaymentSuccess?: (paymentId?: string) => void;
};

function isProduct(x: unknown): x is Product {
  return x === "ASVAB" || x === "AFOQT" || x === "ASTB" || x === "SIFT" || x === "OAR";
}
function isCadence(x: unknown): x is Cadence {
  return x === "1M" || x === "3M" || x === "6M" || x === "12M";
}

/**
 * Fix: avoid race condition when <script id="square-js"> exists but hasn't finished loading yet.
 * We keep a single shared Promise and only resolve after the script "load" event has fired.
 */
let squareScriptPromise: Promise<void> | null = null;

function loadSquareScriptOnce(src: string): Promise<void> {
  if (squareScriptPromise) return squareScriptPromise;

  squareScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("square-js") as HTMLScriptElement | null;

    // Already loaded before
    if (existing?.dataset.loaded === "1") return resolve();

    // Exists but may still be loading → wait for actual load/error
    if (existing) {
      const onLoad = () => {
        existing.dataset.loaded = "1";
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("Failed to load Square JS"));
      };
      const cleanup = () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onError);
      };

      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onError);
      return;
    }

    // Create new script
    const script = document.createElement("script");
    script.id = "square-js";
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Square JS"));

    document.body.appendChild(script);
  });

  return squareScriptPromise;
}

async function waitForWindowSquare(maxMs = 10_000): Promise<boolean> {
  const start = Date.now();
  while (!window.Square && Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return !!window.Square;
}

export default function SquarePaymentForm({
  amount,
  course_id,
  session_id,
  package_id, // ✅ ADDED
  user,
  mode = "one_time",
  product,
  cadence,
  disabled = false,
  agreeTerms,
  onAgreeTermsChange,
  onPaymentSuccess,
}: Props) {
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const cardInstanceRef = useRef<any>(null);

  // Guard against double init (dev hot reload / remount timing)
  const initTokenRef = useRef(0);

  const [initializing, setInitializing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>("");

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

  const squareScriptSrc = (() => {
    const isSandbox = (appId || "").startsWith("sandbox-");
    return isSandbox
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";
  })();

  useEffect(() => {
    let cancelled = false;
    const myToken = ++initTokenRef.current;

    const init = async () => {
      try {
        setInitializing(true);

        if (!appId || !locationId) {
          setMessage("Payment is not configured correctly.");
          return;
        }

        // Ensure script is truly loaded (not just present)
        await loadSquareScriptOnce(squareScriptSrc);

        // Wait longer for window.Square to appear (slow network / cold cache / hot reload)
        const ok = await waitForWindowSquare(10_000);
        if (!ok) {
          setMessage("Unable to load payment form. Please refresh the page.");
          return;
        }

        if (!cardContainerRef.current) {
          setMessage("Card container not found.");
          return;
        }

        // If another init started after us, abort
        if (cancelled || initTokenRef.current !== myToken) return;

        // Cleanup any existing card instance before creating a new one
        try {
          if (cardInstanceRef.current) {
            await cardInstanceRef.current.destroy();
            cardInstanceRef.current = null;
          }
        } catch (e) {
          console.error("Previous card destroy error:", e);
        }

        // Clean existing content before attaching
        cardContainerRef.current.innerHTML = "";

        const payments = window.Square!.payments(appId, locationId);
        const card = await payments.card();

        if (cancelled || initTokenRef.current !== myToken) {
          await card.destroy();
          return;
        }

        await card.attach(cardContainerRef.current);
        cardInstanceRef.current = card;

        setMessage(null);
      } catch (err) {
        console.error("Error initializing payment:", err);
        setMessage("Failed to initialize payment.");
      } finally {
        if (!cancelled && initTokenRef.current === myToken) setInitializing(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      const cleanup = async () => {
        try {
          if (cardInstanceRef.current) {
            await cardInstanceRef.current.destroy();
            cardInstanceRef.current = null;
          }
          if (cardContainerRef.current) {
            cardContainerRef.current.innerHTML = "";
          }
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      };
      cleanup();
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

  const pickId = (data: any): string => {
    return (
      data?.paymentId ||
      data?.payment_id ||
      data?.id ||
      data?.subscriptionId ||
      data?.subscription_id ||
      ""
    );
  };

  const handlePayment = async () => {
    if (completed) return;

    if (!cardInstanceRef.current) {
      setMessage("Payment form not ready.");
      return;
    }

    if (!validateUser()) {
      setMessage("Please fill in all registration fields first.");
      return;
    }

    if (!course_id || !session_id || !package_id) {
      setMessage("Missing course/session/package info. Please open checkout from the course page again.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Invalid amount. Please open checkout from the course page again.");
      return;
    }

    if (mode === "subscription" && !validateSubscriptionSelection()) {
      setMessage("Invalid subscription details in the checkout link.");
      return;
    }

    setPaying(true);
    setMessage(null);

    try {
      const tokenizeResult = await cardInstanceRef.current.tokenize();

      if (tokenizeResult.status !== "OK") {
        setMessage("Card was declined. Please try again.");
        return;
      }

      const sourceId = tokenizeResult.token;

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
            password: user.password,
            mobile: user.mobile,
            amount,
            course_id,
            session_id,
            package_id, // ✅ ADDED
          }),
        });

        const data = await res.json();

        if (!data.success) {
          setMessage(data.error || "Subscription failed. Please try again.");
          return;
        }

        const id = pickId(data);

        setCompleted(true);
        if (id) setPaymentId(id);
        onPaymentSuccess?.(id);

        setMessage("✅ Subscription created successfully!");
        return;
      }

      const res = await fetch("/api/square-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          amount,
          course_id,
          session_id,
          package_id, // ✅ ADDED
          user,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage("Payment failed. Please try again.");
        return;
      }

      const id = pickId(data);

      setCompleted(true);
      if (id) setPaymentId(id);
      onPaymentSuccess?.(id);

      setMessage(data.registrationSuccess ? "✅ Payment + Enrollment successful!" : "✅ Payment successful!");
    } catch (err) {
      console.error(err);
      setMessage("Error while processing payment.");
    } finally {
      setPaying(false);
    }
  };

  const displayAmount = (amount / 100).toFixed(2);
  const buttonLabel = mode === "subscription" ? "Subscribe" : `Pay $${displayAmount}`;

  const termsRequired = typeof agreeTerms === "boolean";
  const termsAgreed = termsRequired ? agreeTerms : true;

  const uiDisabled =
    paying ||
    disabled ||
    completed ||
    !termsAgreed ||
    (mode === "subscription" && !validateSubscriptionSelection());

  return (
    <div>
      <div ref={cardContainerRef} className="border p-3 rounded bg-white" style={{ minHeight: 56 }} />

      {termsRequired && (
        <div className="mt-3">
          <label className="d-flex align-items-center gap-2 small mb-0">
            <input
              type="radio"
              name="agree_terms"
              checked={!!agreeTerms}
              onChange={() => onAgreeTermsChange?.(true)}
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

          {!termsAgreed && <div className="small text-muted mt-2">Please agree to enable the button.</div>}
        </div>
      )}

      {initializing ? (
        <p className="mt-3">Loading payment form…</p>
      ) : (
        <button className="btn btn-primary-custom mt-4 px-5 py-2" onClick={handlePayment} disabled={uiDisabled}>
          {completed ? "Paid" : paying ? "Processing…" : buttonLabel}
        </button>
      )}

      {completed && paymentId && (
        <div className="mt-3">
          <div className="small text-muted">
            <span className="fw-semibold">Payment ID:</span> {paymentId}
          </div>
        </div>
      )}

      {message && <p className="mt-3 fw-bold">{message}</p>}
    </div>
  );
}