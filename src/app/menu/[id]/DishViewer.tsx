"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  src: string;
  poster?: string;
  alt: string;
};

function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

export function DishViewer({ src, poster, alt }: Props) {
  const [ready, setReady] = useState(false);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [canAR, setCanAR] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Detección client-only (WebGL / UA): no puede correr en SSR, así que el
    // setState dentro del efecto es intencional y correcto acá.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebglOk(hasWebGL());
    setIsAndroid(/android/i.test(navigator.userAgent));

    if (customElements.get("model-viewer")) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "/model-viewer.min.js";
    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setShowHint(true), 700);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const el = viewerRef.current;
    if (!el) return;
    // Solo pointerdown: camera-change también dispara con auto-rotate (no es
    // interacción real del usuario), lo que ocultaba el hint sin que nadie tocara nada.
    const hide = () => setShowHint(false);
    el.addEventListener("pointerdown", hide, { once: true });

    // canActivateAR se resuelve en paralelo al decode/render WebGL del modelo
    // (probing de WebXR/scene-viewer), así que recién arrancamos a chequearlo
    // después de "load" — evita 250ms-ticks compitiendo con el momento más
    // pesado (carga del .glb) en cada visita.
    let iv: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (iv) return;
      let ticks = 0;
      iv = setInterval(() => {
        ticks += 1;
        const v = el as unknown as { canActivateAR?: boolean };
        if (v.canActivateAR) {
          setCanAR(true);
          if (iv) clearInterval(iv);
        } else if (ticks > 40) {
          // 40 * 250ms = 10s, damos por perdido
          if (iv) clearInterval(iv);
        }
      }, 250);
    };

    const onLoad = () => startPolling();
    el.addEventListener("load", onLoad);
    // Por si "load" ya disparó antes de que este efecto se enganche.
    if ((el as unknown as { loaded?: boolean }).loaded) startPolling();

    return () => {
      el.removeEventListener("pointerdown", hide);
      el.removeEventListener("load", onLoad);
      if (iv) clearInterval(iv);
    };
  }, [ready]);

  const activateAR = () => {
    const el = viewerRef.current as unknown as { activateAR?: () => void } | null;
    el?.activateAR?.();
  };

  // En Android lanzamos Scene Viewer con un intent URL. El `package` es
  // obligatorio: sin él Android resuelve el VIEW+https contra los navegadores,
  // el intent no matchea nada y Chrome cae al browser_fallback_url en silencio.
  const openSceneViewer = () => {
    const modelUrl = new URL(src, window.location.href).href;
    const fallback = window.location.href;
    const intent =
      `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
        modelUrl,
      )}&mode=ar_preferred&resizable=false&title=${encodeURIComponent(alt)}` +
      `#Intent;scheme=https;` +
      `package=com.google.android.googlequicksearchbox;` +
      `action=android.intent.action.VIEW;` +
      `S.browser_fallback_url=${encodeURIComponent(fallback)};end;`;
    window.location.href = intent;
  };

  const handleAR = () => {
    if (isAndroid) {
      openSceneViewer();
    } else {
      activateAR();
    }
  };

  if (webglOk === false) {
    return (
      <div className="absolute inset-0">
        {poster ? (
          <Image
            src={poster}
            alt={alt}
            fill
            sizes="(min-width: 640px) 100vw, 100vw"
            className="object-cover"
            priority
          />
        ) : null}
        <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/60 backdrop-blur border border-border-strong px-4 py-3 text-sm text-foreground-muted">
          Tu navegador no soporta 3D. Mostrando foto del plato.
        </div>
      </div>
    );
  }

  return (
    <>
      {!ready && poster ? (
        <div className="absolute inset-0">
          <Image
            src={poster}
            alt={alt}
            fill
            sizes="(min-width: 640px) 100vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : null}
      {ready ? (
        <>
          <model-viewer
            ref={viewerRef as never}
            src={src}
            poster={poster}
            alt={alt}
            camera-controls=""
            auto-rotate=""
            auto-rotate-delay={3000}
            interaction-prompt="auto"
            ar=""
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            ar-placement="floor"
            shadow-intensity="1"
            exposure="1"
            loading="eager"
            reveal="auto"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
            }}
          />
          {canAR || isAndroid ? (
            <button
              type="button"
              onClick={handleAR}
              className="absolute left-1/2 bottom-4 -translate-x-1/2 z-10 inline-flex items-center gap-2 rounded-full bg-accent text-black font-semibold px-5 py-3 text-sm shadow-lg shadow-accent/30 hover:bg-accent-hover hover:scale-105 transition-all active:scale-95"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 7l9-4 9 4-9 4-9-4z" />
                <path d="M3 7v10l9 4 9-4V7" />
                <path d="M12 11v10" />
              </svg>
              Ver en tu mesa
            </button>
          ) : null}
          <div
            aria-hidden
            className={`pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur border border-accent/30 px-4 py-2 text-xs text-accent transition-opacity duration-500 ${
              showHint ? "opacity-100 drag-hint-appear" : "opacity-0"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drag-hint-swipe"
            >
              <path d="M9 11V6a2 2 0 0 1 4 0v5" />
              <path d="M13 11V4a2 2 0 0 1 4 0v9" />
              <path d="M17 11V6a2 2 0 0 1 4 0v10a6 6 0 0 1-6 6h-3a6 6 0 0 1-5.2-3l-3.3-5.7a2 2 0 0 1 3.4-2L9 15V4a2 2 0 0 1 4 0" />
            </svg>
            Deslizá para girar el plato
          </div>

        </>
      ) : null}
    </>
  );
}
