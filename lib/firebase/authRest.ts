import "server-only";

export function firebaseAuthEnabled() {
  return process.env.FIREBASE_AUTH_ENABLED?.toLowerCase() === "true";
}

export async function verifyFirebasePassword(email: string, password: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is required when Firebase Authentication is enabled.");
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      cache: "no-store",
    },
  );
  if (!response.ok) return null;
  const result = (await response.json()) as { localId?: string; email?: string; idToken?: string };
  if (!result.localId || !result.email || !result.idToken) return null;
  return { uid: result.localId, email: result.email.toLowerCase() };
}
