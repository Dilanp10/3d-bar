"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setWebglOk(hasWebGL());

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
        <model-viewer
          src={src}
          poster={poster}
          alt={alt}
          camera-controls=""
          auto-rotate=""
          auto-rotate-delay={3000}
          interaction-prompt="auto"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
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
      ) : null}
    </>
  );
}
