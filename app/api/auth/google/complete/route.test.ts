import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/google-onboarding", () => ({
  getGoogleOnboardingToken: vi.fn().mockResolvedValue("google-token"),
  clearGoogleOnboarding: vi.fn(),
}));
vi.mock("@/lib/google-identity", () => ({ verifyGoogleIdentity: vi.fn() }));
vi.mock("@/lib/auth-php", () => ({ phpFirebaseSocialLogin: vi.fn() }));
vi.mock("@/lib/auth-session", () => ({ setSession: vi.fn() }));

import { verifyGoogleIdentity } from "@/lib/google-identity";
import { phpFirebaseSocialLogin } from "@/lib/auth-php";
import { POST } from "./route";

function request(name?: unknown) {
  return new NextRequest("https://example.com/api/auth/google/complete", {
    method: "POST",
    body: JSON.stringify({ mobile: "2025550123", termsAccepted: true, name }),
  });
}

describe("Google registration name fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyGoogleIdentity).mockResolvedValue({
      provider: "google", id_token: "google-token", firebase_uid: "uid",
      provider_subject: "subject", email: "student@example.com", first_name: "", last_name: "",
    });
    vi.mocked(phpFirebaseSocialLogin).mockResolvedValue({ ok: false, status: 502, message: "Backend unavailable" });
  });

  it("passes the entered name to registration when Google has no name", async () => {
    await POST(request("  Alex   Morgan Smith  "));
    expect(phpFirebaseSocialLogin).toHaveBeenCalledWith(expect.objectContaining({
      first_name: "Alex", last_name: "Morgan Smith", email: "student@example.com", intent: "register",
    }));
  });

  it.each([undefined, "", "   ", 123])("rejects a missing or invalid name (%s) before registration", async (name) => {
    const response = await POST(request(name));
    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("Please enter your full name.");
    expect(phpFirebaseSocialLogin).not.toHaveBeenCalled();
  });

  it("keeps the Google name even when browser name fields are supplied", async () => {
    const identity = await verifyGoogleIdentity("google-token");
    vi.mocked(verifyGoogleIdentity).mockResolvedValue({ ...identity, first_name: "Google", last_name: "Name" });
    await POST(request("Different Name"));
    expect(phpFirebaseSocialLogin).toHaveBeenCalledWith(expect.objectContaining({ first_name: "Google", last_name: "Name" }));
  });
});
