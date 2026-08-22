import QRCode from "qrcode";

const BASE_OPTS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: { dark: "#000000", light: "#ffffff" },
};

export async function generateQrDataUrl(text: string, size = 512): Promise<string> {
  return QRCode.toDataURL(text, { ...BASE_OPTS, width: size });
}

export async function generateQrOnCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  size = 512,
): Promise<void> {
  await QRCode.toCanvas(canvas, text, { ...BASE_OPTS, width: size });
}
