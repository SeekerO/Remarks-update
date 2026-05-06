import { useState, useEffect, useRef } from "react";

export type HealthStatus =
  | "checking"
  | "online"
  | "offline"
  | "auth_error"
  | "unconfigured";

export function useProviderHealth(enabled: boolean) {
  const [health, setHealth] = useState<Record<string, HealthStatus>>({});
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      fetchedRef.current = false; // ← reset when panel closes
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    setHealth({
      groq: "checking",
      google: "checking",
      openrouter: "checking",
      cerebras: "checking",
    });
    fetch("/api/health-check", {
      headers: {
        "x-health-secret": process.env.NEXT_PUBLIC_HEALTH_SECRET ?? "",
      },
    })
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() =>
        setHealth({
          groq: "offline",
          google: "offline",
          openrouter: "offline",
          cerebras: "offline",
        }),
      );
  }, [enabled]);

  return health;
}
