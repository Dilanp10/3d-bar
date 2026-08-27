"use client";

import { useEffect } from "react";

export function TrackView({ dishId }: { dishId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Señal explícita: los links de preview del admin llevan ?preview=1.
    // Determinístico, no depende del referrer (que a veces llega vacío).
    if (new URLSearchParams(window.location.search).get("preview") === "1") {
      return;
    }
    // Red secundaria: si igual venís navegando desde el admin, no contar.
    if (document.referrer.includes("/admin/")) {
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
