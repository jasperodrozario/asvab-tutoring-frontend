// components/square-payment-form/SquarePaymentForm.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  amount: number; // cents
  course_id: string;
  session_id: string;
  package_id: string;
  user: User;

  mode?: PaymentMode;
  product?: Product;
  cadence?: Cadence;

  disabled?: boolean;

  /**
   * If provided, the Pay/Subscribe button stays disabled until user agrees.
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

function safeMsg(v: unknown, fallback = "Something went wrong. Please try again.") {
  const s = typeof v === "string" ? v : "";
  const trimmed = s.trim();
  // Avoid showing long/technical server output to end users
  if (!trimmed || trimmed.length > 160) return fallback;
  return trimmed;
}

/**
 * Keep a per-script-src singleton loader (supports sandbox/prod correctly).
 * This avoids race conditions and prevents injecting the script multiple times.
 */
const squareScriptPromises = new Map<string, Promise<void>>();

function loadSquareScriptOnce(src: string): Promise<void> {
  const existingPromise = squareScriptPromises.get(src);
  if (existingPromise) return existingPromise;

  const p = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("square-js") as HTMLScriptElement | null;

    const markLoaded = (el: HTMLScriptElement) => {
      el.dataset.loaded = "1";
      el.dataset.src = src;
    };

    // If a script tag exists and is already loaded AND matches src, we're done.
    if (existing?.dataset.loaded === "1" && (existing.dataset.src || existing.src) === src) {
      return resolve();
    }

    // If a script tag exists but is for a different src, replace it safely.
    if (existing && (existing.dataset.src || existing.src) !== src) {
      try {
        existing.remove();
      } catch {
        // ignore
      }
    }

    // Create new script
    const script = document.createElement("script");
    script.id = "square-js";
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.loaded = "0";
    script.dataset.src = src;

    const onLoad = () => {
      markLoaded(script);
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Failed to load Square payments library."));
    };

    const cleanup = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    document.body.appendChild(script);
  });

  squareScriptPromises.set(src, p);
  return p;
}

async function waitForWindowSquare(maxMs = 10_000): Promise<boolean> {
  const start = Date.now();
  while (!window.Square && Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return !!window.Square;
}

async function readJsonSafe(res: Response): Promise<any> {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text();
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid JSON response from server." };
    }
  }
  // If server returned HTML/text, avoid dumping it into UI
  return { success: false, error: "Unexpected server response." };
}

export default function SquarePaymentForm({
  amount,
  course_id,
  session_id,
  package_id,
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

  // Guards
  const initTokenRef = useRef(0);
  const mountedRef = useRef(false);

  const [initializing, setInitializing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>("");

  // Next.js: NEXT_PUBLIC_* are safe for client usage
  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";

const squareScriptSrc =
  process.env.NEXT_PUBLIC_SQUARE_SCRIPT_URL ||
  "https://sandbox.web.squarecdn.com/v1/square.js";

  const termsRequired = typeof agreeTerms === "boolean";
  const termsAgreed = termsRequired ? !!agreeTerms : true;

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

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;
    const myToken = ++initTokenRef.current;

    const setSafe = (fn: () => void) => {
      if (!cancelled && mountedRef.current && initTokenRef.current === myToken) fn();
    };

    const cleanupCard = async () => {
      try {
        if (cardInstanceRef.current) {
          await cardInstanceRef.current.destroy();
          cardInstanceRef.current = null;
        }
      } catch (e) {
        // keep console for debugging, but don't surface to user
        console.error("Square card cleanup error:", e);
      }
      if (cardContainerRef.current) {
        cardContainerRef.current.innerHTML = "";
      }
    };

    const init = async () => {
      setSafe(() => {
        setInitializing(true);
        setMessage(null);
      });

      if (!appId || !locationId) {
        setSafe(() => setMessage("Payment is not configured correctly."));
        setSafe(() => setInitializing(false));
        return;
      }

      try {
        // Ensure script is loaded
        await loadSquareScriptOnce(squareScriptSrc);

        // Wait for window.Square to appear
        const ok = await waitForWindowSquare(10_000);
        if (!ok) {
          setSafe(() => setMessage("Unable to load payment form. Please refresh the page."));
          setSafe(() => setInitializing(false));
          return;
        }

        if (!cardContainerRef.current) {
          setSafe(() => setMessage("Card container not found."));
          setSafe(() => setInitializing(false));
          return;
        }

        // Abort if a newer init started
        if (cancelled || initTokenRef.current !== myToken) return;

        // Cleanup existing instance before re-attaching
        await cleanupCard();

        // Create card
        const payments = window.Square!.payments(appId, locationId);
        const card = await payments.card();

        if (cancelled || initTokenRef.current !== myToken) {
          await card.destroy();
          return;
        }

        await card.attach(cardContainerRef.current);
        cardInstanceRef.current = card;

        setSafe(() => setMessage(null));
      } catch (e) {
        console.error("Square init error:", e);
        setSafe(() => setMessage("Failed to initialize payment. Please refresh and try again."));
      } finally {
        setSafe(() => setInitializing(false));
      }
    };

    init();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      // fire-and-forget cleanup (no state updates here)
      (async () => {
        try {
          if (cardInstanceRef.current) {
            await cardInstanceRef.current.destroy();
            cardInstanceRef.current = null;
          }
          if (cardContainerRef.current) cardContainerRef.current.innerHTML = "";
        } catch (e) {
          console.error("Square unmount cleanup error:", e);
        }
      })();
    };
  }, [appId, locationId, squareScriptSrc]);

  const handlePayment = async () => {
    if (completed || paying) return;

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

    if (!termsAgreed) {
      setMessage("Please agree to the Terms & Conditions to continue.");
      return;
    }

    setPaying(true);
    setMessage(null);

    const controller = new AbortController();

    try {
      const tokenizeResult = await cardInstanceRef.current.tokenize();

      if (tokenizeResult?.status !== "OK") {
        // Square provides helpful errors sometimes:
        const sqErr =
          tokenizeResult?.errors?.[0]?.message ||
          tokenizeResult?.errors?.[0]?.detail ||
          "Please check your card details and try again.";
        setMessage(safeMsg(sqErr, "Unable to tokenize card. Please check details and try again."));
        return;
      }

      const sourceId: string = tokenizeResult.token;

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
            package_id,
          }),
          signal: controller.signal,
        });

        const data = await readJsonSafe(res);

        if (!res.ok || !data?.success) {
          setMessage(safeMsg(data?.error, "Subscription failed. Please try again."));
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
          package_id,
          user,
        }),
        signal: controller.signal,
      });

      const data = await readJsonSafe(res);

      if (!res.ok || !data?.success) {
        setMessage(safeMsg(data?.error, "Payment failed. Please try again."));
        return;
      }

      const id = pickId(data);

      setCompleted(true);
      if (id) setPaymentId(id);
      onPaymentSuccess?.(id);

      setMessage(data?.registrationSuccess ? "✅ Payment + Enrollment successful!" : "✅ Payment successful!");
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error("Payment error:", e);
      setMessage("Error while processing payment. Please try again.");
    } finally {
      controller.abort();
      setPaying(false);
    }
  };

  const displayAmount = useMemo(() => (Number(amount) / 100).toFixed(2), [amount]);
  const buttonLabel = mode === "subscription" ? "Subscribe" : `Pay $${displayAmount}`;

  const uiDisabled =
    initializing ||
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
              type="checkbox"
              checked={!!agreeTerms}
              onChange={(e) => onAgreeTermsChange?.(e.target.checked)}
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

      <button className="btn btn-primary-custom mt-4 px-5 py-2" onClick={handlePayment} disabled={uiDisabled}>
        {completed ? "Paid" : paying ? "Processing…" : buttonLabel}
      </button>

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