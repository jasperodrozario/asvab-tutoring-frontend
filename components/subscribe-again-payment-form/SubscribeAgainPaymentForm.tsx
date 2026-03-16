"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<any> | any;
    };
  }
}

type Props = {
  amount: number; // cents
  course_id: string;

  user_id: string;
  auth_token: string;

  plan_variation_id: string;
  return_url: string;

  disabled?: boolean;

  agreeTerms?: boolean;
  onAgreeTermsChange?: (next: boolean) => void;

  onSuccess?: (subscriptionId?: string) => void;
  onError?: (message: string) => void;
};

const squareScriptPromises = new Map<string, Promise<void>>();

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeMsg(value: unknown, fallback = "Something went wrong. Please try again.") {
  const s = cleanString(value);
  if (!s || s.length > 200) return fallback;
  return s;
}

function mask(v: string, a = 6, b = 4) {
  const str = String(v || "");
  if (!str) return "";
  if (str.length <= a + b) return "*".repeat(str.length);
  return `${str.slice(0, a)}***${str.slice(-b)}`;
}

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
      return { ok: false, message: "We received an invalid response from the server." };
    }
  }

  return { ok: false, message: "We received an unexpected response from the server." };
}

function pickSubscriptionId(data: any): string {
  return (
    cleanString(data?.subscription_id) ||
    cleanString(data?.subscriptionId) ||
    cleanString(data?.id)
  );
}

export default function SubscribeAgainPaymentForm({
  amount,
  course_id,
  user_id,
  auth_token,
  plan_variation_id,
  return_url,
  disabled = false,
  agreeTerms,
  onAgreeTermsChange,
  onSuccess,
  onError,
}: Props) {
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const cardInstanceRef = useRef<any>(null);
  const initTokenRef = useRef(0);
  const mountedRef = useRef(false);

  const [initializing, setInitializing] = useState(true);
  const [paying, setPaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState("");

  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";
  const squareScriptSrc =
    process.env.NEXT_PUBLIC_SQUARE_SCRIPT_URL ||
    (appId.startsWith("sandbox-")
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js");

  const displayAmount = useMemo(() => (Number(amount || 0) / 100).toFixed(2), [amount]);

  const termsRequired = typeof agreeTerms === "boolean";
  const termsAgreed = termsRequired ? !!agreeTerms : true;

  const missingInfo = useMemo(() => {
    if (!cleanString(auth_token)) return "Missing auth token.";
    if (!cleanString(user_id)) return "Missing user id.";
    if (!cleanString(course_id)) return "Missing course id.";
    if (!cleanString(plan_variation_id)) return "Missing plan variation id.";
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return "Invalid amount.";
    return "";
  }, [auth_token, user_id, course_id, plan_variation_id, amount]);

  const canSubmit = useMemo(() => {
    return !disabled && !completed && !initializing && !paying && termsAgreed && !missingInfo;
  }, [disabled, completed, initializing, paying, termsAgreed, missingInfo]);

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
          setMessage("Payment is not configured correctly.");
          setInitializing(false);
        });
        return;
      }

      try {
        await loadSquareScriptOnce(squareScriptSrc);

        const ready = await waitForWindowSquare(10000);
        if (!ready) {
          setSafe(() => {
            setMessage("Unable to load the payment form. Please refresh the page and try again.");
            setInitializing(false);
          });
          return;
        }

        if (!cardContainerRef.current) {
          setSafe(() => {
            setMessage("Card container not found.");
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

        if (!cleanString(plan_variation_id)) {
          setSafe(() => setMessage("This package is not linked to a Square plan yet."));
        } else {
          setSafe(() => setMessage(null));
        }
      } catch (error: any) {
        console.error("Square init error:", error);
        setSafe(() => {
          setMessage(
            safeMsg(error?.message, "We could not initialize the payment form. Please refresh the page and try again.")
          );
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
  }, [appId, locationId, squareScriptSrc, plan_variation_id]);

  const handleSubscribe = async () => {
    if (!canSubmit) {
      const msg =
        missingInfo ||
        (termsRequired && !termsAgreed ? "Please agree to the terms to continue." : "");

      if (msg) {
        setMessage(msg);
        onError?.(msg);
      }
      return;
    }

    if (!cardInstanceRef.current) {
      const msg = "Payment form not ready. Please refresh the page.";
      setMessage(msg);
      onError?.(msg);
      return;
    }

    setPaying(true);
    setMessage(null);

    try {
      const tokenizeResult = await cardInstanceRef.current.tokenize();

      if (tokenizeResult?.status !== "OK") {
        const msg = safeMsg(
          tokenizeResult?.errors?.[0]?.message || tokenizeResult?.errors?.[0]?.detail,
          "Card details could not be verified. Please try again."
        );
        setMessage(msg);
        onError?.(msg);
        return;
      }

      const sourceId = cleanString(tokenizeResult?.token);
      if (!sourceId) {
        const msg = "We couldn't verify your payment method. Please refresh the page and try again.";
        setMessage(msg);
        onError?.(msg);
        return;
      }

      console.log("subscribe-again request", {
        user_id,
        course_id,
        plan_variation_id: mask(plan_variation_id),
        amount,
        sourceId: mask(sourceId),
        auth_token: mask(auth_token),
      });

      const res = await fetch("/api/subscribe-again", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          sourceId,
          auth_token: cleanString(auth_token),
          user_id: cleanString(user_id),
          course_id: cleanString(course_id),
          plan_variation_id: cleanString(plan_variation_id),
          amount,
          return_url: cleanString(return_url),
        }),
      });

      const data = await readJsonSafe(res);

      console.log("subscribe-again response", {
        http_ok: res.ok,
        status: res.status,
        data,
      });

      if (!res.ok || !data?.ok) {
        const msg = safeMsg(data?.message || data?.error, "Subscription failed. Please try again.");
        setMessage(msg);
        onError?.(msg);
        return;
      }

      const id = pickSubscriptionId(data);

      setCompleted(true);
      if (id) {
        setSubscriptionId(id);
      }

      onSuccess?.(id || undefined);
      setMessage("Subscription created successfully.");

      const back = cleanString(data?.back_to_portal) || cleanString(return_url);
      if (back) {
        window.location.href = back;
      }
    } catch (error: any) {
      console.error("Subscribe-again error:", error);
      const msg = safeMsg(error?.message, "Error while processing payment.");
      setMessage(msg);
      onError?.(msg);
    } finally {
      setPaying(false);
    }
  };

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
              disabled={paying || disabled || completed}
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

      <div className="mt-4 d-flex align-items-center gap-3">
        <button
          type="button"
          className="btn btn-primary-custom px-5 py-2"
          onClick={handleSubscribe}
          disabled={!canSubmit}
        >
          {completed
            ? "Subscribed"
            : initializing
            ? "Loading…"
            : paying
            ? "Processing…"
            : `Subscribe $${displayAmount}`}
        </button>

        {completed && subscriptionId && (
          <div className="small text-muted">
            <span className="fw-semibold">Subscription ID:</span> {subscriptionId}
          </div>
        )}
      </div>

      {missingInfo && !message && (
        <p className="mt-3 fw-bold" style={{ color: "#8a5a00" }}>
          {missingInfo}
        </p>
      )}

      {message && <p className="mt-3 fw-bold">{message}</p>}
    </div>
  );
}