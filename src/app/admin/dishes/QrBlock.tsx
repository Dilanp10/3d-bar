"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateQrOnCanvas } from "@/lib/qr/generate";
import { dishMenuUrl } from "@/lib/qr/url";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function QrBlock({
  dishId,
  dishName,
  size = 256,
}: {
  dishId: string;
  dishName: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = useMemo(() => dishMenuUrl(dishId), [dishId]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    generateQrOnCanvas(canvasRef.current, url, size).catch((e) => {
      setError(e instanceof Error ? e.message : "No se pudo generar el QR");
    });
  }, [url, size]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `qr-${slugify(dishName) || dishId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, "image/png");
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg bg-white p-3">
        <canvas ref={canvasRef} className="block" />
      </div>
      {url && (
        <p className="text-xs text-foreground-dim break-all text-center">{url}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        onClick={download}
        className="rounded-lg bg-accent text-black font-medium px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
      >
        Descargar PNG
      </button>
    </div>
  );
}
