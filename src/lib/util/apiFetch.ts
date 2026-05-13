// src/lib/util/apiFetch.ts
import { auth } from "@/lib/firebase/firebase";

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {

  // 1. Get a FORCE-refreshed ID token from Firebase.
  //    true = always fetch a fresh token from Firebase servers,
  //    guaranteeing the cookie will be valid when the API route checks it.
  const currentUser = auth.currentUser;
  if (currentUser) {
    let freshToken: string;
    try {
      freshToken = await currentUser.getIdToken(true); // ✅ true = force refresh
    } catch (err) {
      // Token refresh failed (user revoked, network error, etc.) — bail out early
      console.error("[apiFetch] Failed to refresh ID token:", err);
      await auth.signOut();
      window.location.href = "/login";
      // Return a dummy Response so TypeScript is satisfied; redirect handles it
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
      });
    }

    // 2. Sync the fresh token into the session cookie BEFORE calling the API.
    //    If this fails, we stop — calling the API with a stale cookie would 401 anyway.
    const sessionRes = await fetch("/api/auth/session", {
      method: "POST",
      credentials: "include", // ✅ ensures Set-Cookie is accepted by the browser
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: freshToken }),
    });

    if (!sessionRes.ok) {
      console.error(
        "[apiFetch] Failed to sync session cookie:",
        sessionRes.status,
        await sessionRes.text().catch(() => "")
      );
      await auth.signOut();
      window.location.href = "/login";
      return new Response(JSON.stringify({ error: "Session sync failed" }), {
        status: 401,
      });
    }
  }

  // 3. Make the actual API call — send cookies with every request
  const res = await fetch(url, {
    ...options,
    credentials: "include", // ✅ critical: browser must send auth-token cookie
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // 4. If still 401, session is dead on the server side — redirect to login
  if (res.status === 401) {
    console.warn("[apiFetch] 401 after token refresh — signing out.");
    await auth.signOut();
    window.location.href = "/login";
  }

  return res;
}