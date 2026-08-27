import { Document, Texture, WebIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { draco } from "@gltf-transform/functions";

export type OptimizeResult = {
  file: File;
  originalSize: number;
  optimizedSize: number;
};

export class GlbOptimizeError extends Error {}

const MAX_TEXTURE_SIZE = 2048;
const WEBP_QUALITY = 0.75;

// draco3d se distribuye como un build Node+browser combinado, pero su glue
// JS solo exporta vía CommonJS (module.exports) sin fallback de global de
// browser, y contiene un `require("fs")` estático dentro de una rama que
// solo corre en Node — Turbopack igual intenta resolverlo al bundlear y
// falla ("Can't resolve 'fs'"), aunque esa rama nunca se ejecute en el
// browser. Por eso lo servimos como texto plano desde /public y lo evaluamos
// nosotros con un shim mínimo de CommonJS: así nunca entra al grafo de
// módulos del bundler.
async function loadCjsModuleFromPublic<T>(path: string): Promise<T> {
  const code = await fetch(path).then((r) => r.text());
  const mod = { exports: {} as T };
  const fn = new Function("module", "exports", code);
  fn(mod, mod.exports);
  return mod.exports;
}

async function loadDracoModules() {
  type DracoFactory = (opts: {
    wasmBinary: ArrayBuffer;
  }) => Promise<unknown>;

  const [createEncoderModule, createDecoderModule] = await Promise.all([
    loadCjsModuleFromPublic<DracoFactory>("/draco/draco_encoder.js"),
    loadCjsModuleFromPublic<DracoFactory>("/draco/draco_decoder.js"),
  ]);

  const [encoderWasm, decoderWasm] = await Promise.all([
    fetch("/draco/draco_encoder.wasm").then((r) => r.arrayBuffer()),
    fetch("/draco/draco_decoder.wasm").then((r) => r.arrayBuffer()),
  ]);

  const [encoderModule, decoderModule] = await Promise.all([
    createEncoderModule({ wasmBinary: encoderWasm }),
    createDecoderModule({ wasmBinary: decoderWasm }),
  ]);

  return { encoderModule, decoderModule };
}

async function compressTexture(texture: Texture): Promise<void> {
  const imageData = texture.getImage();
  if (!imageData) return;

  const blob = new Blob([imageData], { type: texture.getMimeType() || "image/png" });
  const bitmapSrc = await createImageBitmap(blob);

  let w = bitmapSrc.width;
  let h = bitmapSrc.height;

  if (w <= MAX_TEXTURE_SIZE && h <= MAX_TEXTURE_SIZE) {
    const needsWebP = texture.getMimeType() !== "image/webp";
    if (!needsWebP) {
      bitmapSrc.close();
      return;
    }
  }

  const scale = Math.min(1, MAX_TEXTURE_SIZE / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmapSrc, 0, 0, w, h);
  bitmapSrc.close();

  const webpBlob = await canvas.convertToBlob({
    type: "image/webp",
    quality: WEBP_QUALITY,
  });

  const webpBuffer = new Uint8Array(await webpBlob.arrayBuffer());
  texture.setImage(webpBuffer);
  texture.setMimeType("image/webp");
}

async function compressAllTextures(doc: Document): Promise<void> {
  const textures = doc.getRoot().listTextures();
  for (const tex of textures) {
    await compressTexture(tex);
  }
}

export async function optimizeGlb(file: File): Promise<OptimizeResult> {
  const originalSize = file.size;

  // Una sola instancia de WebIO para leer y escribir: el encoder Draco solo
  // se usa en writeBinary (ahí ocurre la compresión real), pero tiene que
  // estar registrado en la MISMA instancia que hace la escritura.
  const { encoderModule, decoderModule } = await loadDracoModules();
  const io = new WebIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      "draco3d.encoder": encoderModule,
      "draco3d.decoder": decoderModule,
    });

  let doc: Document;
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    doc = await io.readBinary(buffer);
  } catch (cause) {
    throw new GlbOptimizeError(
      "No se pudo procesar el modelo 3D: verificá que el archivo sea un .glb válido.",
      { cause },
    );
  }

  try {
    await compressAllTextures(doc);
  } catch (cause) {
    throw new GlbOptimizeError(
      "Falló la compresión de texturas del modelo 3D.",
      { cause },
    );
  }

  try {
    await doc.transform(draco());
  } catch (cause) {
    throw new GlbOptimizeError(
      "Falló la compresión de geometría del modelo 3D.",
      { cause },
    );
  }

  const outBuffer = await io.writeBinary(doc);

  const optimizedFile = new File([outBuffer as BlobPart], file.name, {
    type: "model/gltf-binary",
  });

  return {
    file: optimizedFile,
    originalSize,
    optimizedSize: optimizedFile.size,
  };
}
