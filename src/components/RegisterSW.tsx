"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // no molestar en dev

    const handler = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((e) => console.warn("SW register failed", e));
    };
    if (document.readyState === "complete") handler();
    else window.addEventListener("load", handler, { once: true });
    return () => window.removeEventListener("load", handler);
  }, []);

  return null;
}
