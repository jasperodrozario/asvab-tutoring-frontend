"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, inMemoryPersistence, setPersistence, signInWithPopup, signOut } from "firebase/auth";

// Fill these environment variables with your Firebase web app configuration.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export async function googleIdToken(): Promise<string> {
  if (Object.values(firebaseConfig).some((value) => !value.trim())) {
    throw new Error("Google sign-in is not configured yet. Please use email and password.");
  }
  const app = getApps().find((app) => app.name === "asvab-google") || initializeApp(firebaseConfig, "asvab-google");
  const auth = getAuth(app);
  // The existing HTTP-only app cookie owns the session; don't persist a second login.
  await setPersistence(auth, inMemoryPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(auth, provider);
    return await result.user.getIdToken();
  } finally {
    await signOut(auth);
  }
}
