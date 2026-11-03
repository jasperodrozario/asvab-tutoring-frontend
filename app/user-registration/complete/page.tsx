import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { getAppleOnboardingIdentity, getGoogleOnboardingToken } from "@/lib/google-onboarding";
import { verifyGoogleIdentity } from "@/lib/google-identity";
import CompleteGoogleRegistration from "./CompleteGoogleRegistration";

export const metadata: Metadata = {
  title: "Complete Your Account | ASVAB Tutoring",
  robots: { index: false, follow: false },
};

export default async function CompleteAccountPage() {
  if (await getSession()) redirect("/");
  const apple = await getAppleOnboardingIdentity();
  if (apple) {
    return <CompleteGoogleRegistration provider="apple" email={apple.email} firstName={apple.first_name} />;
  }
  const token = await getGoogleOnboardingToken();
  const identity = token ? await verifyGoogleIdentity(token).catch(() => null) : null;
  if (!identity) {
    return (
      <section className="container py-5 text-center">
        <h1 className="h3">Please sign in again</h1>
        <p>Your account setup session has expired. Restart Google or Apple sign-in to continue.</p>
        <Link href="/user-registration" className="btn btn-primary">Back to registration</Link>
      </section>
    );
  }
  return <CompleteGoogleRegistration email={identity.email} firstName={identity.first_name} />;
}
