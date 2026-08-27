// Genera los PNG de la PWA a partir de los SVG de public/icons.
// Uso: node scripts/gen-icons.mjs
// Requiere `sharp` (ya presente como dependencia transitiva).
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICONS = join(ROOT, "public", "icons");

const JOBS = [
  { svg: "icon-512.svg", png: "icon-192.png", size: 192 },
  { svg: "icon-512.svg", png: "icon-512.png", size: 512 },
  { svg: "icon-maskable-512.svg", png: "icon-maskable-512.png", size: 512 },
];

for (const job of JOBS) {
  const svg = await readFile(join(ICONS, job.svg));
  await sharp(svg, { density: 384 })
    .resize(job.size, job.size)
    .png()
    .toFile(join(ICONS, job.png));
  console.log(`✓ ${job.png} (${job.size}x${job.size})`);
}
