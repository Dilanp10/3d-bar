export function siteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function dishMenuUrl(dishId: string): string {
  return `${siteOrigin()}/menu/${dishId}`;
}
