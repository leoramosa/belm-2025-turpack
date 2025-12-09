/**
 * Utilidades para optimización SEO
 */

/**
 * Constantes para metadescripciones SEO
 */
export const SEO_META_DESCRIPTION = {
  MIN_LENGTH: 120, // Mínimo recomendado
  OPTIMAL_LENGTH: 155, // Óptimo (con margen de seguridad)
  MAX_LENGTH: 160, // Máximo que muestra Google
} as const;

/**
 * Optimiza una metadescripción para SEO
 * - Asegura un mínimo de 120 caracteres
 * - Limita a máximo 160 caracteres
 * - Trunca inteligentemente sin cortar palabras
 *
 * @param description - La descripción original
 * @param fallbackText - Texto de respaldo si la descripción es muy corta
 * @returns Descripción optimizada
 */
export function optimizeMetaDescription(
  description: string,
  fallbackText?: string
): string {
  const { MIN_LENGTH, OPTIMAL_LENGTH, MAX_LENGTH } = SEO_META_DESCRIPTION;

  // Limpiar y normalizar la descripción
  let optimized = description
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Si la descripción es muy corta o está vacía, usar el texto de respaldo
  if (!optimized || optimized.length < MIN_LENGTH) {
    if (fallbackText && fallbackText.length >= MIN_LENGTH) {
      optimized = fallbackText;
    } else if (fallbackText) {
      // Si el fallback también es corto, combinarlo
      optimized = `${optimized} ${fallbackText}`.trim();
    }
  }

  // Si aún es muy corta, agregar texto genérico
  if (optimized.length < MIN_LENGTH) {
    optimized += ` Productos de calidad garantizada. Envío gratis en Perú.`;
  }

  // Si la descripción es muy larga, truncarla inteligentemente
  if (optimized.length > MAX_LENGTH) {
    // Truncar en el último espacio antes del límite para evitar cortar palabras
    const truncated = optimized.substring(0, OPTIMAL_LENGTH);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > MIN_LENGTH) {
      optimized = truncated.substring(0, lastSpace) + "...";
    } else {
      // Si no hay espacio cercano, truncar directamente
      optimized = truncated + "...";
    }
  }

  // Asegurar que esté dentro del rango mínimo
  if (optimized.length < MIN_LENGTH) {
    optimized += ` Compra ahora en Belm.`;
  }

  // Limitar a máximo 160 caracteres (última verificación)
  if (optimized.length > MAX_LENGTH) {
    optimized = optimized.substring(0, MAX_LENGTH).trim();
    // Asegurar que no termine en medio de una palabra
    const lastSpace = optimized.lastIndexOf(" ");
    if (lastSpace > MIN_LENGTH) {
      optimized = optimized.substring(0, lastSpace) + "...";
    }
  }

  return optimized.trim();
}

/**
 * Genera una metadescripción automática para productos
 */
export function generateProductMetaDescription(
  productName: string,
  categoryName?: string,
  price?: number
): string {
  let description = `${productName}. `;

  if (categoryName) {
    description += `${categoryName} premium. `;
  }

  description += `Encuentra los mejores productos de belleza en Belm. `;

  if (price && price > 0) {
    description += `Precio: S/ ${price.toFixed(2)}. `;
  }

  description += `Envío gratis en Perú. Compra ahora.`;

  return optimizeMetaDescription(description);
}

/**
 * Genera una metadescripción automática para categorías
 */
export function generateCategoryMetaDescription(
  categoryName: string,
  existingDescription?: string
): string {
  let description = existingDescription || "";

  if (!description || description.length < SEO_META_DESCRIPTION.MIN_LENGTH) {
    description = `Explora ${categoryName} en Belm. Productos premium de belleza con envío gratis en Perú. Encuentra los mejores productos de ${categoryName} al mejor precio.`;
  }

  return optimizeMetaDescription(description);
}
