/**
 * Extrae el nombre base del producto sin variaciones/atributos
 * Ejemplo: "BOLSO VINTAGE - Marron" -> "BOLSO VINTAGE"
 */
export function extractBaseProductName(itemName: string): string {
  // El nombre del item puede venir como "BOLSO VINTAGE - Marron"
  // Necesitamos extraer solo "BOLSO VINTAGE"
  // Buscar el patrón común: nombre base seguido de " - " y atributo
  const parts = itemName.split(" - ");
  if (parts.length > 1) {
    // Si tiene " - ", tomar solo la primera parte como nombre base
    return parts[0].trim();
  }
  // Si no tiene " - ", devolver el nombre completo
  return itemName.trim();
}
