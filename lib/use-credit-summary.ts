"use client";

import { useEffect, useState } from "react";
import type { CreditSummary } from "./spending";

// Loads the credits line, and again whenever `refreshKey` changes (for
// example after a try-on finishes).
export function useCreditSummary(refreshKey: unknown) {
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/credits", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<CreditSummary>) : null))
      .then((data) => {
        if (!cancelled && data) setSummary(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);
  return summary;
}
