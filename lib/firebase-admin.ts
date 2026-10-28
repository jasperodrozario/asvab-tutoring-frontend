import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function firebaseAdminAuth() {
  const existing = getApps().find((app) => app.name === "asvab-google");
  if (existing) return getAuth(existing);

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey?.trim()) {
    throw new Error("Firebase Admin credentials are not configured");
  }

  return getAuth(initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  }, "asvab-google"));
}
