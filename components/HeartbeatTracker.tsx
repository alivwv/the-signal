"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fires a heartbeat every 30s while:
//   1. Pathname is /courses/[slug] or /lessons/[id]
//   2. Tab is visible (document.visibilityState === 'visible')
// Each tick re-checks visibility, so hidden tabs no-op without tearing down
// the interval. No retries on failure — analytics tolerate gaps.

const PING_INTERVAL_MS = 30_000;

export function HeartbeatTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let payload: { courseSlug?: string; lessonId?: string } | null = null;
    const courseMatch = pathname.match(/^\/courses\/([^/]+)/);
    const lessonMatch = pathname.match(/^\/lessons\/([^/]+)/);
    if (lessonMatch) payload = { lessonId: lessonMatch[1] };
    else if (courseMatch) payload = { courseSlug: courseMatch[1] };
    if (!payload) return;

    const sent = payload;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sent),
        keepalive: true,
      }).catch(() => {
        // intentionally silent — drop dropped pings
      });
    };

    const interval = setInterval(tick, PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
