"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<any> | any;
    };
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

  // Optional billing details from your form
  postal_code?: string;
  country_code?: string;

  mode?: PaymentMode;
  product?: Product;
  cadence?: Cadence;

  disabled?: boolean;
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
  if (!trimmed || trimmed.length > 200) return fallback;
  return trimmed;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanPhone(value: unknown): string {
  return cleanString(value).replace(/[^\d+]/g, "");
}

const squareScriptPromises = new Map<string, Promise<void>>();

function loadSquareScriptOnce(src: string): Promise<void> {
  const existingPromise = squareScriptPromises.get(src);
  if (existingPromise) return existingPromise;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("square-js") as HTMLScriptElement | null;

    if (existing && (existing.dataset.src || existing.src) === src && existing.dataset.loaded === "1") {
      resolve();
      return;
    }

    if (existing && (existing.dataset.src || existing.src) !== src) {
      try {
        existing.remove();
      } catch {
        // ignore
      }
    }

    const script = document.createElement("script");
    script.id = "square-js";
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.src = src;
    script.dataset.loaded = "0";

    const onLoad = () => {
      script.dataset.loaded = "1";
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

  squareScriptPromises.set(src, promise);
  return promise;
}

async function waitForWindowSquare(maxMs = 10000): Promise<boolean> {
  const start = Date.now();
  while (!window.Square && Date.now() - start < maxMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return !!window.Square;
}

async function readJsonSafe(res: Response): Promise<any> {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text();

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: "We received an invalid response from the server." };
    }
  }

  return { success: false, message: "We received an unexpected response from the server." };
}

export default function SquarePaymentForm({
  amount,
  course_id,
  session_id,
  package_id,
  user,
  postal_code = "",
  country_code = "US",
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
  const initTokenRef = useRef(0);
  const mountedRef = useRef(false);

  const [initializing, setInitializing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState("");

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";
  const squareScriptSrc =
    process.env.NEXT_PUBLIC_SQUARE_SCRIPT_URL || "https://web.squarecdn.com/v1/square.js";

  const termsRequired = typeof agreeTerms === "boolean";
  const termsAgreed = termsRequired ? !!agreeTerms : true;

  const validateUser = () => {
    const required: (keyof User)[] = ["first_name", "last_name", "email", "mobile", "password"];
    for (const key of required) {
      if (!cleanString(user?.[key])) return false;
    }
    return true;
  };

  const validateCheckout = () => {
    if (!cleanString(course_id) || !cleanString(session_id) || !cleanString(package_id)) {
      return "Some checkout information is missing. Please return to the course page and try again.";
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return "The payment amount is invalid. Please return to the course page and try again.";
    }

    if (mode === "subscription" && (!isProduct(product) || !isCadence(cadence))) {
      return "The subscription details are invalid. Please reopen the checkout page.";
    }

    if (!validateUser()) {
      return "Please complete all required registration fields before continuing.";
    }

    if (!termsAgreed) {
      return "Please agree to the Terms & Conditions to continue.";
    }

    return "";
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
      if (!cancelled && mountedRef.current && initTokenRef.current === myToken) {
        fn();
      }
    };

    const cleanupCard = async () => {
      try {
        if (cardInstanceRef.current) {
          await cardInstanceRef.current.destroy();
          cardInstanceRef.current = null;
        }
      } catch {
        // ignore
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
        setSafe(() => {
          setMessage("Payment is currently unavailable. Please contact support.");
          setInitializing(false);
        });
        return;
      }

      try {
        await loadSquareScriptOnce(squareScriptSrc);

        const ready = await waitForWindowSquare();
        if (!ready) {
          setSafe(() => {
            setMessage("Unable to load the payment form. Please refresh the page and try again.");
            setInitializing(false);
          });
          return;
        }

        if (!cardContainerRef.current) {
          setSafe(() => {
            setMessage("Unable to display the payment form. Please refresh the page.");
            setInitializing(false);
          });
          return;
        }

        await cleanupCard();

        const payments = await window.Square!.payments(appId, locationId);
        const card = await payments.card();

        if (cancelled || initTokenRef.current !== myToken) {
          try {
            await card.destroy();
          } catch {
            // ignore
          }
          return;
        }

        await card.attach(cardContainerRef.current);
        cardInstanceRef.current = card;

        setSafe(() => setMessage(null));
      } catch (error) {
        console.error("Square init error:", error);
        setSafe(() => {
          setMessage("We could not initialize the payment form. Please refresh the page and try again.");
        });
      } finally {
        setSafe(() => setInitializing(false));
      }
    };

    init();

    return () => {
      cancelled = true;
      mountedRef.current = false;

      (async () => {
        try {
          if (cardInstanceRef.current) {
            await cardInstanceRef.current.destroy();
            cardInstanceRef.current = null;
          }
        } catch {
          // ignore
        }

        if (cardContainerRef.current) {
          cardContainerRef.current.innerHTML = "";
        }
      })();
    };
  }, [appId, locationId, squareScriptSrc]);

  const handlePayment = async () => {
    if (completed || paying) return;

    if (!cardInstanceRef.current) {
      setMessage("The payment form is not ready yet. Please wait a moment and try again.");
      return;
    }

    const checkoutError = validateCheckout();
    if (checkoutError) {
      setMessage(checkoutError);
      return;
    }

    setPaying(true);
    setMessage(null);

    const controller = new AbortController();

    try {
      const billingContact: Record<string, string> = {};

      const firstName = cleanString(user.first_name);
      const lastName = cleanString(user.last_name);
      const email = cleanString(user.email);
      const phone = cleanPhone(user.mobile);
      const postalCode = cleanString(postal_code);
      const countryCode = cleanString(country_code).toUpperCase();

      if (firstName) billingContact.givenName = firstName;
      if (lastName) billingContact.familyName = lastName;
      if (email) billingContact.email = email;
      if (phone) billingContact.phone = phone;
      if (postalCode) billingContact.postalCode = postalCode;
      if (countryCode) billingContact.countryCode = countryCode;

      // Store-card flow for backend Cards API CreateCard
      const verificationDetails = {
        billingContact,
        intent: "STORE" as const,
        customerInitiated: true,
        sellerKeyedIn: false,
      };

      const tokenizeResult = await cardInstanceRef.current.tokenize(verificationDetails);

      if (tokenizeResult?.status !== "OK") {
        const sqErr =
          tokenizeResult?.errors?.[0]?.message ||
          tokenizeResult?.errors?.[0]?.detail ||
          "Please check your card details and try again.";

        setMessage(
          safeMsg(sqErr, "We could not verify your card details. Please check them and try again.")
        );
        return;
      }

      const sourceId: string = String(tokenizeResult.token || "");
      if (!sourceId) {
        setMessage("We couldn't verify your payment method. Please refresh the page and try again.");
        return;
      }

      if (mode === "subscription") {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId,
            product,
            cadence,
            userEmail: email,
            userName: `${firstName} ${lastName}`.trim(),
            password: cleanString(user.password),
            mobile: phone,
            amount,
            course_id,
            session_id,
            package_id,
            postal_code: postalCode,
            country_code: countryCode || "US",
          }),
          signal: controller.signal,
        });

        const data = await readJsonSafe(res);

        if (!res.ok || !data?.success) {
          setMessage(
            safeMsg(
              data?.message || data?.error,
              "We could not create your subscription. Please try again."
            )
          );
          return;
        }

        const id = pickId(data);
        setCompleted(true);
        if (id) setPaymentId(id);
        onPaymentSuccess?.(id);
        setMessage("Subscription created successfully.");
        return;
      }

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          amount,
          course_id,
          session_id,
          package_id,
          user,
          postal_code: postalCode,
          country_code: countryCode || "US",
        }),
        signal: controller.signal,
      });

      const data = await readJsonSafe(res);

      if (!res.ok || !data?.success) {
        setMessage(
          safeMsg(data?.message || data?.error, "Your payment could not be completed. Please try again.")
        );
        return;
      }

      const id = pickId(data);
      setCompleted(true);
      if (id) setPaymentId(id);
      onPaymentSuccess?.(id);

      setMessage(
        data?.registrationSuccess
          ? "Payment and enrollment completed successfully."
          : "Payment completed successfully."
      );
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error("Square payment error:", error);
      setMessage("There was a problem processing your payment. Please try again.");
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
    (mode === "subscription" && (!isProduct(product) || !isCadence(cadence)));

  return (
    <div>
      <div
        ref={cardContainerRef}
        className="border p-3 rounded bg-white"
        style={{ minHeight: 56 }}
      />

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

          {!termsAgreed && (
            <div className="small text-muted mt-2">Please agree to enable the button.</div>
          )}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary-custom mt-4 px-5 py-2"
        onClick={handlePayment}
        disabled={uiDisabled}
      >
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