import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerAttrs = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  poster?: string;
  "auto-rotate"?: boolean | "";
  "auto-rotate-delay"?: number | string;
  "camera-controls"?: boolean | "";
  "disable-zoom"?: boolean | "";
  "interaction-prompt"?: "auto" | "when-focused" | "none";
  ar?: boolean | "";
  "ar-modes"?: string;
  "ar-scale"?: "auto" | "fixed";
  "shadow-intensity"?: number | string;
  "environment-image"?: string;
  exposure?: number | string;
  "rotation-per-second"?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual" | "interaction";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttrs;
    }
  }
}
