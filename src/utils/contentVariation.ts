/**
 * Utilidades para variar contenido y evitar duplicación SEO
 * Genera variaciones contextuales del mismo contenido para diferentes páginas
 */

/**
 * Genera una descripción variada de producto según el contexto
 * Esto ayuda a evitar contenido duplicado en diferentes páginas
 */
export function getContextualProductDescription(
  productName: string,
  shortDescription: string,
  context: "home" | "category" | "recommendation" | "related" | "default"
): string {
  const cleanDescription = shortDescription
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Si no hay descripción, generar una básica
  if (!cleanDescription || cleanDescription.length < 20) {
    return getDefaultProductDescription(productName, context);
  }

  // Variar según el contexto
  switch (context) {
    case "home":
      // En homepage: descripción más corta y enfocada en descubrimiento
      return (
        truncateDescription(cleanDescription, 100) + " Descubre más en Belm."
      );

    case "category":
      // En categoría: incluir contexto de la categoría
      return truncateDescription(cleanDescription, 120);

    case "recommendation":
      // En recomendaciones: enfatizar que es recomendado
      return (
        truncateDescription(cleanDescription, 110) + " Recomendado para ti."
      );

    case "related":
      // En productos relacionados: variar el inicio
      return (
        "Producto relacionado: " + truncateDescription(cleanDescription, 100)
      );

    default:
      return cleanDescription;
  }
}

/**
 * Trunca una descripción de manera inteligente
 */
function truncateDescription(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Genera una descripción por defecto si no hay descripción del producto
 */
function getDefaultProductDescription(
  productName: string,
  context: string
): string {
  const baseDescription = `Descubre ${productName} en Belm. Producto premium de calidad garantizada.`;

  switch (context) {
    case "home":
      return `${baseDescription} Nuevo en nuestra tienda.`;
    case "category":
      return `${baseDescription} Disponible ahora.`;
    case "recommendation":
      return `${baseDescription} Altamente recomendado.`;
    default:
      return baseDescription;
  }
}

/**
 * Genera texto introductorio único para secciones de productos
 */
export function getSectionIntroText(
  sectionType: "new" | "bestseller" | "sale" | "category" | "recommendation",
  categoryName?: string
): string {
  const intros = {
    new: [
      "Descubre nuestros productos más recientes. Selección cuidadosa de las últimas tendencias en belleza.",
      "Nuevos productos agregados recientemente. Encuentra las últimas novedades en cosmética coreana y productos premium.",
      "Explora nuestra colección de productos nuevos. Las últimas incorporaciones a nuestro catálogo de belleza.",
    ],
    bestseller: [
      "Los productos más vendidos de nuestros clientes. Selección basada en popularidad y satisfacción.",
      "Productos favoritos de la comunidad Belm. Los más elegidos por nuestros clientes.",
      "Top de productos más populares. Descubre qué están comprando otros clientes.",
    ],
    sale: [
      "Ofertas especiales y descuentos exclusivos. Aprovecha nuestras promociones limitadas.",
      "Productos en oferta con los mejores precios. Descuentos especiales en productos seleccionados.",
      "Promociones y ofertas especiales. Encuentra grandes descuentos en productos premium.",
    ],
    category: categoryName
      ? [
          `Explora nuestra selección de ${categoryName.toLowerCase()}. Productos cuidadosamente seleccionados.`,
          `Descubre los mejores productos de ${categoryName.toLowerCase()}. Calidad premium garantizada.`,
          `${categoryName}: productos seleccionados para ti. Encuentra lo que buscas.`,
        ]
      : [
          "Productos seleccionados para ti. Encuentra lo que buscas en nuestra tienda.",
          "Explora nuestra colección. Productos cuidadosamente seleccionados.",
        ],
    recommendation: [
      "Productos recomendados para ti. Basados en tus preferencias y tendencias.",
      "Te recomendamos estos productos. Selección personalizada para tu experiencia.",
      "Productos que podrían interesarte. Recomendaciones basadas en tu navegación.",
    ],
  };

  const options = intros[sectionType];
  // Seleccionar aleatoriamente para variar el contenido
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Genera un texto de cierre único para secciones
 */
export function getSectionClosingText(
  sectionType: "new" | "bestseller" | "sale" | "category"
): string {
  const closings = {
    new: "Sigue explorando para descubrir más productos nuevos.",
    bestseller: "Estos son solo algunos de nuestros productos más populares.",
    sale: "No te pierdas estas ofertas especiales. Descuentos limitados.",
    category: "Encuentra más productos en nuestra tienda completa.",
  };

  return closings[sectionType] || "Sigue explorando nuestra tienda.";
}
