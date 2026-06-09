/**
 * Serializa JSON-LD de forma segura para inyectar en HTML (evita cierre de script con `<`).
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
