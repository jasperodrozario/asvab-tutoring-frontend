import { firebaseAdminAuth } from "@/lib/firebase-admin";

/** Always derive account identity from the verified token, never browser fields. */
export async function verifyGoogleIdentity(idToken: string) {
  const identity = await firebaseAdminAuth().verifyIdToken(idToken, true);
  const subject = identity.firebase.identities?.["google.com"]?.[0];
  if (identity.firebase.sign_in_provider !== "google.com" || !identity.email_verified ||
      !identity.email || typeof subject !== "string" || !subject) {
    throw Object.assign(new Error("A verified Google account is required."), { code: "auth/invalid-id-token" });
  }
  const [firstName = "", ...lastName] = String(identity.name || "").trim().split(/\s+/);
  return {
    provider: "google" as const,
    id_token: idToken,
    firebase_uid: identity.uid,
    provider_subject: subject,
    email: identity.email.toLowerCase(),
    first_name: firstName,
    last_name: lastName.join(" "),
  };
}
