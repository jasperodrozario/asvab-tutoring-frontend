"use client";

import { useEffect, useRef, useState } from "react";
import { BsApple } from "react-icons/bs";
import { resolvePortalLoginUrl } from "@/lib/portal-login";

const APPLE_SERVICES_ID = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID?.trim() || "";
const APPLE_SDK_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

type AppleSignInResponse = {
  authorization?: { id_token?: string };
  user?: { name?: { firstName?: string; lastName?: string } };
};

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<AppleSignInResponse>;
      };
    };
  }
}

let sdkPromise: Promise<void> | null = null;

function loadAppleSdk(): Promise<void> {
  if (window.AppleID) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = APPLE_SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error("Apple sign-in failed to load. Please try again."));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

/** "Continue with Apple": the same Apple ID as the iOS apps reaches the same account. */
export default function AppleSignInButton({
  disabled = false,
  onBusyChange,
}: {
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  useEffect(() => {
    if (APPLE_SERVICES_ID) loadAppleSdk().catch(() => {});
  }, []);

  if (!APPLE_SERVICES_ID) return null;

  async function signIn() {
    if (disabled || inFlight.current) return;
    setError("");
    inFlight.current = true;
    setBusy(true);
    onBusyChange?.(true);
    let redirecting = false;
    try {
      await loadAppleSdk();
      const nonceResponse = await fetch("/api/auth/apple", { cache: "no-store" });
      const { nonce } = await nonceResponse.json();
      window.AppleID!.auth.init({
        clientId: APPLE_SERVICES_ID,
        scope: "name email",
        redirectURI: `${window.location.origin}/user-login`,
        nonce,
        usePopup: true,
      });

      let apple: AppleSignInResponse;
      try {
        apple = await window.AppleID!.auth.signIn();
      } catch (cause) {
        // Closing the Apple window is not an error worth showing.
        const code = (cause as { error?: string })?.error || "";
        if (code === "popup_closed_by_user" || code === "user_cancelled_authorize") return;
        throw new Error(code === "popup_blocked_by_browser"
          ? "Please allow pop-ups in your browser and try Apple sign-in again."
          : "Apple sign-in didn't complete. Please try again.");
      }

      const response = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: apple.authorization?.id_token || "",
          firstName: apple.user?.name?.firstName || "",
          lastName: apple.user?.name?.lastName || "",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Apple sign-in failed. Please try again.");
      }
      // Reload the destination so the existing AuthProvider reads the new session.
      redirecting = true;
      window.location.href = result.needsOnboarding
        ? "/user-registration/complete"
        : result.paidUser ? resolvePortalLoginUrl(result.portalUrl) : "/";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Apple sign-in failed. Please try again.");
    } finally {
      if (!redirecting) {
        inFlight.current = false;
        setBusy(false);
        onBusyChange?.(false);
      }
    }
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
        style={{ borderRadius: 12, padding: "12px 14px", background: "white", color: "#002341" }}
        disabled={disabled || busy}
        aria-busy={busy}
        onClick={() => void signIn()}
      >
        <BsApple size={22} color="#000" aria-hidden="true" />
        {busy ? "Connecting to Apple..." : "Continue with Apple"}
      </button>
      {error && <div className="alert alert-danger mt-2 mb-0" role="alert">{error}</div>}
    </div>
  );
}
