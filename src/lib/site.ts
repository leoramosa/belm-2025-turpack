/**
 * URL canónica del sitio (sin barra final). Centraliza dominio para SEO y JSON-LD.
 */
const rawBase =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim()
    : "";

export const SITE_URL = (
  rawBase.replace(/\/+$/, "") || "https://www.belm.pe"
) as string;

export const SITE_NAME = "Belm";
export const SITE_DEFAULT_LANG = "es-PE";

/**
 * Une SITE_URL con una ruta que debe empezar por `/`.
 */
export function absoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${path}`;
}
