"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { BsCheckCircleFill } from "react-icons/bs";
import { sanitizeMobileInput, validateRegistrationMobile } from "@/lib/sanitize-mobile-input";
import { resolvePortalLoginUrl } from "@/lib/portal-login";

export default function CompleteGoogleRegistration({ email, firstName }: { email: string; firstName: string }) {
  const [mobile, setMobile] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const inFlight = useRef(false);

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || expired) return;
    const mobileError = validateRegistrationMobile(mobile);
    if (mobileError || !agree) {
      setError(mobileError || "Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    setError("");
    setBusy(true);
    inFlight.current = true;
    let redirecting = false;
    try {
      const response = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, termsAccepted: agree }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (result.expired) setExpired(true);
        throw new Error(result.message || "Unable to complete registration. Please try again.");
      }
      redirecting = true;
      window.location.href = result.paidUser ? resolvePortalLoginUrl(result.portalUrl) : "/";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect. Please try again.");
    } finally {
      if (!redirecting) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }

  async function cancel() {
    if (inFlight.current) return;
    inFlight.current = true;
    setCancelling(true);
    try {
      const response = await fetch("/api/auth/google/complete", { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to restart. Please try again.");
      window.location.href = "/user-registration";
    } catch {
      setError("Unable to restart. Please try again.");
      inFlight.current = false;
      setCancelling(false);
    }
  }

  return (
    <section className="py-5" style={{ background: "linear-gradient(135deg, rgba(242,161,85,0.12), rgba(0,35,65,0.08))", minHeight: "calc(100vh - 80px)" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16, overflow: "hidden" }}>
              <div className="p-4" style={{ background: "#002341", color: "white" }}>
                <h1 className="h3 mb-2 fw-bold">Almost done{firstName ? `, ${firstName}` : ""}!</h1>
                <p className="mb-0">We just need a couple more details to finish setting up your account.</p>
              </div>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 p-3 mb-4 rounded-3 border bg-light">
                  <FcGoogle size={28} aria-hidden="true" className="flex-shrink-0" />
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="small text-muted">Signed in via Google</div>
                    <div className="fw-semibold text-break">{email}</div>
                  </div>
                  <BsCheckCircleFill className="text-success flex-shrink-0" aria-label="Verified Google account" />
                </div>
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                <form onSubmit={(event) => void complete(event)}>
                  <label htmlFor="googleMobile" className="form-label fw-semibold">Mobile number <span aria-hidden="true">*</span></label>
                  <div className="input-group mb-2">
                    <span className="input-group-text">US +1</span>
                    <input id="googleMobile" type="tel" className="form-control" autoComplete="tel-national" inputMode="numeric"
                      placeholder="10-digit mobile number" value={mobile} required disabled={busy || cancelling || expired}
                      aria-describedby="googleMobileHelp"
                      onChange={(event) => {
                        const next = sanitizeMobileInput(event.target.value, mobile);
                        if (next !== null) setMobile(next);
                        setError("");
                      }} />
                  </div>
                  <p id="googleMobileHelp" className="small text-muted mb-4">Enter your 10-digit US mobile number without the country code.</p>
                  <div className="form-check mb-4">
                    <input id="googleCompleteAgree" type="checkbox" className="form-check-input" checked={agree} required
                      disabled={busy || cancelling || expired} onChange={(event) => setAgree(event.target.checked)} />
                    <label htmlFor="googleCompleteAgree" className="form-check-label small">
                      I agree to the <Link href="/terms-of-service" target="_blank" rel="noreferrer">Terms &amp; Conditions</Link>
                      {" and "}<Link href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</Link>.
                    </label>
                  </div>
                  <button type="submit" className="btn w-100 fw-bold" disabled={busy || cancelling || expired}
                    style={{ background: "#f2a155", color: "#002341", borderRadius: 12, padding: "12px 14px" }}>
                    {busy ? "Creating your account..." : "Complete Registration"}
                  </button>
                </form>
                <button type="button" className="btn btn-link w-100 mt-2 small" disabled={busy || cancelling} onClick={() => void cancel()}>
                  {cancelling ? "Returning..." : "Use a different account or go back"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
