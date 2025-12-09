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
 * Constantes para títulos SEO
 * - Longitud óptima: 50-60 caracteres (aproximadamente 580 píxeles)
 * - Google muestra aproximadamente 50-60 caracteres en resultados
 */
export const SEO_TITLE = {
  MIN_LENGTH: 30, // Mínimo recomendado
  OPTIMAL_LENGTH: 55, // Óptimo (con margen de seguridad)
  MAX_LENGTH: 60, // Máximo recomendado
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

/**
 * Optimiza un título para SEO
 * - Longitud óptima: 50-60 caracteres
 * - Evita palabras repetidas
 * - Trunca inteligentemente sin cortar palabras
 *
 * @param title - El título original
 * @param brand - Nombre de la marca (opcional, se agrega al final)
 * @returns Título optimizado
 */
export function optimizeTitle(title: string, brand: string = "Belm"): string {
  const { MIN_LENGTH, OPTIMAL_LENGTH, MAX_LENGTH } = SEO_TITLE;

  // Limpiar el título
  let optimized = title.replace(/\s+/g, " ").trim();

  // Remover palabras repetidas consecutivas
  optimized = removeRepeatedWords(optimized);

  // Si el título es muy corto, agregar contexto
  if (optimized.length < MIN_LENGTH) {
    // Si no tiene marca, agregarla
    if (!optimized.toLowerCase().includes(brand.toLowerCase())) {
      optimized = `${optimized} | ${brand}`;
    } else {
      // Si ya tiene marca pero es corto, agregar más contexto
      optimized = `${optimized} - Productos Premium`;
    }
  }

  // Si el título es muy largo, truncarlo inteligentemente
  if (optimized.length > MAX_LENGTH) {
    // Intentar truncar antes del separador (| o -)
    const separators = [" | ", " - "];
    let truncated = optimized;

    for (const separator of separators) {
      const parts = optimized.split(separator);
      if (parts.length > 1) {
        // Mantener la parte principal y truncar
        const mainPart = parts[0].trim();
        const brandPart = parts[parts.length - 1].trim();

        if (
          mainPart.length <=
          OPTIMAL_LENGTH - brandPart.length - separator.length
        ) {
          truncated = `${mainPart}${separator}${brandPart}`;
          break;
        }
      }
    }

    // Si aún es muy largo, truncar la parte principal
    if (truncated.length > MAX_LENGTH) {
      const lastSeparator = separators.find((sep) => truncated.includes(sep));
      if (lastSeparator) {
        const parts = truncated.split(lastSeparator);
        const mainPart = parts[0];
        const brandPart = parts[parts.length - 1];

        // Truncar la parte principal
        const maxMainLength =
          OPTIMAL_LENGTH - brandPart.length - lastSeparator.length;
        const truncatedMain = truncateAtWord(mainPart, maxMainLength);
        truncated = `${truncatedMain}${lastSeparator}${brandPart}`;
      } else {
        // Si no hay separador, truncar directamente
        truncated = truncateAtWord(truncated, OPTIMAL_LENGTH);
      }
    }

    optimized = truncated;
  }

  // Asegurar que no sea muy corto después de truncar
  if (optimized.length < MIN_LENGTH && !optimized.includes(brand)) {
    optimized = `${optimized} | ${brand}`;
  }

  return optimized.trim();
}

/**
 * Remueve palabras repetidas consecutivas del texto
 */
function removeRepeatedWords(text: string): string {
  const words = text.split(/\s+/);
  const filtered: string[] = [];
  let lastWord = "";

  for (const word of words) {
    const normalizedWord = word.toLowerCase();
    if (normalizedWord !== lastWord.toLowerCase()) {
      filtered.push(word);
      lastWord = word;
    }
  }

  return filtered.join(" ");
}

/**
 * Trunca un texto en el último espacio antes del límite para evitar cortar palabras
 */
function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > SEO_TITLE.MIN_LENGTH) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated.substring(0, maxLength - 3) + "...";
}

/**
 * Genera un título optimizado para productos
 * Estructura: Nombre del producto (truncado si es necesario) | Marca
 */
export function generateProductTitle(
  productName: string,
  brand: string = "Belm"
): string {
  // Limpiar el nombre del producto
  let cleanName = productName.replace(/\s+/g, " ").trim();

  // Remover palabras repetidas
  cleanName = removeRepeatedWords(cleanName);

  // Si el nombre es muy largo, truncarlo antes de agregar la marca
  const maxNameLength = SEO_TITLE.OPTIMAL_LENGTH - brand.length - 3; // 3 para " | "

  if (cleanName.length > maxNameLength) {
    cleanName = truncateAtWord(cleanName, maxNameLength);
  }

  const title = `${cleanName} | ${brand}`;

  // Asegurar que el título final esté optimizado
  return optimizeTitle(title, brand);
}

/**
 * Genera un título optimizado para categorías
 * Estructura: Nombre de categoría | Productos Premium | Marca
 * Asegura que las palabras clave aparezcan en el contenido
 */
export function generateCategoryTitle(
  categoryName: string,
  brand: string = "Belm"
): string {
  // Construir título con palabras clave que aparecerán en el contenido
  // Formato: "Categoría | Productos Premium | Belm"
  const title = `${categoryName} | Productos Premium | ${brand}`;

  return optimizeTitle(title, brand);
}

/**
 * Genera un título optimizado para páginas generales
 */
export function generatePageTitle(
  pageName: string,
  brand: string = "Belm",
  context?: string
): string {
  let title = pageName.trim();

  // Verificar si ya incluye la marca
  const hasBrand = title.toLowerCase().includes(brand.toLowerCase());

  // Si es muy corto, agregar contexto
  if (title.length < SEO_TITLE.MIN_LENGTH) {
    if (context && !hasBrand) {
      title = `${pageName} | ${context} | ${brand}`;
    } else if (!hasBrand) {
      title = `${pageName} | ${brand}`;
    } else if (context) {
      title = `${pageName} | ${context}`;
    }
  } else if (!hasBrand) {
    // Si no tiene marca y es suficientemente largo, agregar solo la marca
    title = `${pageName} | ${brand}`;
  }

  return optimizeTitle(title, brand);
}
