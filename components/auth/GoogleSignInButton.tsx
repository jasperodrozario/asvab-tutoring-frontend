"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { resolvePortalLoginUrl } from "@/lib/portal-login";
import styles from "./LegalLinks.module.css";

export default function GoogleSignInButton({
  intent = "login",
  disabled = false,
  dividerPosition = "before",
  onBusyChange,
}: {
  intent?: "login" | "register";
  disabled?: boolean;
  dividerPosition?: "before" | "after";
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function signIn() {
    if (disabled || inFlight.current) return;
    setError("");
    inFlight.current = true;
    setBusy(true);
    onBusyChange?.(true);
    let redirecting = false;
    try {
      const { googleIdToken } = await import("@/lib/firebase-client");
      const idToken = await googleIdToken();
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, intent }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Google sign-in failed. Please try again.");
      }
      // Reload the destination so the existing AuthProvider reads the new session.
      redirecting = true;
      window.location.href = result.needsOnboarding
        ? "/user-registration/complete"
        : result.paidUser ? resolvePortalLoginUrl(result.portalUrl) : "/";
    } catch (cause) {
      const code = (cause as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setError(code === "auth/popup-blocked"
        ? "Please allow pop-ups in your browser and try Google sign-in again."
        : code
          ? "Google sign-in is unavailable right now. Please try again or use email and password."
          : cause instanceof Error ? cause.message : "Google sign-in failed. Please try again.");
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
      {dividerPosition === "before" && (
        <div className="d-flex align-items-center gap-3 my-3 text-muted small" aria-hidden="true">
          <hr className="flex-grow-1 my-0" />or<hr className="flex-grow-1 my-0" />
        </div>
      )}
      <button
        type="button"
        className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
        style={{ borderRadius: 12, padding: "12px 14px", background: "white", color: "#002341" }}
        disabled={disabled || busy}
        aria-busy={busy}
        onClick={() => void signIn()}
      >
        <FcGoogle size={22} aria-hidden="true" />
        {busy ? "Connecting to Google..." : "Continue with Google"}
      </button>
      {intent === "register" && (
        <p className={`${styles.legalLinks} small text-muted text-center mt-2 mb-0`}>
          By continuing, you agree to our <Link href="/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</Link>
          {" and "}<Link href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</Link>.
        </p>
      )}
      {dividerPosition === "after" && (
        <div className="d-flex align-items-center gap-3 my-3 text-muted small" aria-hidden="true">
          <hr className="flex-grow-1 my-0" />or use email<hr className="flex-grow-1 my-0" />
        </div>
      )}
      {error && <div className="alert alert-danger mt-2 mb-0" role="alert">{error}</div>}
    </div>
  );
}
