"use client";

import { useEffect } from "react";

export function TrackView({ dishId }: { dishId: string }) {
  useEffect(() => {
    if (typeof document !== "undefined" && document.referrer.includes("/admin/")) {
      return;
    }
    fetch("/api/track-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dishId }),
      keepalive: true,
    }).catch(() => {});
  }, [dishId]);

  return null;
}
