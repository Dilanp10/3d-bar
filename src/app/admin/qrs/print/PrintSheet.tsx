"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { generateQrOnCanvas } from "@/lib/qr/generate";
import { dishMenuUrl } from "@/lib/qr/url";

type Item = { id: string; name: string; priceLabel: string };

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 1cm; }
  body > div > nav,
  .no-print { display: none !important; }
  body > div > main {
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  html, body { background: #fff !important; color: #000 !important; }
  .qr-grid { gap: 0.6cm !important; }
  .qr-card { break-inside: avoid; page-break-inside: avoid; }
  .qr-card .qr-canvas-wrap { padding: 0 !important; }
  .qr-card .qr-name, .qr-card .qr-price { color: #000 !important; }
}
`;

export function PrintSheet({ items }: { items: Item[] }) {
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/dishes"
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            &larr; Volver a platos
          </Link>
          <h1 className="text-2xl font-semibold text-foreground mt-2">
            Hoja de QRs ({items.length} platos)
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Presioná el botón para imprimir a papel o guardar como PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-accent text-black font-medium px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
        >
          Imprimir
        </button>
      </div>

      <div className="qr-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <QrCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function QrCard({ item }: { item: Item }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    generateQrOnCanvas(canvasRef.current, dishMenuUrl(item.id), 512).catch(
      () => {},
    );
  }, [item.id]);

  return (
    <div className="qr-card rounded-lg border border-border p-3 flex flex-col items-center bg-background-elevated print:border-0 print:bg-white">
      <div className="qr-canvas-wrap bg-white p-2 rounded">
        <canvas ref={canvasRef} className="block w-full h-auto" />
      </div>
      <p className="qr-name text-sm font-medium text-foreground mt-2 text-center">
        {item.name}
      </p>
      <p className="qr-price text-xs text-foreground-muted">{item.priceLabel}</p>
    </div>
  );
}
