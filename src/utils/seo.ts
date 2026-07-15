/**
 * Utilidades para optimización SEO
 */

import type { IProduct } from "@/types/product";
import type { IProductCategoryNode } from "@/types/ICategory";
import {
  getFirstProductTono,
  resolveProductBrandName,
} from "@/utils/productAttributes";

/**
 * Constantes para metadescripciones SEO
 * - Límite de píxeles: 1000 píxeles máximo
 * - Aproximadamente 150-155 caracteres para evitar exceder el límite
 */
export const SEO_META_DESCRIPTION = {
  MIN_LENGTH: 120, // Mínimo recomendado
  OPTIMAL_LENGTH: 150, // Óptimo (más conservador para evitar exceder 1000px)
  MAX_LENGTH: 155, // Máximo recomendado (reducido para evitar exceder límite de píxeles)
} as const;

/**
 * Constantes para títulos SEO
 * - Longitud óptima: 50-55 caracteres (aproximadamente 580 píxeles máximo)
 * - Google muestra aproximadamente 50-60 caracteres en resultados
 * - Límite estricto para evitar truncamiento en resultados de búsqueda
 */
export const SEO_TITLE = {
  MIN_LENGTH: 30, // Mínimo recomendado
  OPTIMAL_LENGTH: 45, // Óptimo (más conservador para evitar exceder 580px)
  MAX_LENGTH: 45, // Máximo recomendado (reducido para evitar exceder límite de píxeles)
} as const;

/**
 * Constantes para textos ancla SEO
 * - Longitud máxima recomendada: 100-120 caracteres
 * - Debe ser descriptivo pero conciso
 */
export const SEO_ANCHOR_TEXT = {
  MAX_LENGTH: 100, // Máximo recomendado (con margen de seguridad)
  OPTIMAL_LENGTH: 80, // Óptimo
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
 * Optimizada para no exceder 1000 píxeles (≈155 caracteres)
 */
export function generateProductMetaDescription(
  productName: string,
  categoryName?: string,
  price?: number
): string {
  // Construir descripción de forma más concisa
  let description = `${productName}. `;

  if (categoryName) {
    description += `${categoryName} premium en Belm. `;
  } else {
    description += `Producto premium en Belm. `;
  }

  if (price && price > 0) {
    description += `Precio: S/ ${price.toFixed(2)}. `;
  }

  description += `Envío gratis en Perú.`;

  // Optimizar y verificar límite
  let optimized = optimizeMetaDescription(description);

  // Verificación adicional: si aún es muy largo, truncar más agresivamente
  if (optimized.length > SEO_META_DESCRIPTION.MAX_LENGTH) {
    // Intentar mantener las partes más importantes
    const parts = optimized.split(". ");
    let truncated = "";

    for (const part of parts) {
      if (
        (truncated + part + ". ").length <=
        SEO_META_DESCRIPTION.MAX_LENGTH - 3
      ) {
        truncated += part + ". ";
      } else {
        break;
      }
    }

    if (truncated.length > SEO_META_DESCRIPTION.MIN_LENGTH) {
      optimized = truncated.trim() + "...";
    } else {
      optimized =
        optimized.substring(0, SEO_META_DESCRIPTION.MAX_LENGTH).trim() + "...";
    }
  }

  return optimized;
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

  // Asegurar que no exceda el límite de píxeles (1000px ≈ 155 caracteres)
  const optimized = optimizeMetaDescription(description);

  // Verificación adicional: si aún es muy largo, truncar más
  if (optimized.length > SEO_META_DESCRIPTION.MAX_LENGTH) {
    return (
      optimized.substring(0, SEO_META_DESCRIPTION.MAX_LENGTH).trim() + "..."
    );
  }

  return optimized;
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
 * Plantilla Digiltek: {nombre} {marca} {tono} | {categoría padre} | Belm | Perú
 */
export function generateProductTitle(
  productName: string,
  brand: string = "Belm"
): string {
  return generateProductSeoTitle({
    productName,
    brand: brand !== "Belm" ? brand : null,
    category: null,
  });
}

/**
 * Título SEO de producto según plantilla:
 * `{nombre} {marca} {tono} | {categoría} | Belm | Perú`
 * - marca: marca del producto (si existe)
 * - tono: primer color/tono (si tiene)
 * - categoría: categoría padre (raíz)
 */
export function generateProductSeoTitle(input: {
  productName: string;
  brand?: string | null;
  tono?: string | null;
  category?: string | null;
}): string {
  const name = input.productName.replace(/\s+/g, " ").trim();
  const brand = input.brand?.replace(/\s+/g, " ").trim() || "";
  const tono = input.tono?.replace(/\s+/g, " ").trim() || "";
  const category = input.category?.replace(/\s+/g, " ").trim() || "";

  const headParts: string[] = [name];
  // Marca de producto (no repetir "Belm": ya va al final de la plantilla)
  if (brand && brand.toLowerCase() !== "belm") headParts.push(brand);
  if (tono) headParts.push(tono);

  const head = removeRepeatedWords(headParts.join(" "));
  const tailParts = [
    ...(category ? [category] : []),
    "Belm",
    "Perú",
  ];

  return `${head} | ${tailParts.join(" | ")}`.trim();
}

/** Nombre de la categoría raíz (padre) del producto según el árbol WooCommerce. */
export function resolveProductRootCategoryName(
  productCategories: Array<{ id: number; name: string; slug: string }> | undefined,
  categoryTree: IProductCategoryNode[] | undefined
): string | null {
  if (!productCategories?.length) return null;

  if (!categoryTree?.length) {
    return productCategories[0]?.name?.trim() || null;
  }

  let bestRoot: IProductCategoryNode | null = null;
  let bestDepth = -1;

  for (const pc of productCategories) {
    const node = findCategoryNodeById(categoryTree, pc.id);
    if (!node) continue;
    const path = getPathToRoot(node, categoryTree);
    if (path.length > bestDepth) {
      bestDepth = path.length;
      bestRoot = path[0] ?? null;
    }
  }

  if (bestRoot?.name?.trim()) return bestRoot.name.trim();
  return productCategories[0]?.name?.trim() || null;
}

/** Título SEO completo a partir del producto + árbol de categorías. */
export function buildProductSeoTitle(
  product: IProduct,
  categoryTree?: IProductCategoryNode[]
): string {
  return generateProductSeoTitle({
    productName: product.name,
    brand: resolveProductBrandName(product),
    tono: getFirstProductTono(product),
    category: resolveProductRootCategoryName(product.categories, categoryTree),
  });
}

function findCategoryNodeById(
  nodes: IProductCategoryNode[],
  id: number
): IProductCategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findCategoryNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getPathToRoot(
  category: IProductCategoryNode,
  allCategories: IProductCategoryNode[]
): IProductCategoryNode[] {
  const path: IProductCategoryNode[] = [category];
  let current = category;

  while (current.parentId !== null) {
    const parent = findCategoryNodeById(allCategories, current.parentId);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }

  return path;
}

/**
 * Genera un título optimizado para categorías
 * Estructura: Nombre de categoría | Productos Premium | Marca
 * Asegura que las palabras clave aparezcan en el contenido
 * Optimizado para no exceder 580 píxeles
 */
export function generateCategoryTitle(
  categoryName: string,
  brand: string = "Belm"
): string {
  // Construir título con palabras clave que aparecerán en el contenido
  // Formato: "Categoría | Productos Premium | Belm"
  // Si es muy largo, simplificar a "Categoría | Belm"
  let title = `${categoryName} | Productos Premium | ${brand}`;

  // Verificar longitud estimada (aproximadamente 10-12 píxeles por carácter)
  const estimatedPixels = title.length * 11;

  if (estimatedPixels > 580 || title.length > SEO_TITLE.MAX_LENGTH) {
    // Simplificar si es muy largo
    title = `${categoryName} | ${brand}`;
  }

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

/**
 * Genera un texto ancla optimizado para enlaces internos
 * - Máximo 100 caracteres
 * - Debe ser descriptivo y contener palabras clave relevantes
 * - Trunca inteligentemente sin cortar palabras
 *
 * @param productName - Nombre del producto
 * @param categoryName - Nombre de la categoría (opcional)
 * @returns Texto ancla optimizado
 */
export function generateAnchorText(
  productName: string,
  categoryName?: string
): string {
  const { MAX_LENGTH, OPTIMAL_LENGTH } = SEO_ANCHOR_TEXT;

  // Limpiar el nombre del producto
  let anchorText = productName.trim().replace(/\s+/g, " ");

  // Si el nombre es muy largo, truncarlo
  if (anchorText.length > MAX_LENGTH) {
    // Intentar truncar en un punto lógico (después de palabras clave importantes)
    const words = anchorText.split(" ");

    // Si tiene categoría, intentar incluirla
    if (categoryName && categoryName.length < 30) {
      const categoryPart = categoryName.trim();
      const maxProductLength = MAX_LENGTH - categoryPart.length - 3; // 3 para " - "

      if (maxProductLength > 20) {
        // Truncar el nombre del producto y agregar la categoría
        const truncatedName = truncateAtWord(productName, maxProductLength);
        anchorText = `${truncatedName} - ${categoryPart}`;

        // Si aún es muy largo, truncar más
        if (anchorText.length > MAX_LENGTH) {
          anchorText = truncateAtWord(anchorText, OPTIMAL_LENGTH);
        }
      } else {
        // Si no hay espacio, solo usar el nombre truncado
        anchorText = truncateAtWord(productName, OPTIMAL_LENGTH);
      }
    } else {
      // Sin categoría, solo truncar el nombre
      anchorText = truncateAtWord(productName, OPTIMAL_LENGTH);
    }
  }

  return anchorText.trim();
}
