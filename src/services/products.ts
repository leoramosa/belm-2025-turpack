import "server-only";

import {
  IProduct,
  ProductAttribute,
  ProductAttributeOption,
  ProductImage,
  ProductPricing,
  ProductVariation,
  ProductVariationAttribute,
  WordpressAttributeTerm,
  WordpressProductAttribute,
  WordpressProductResponse,
  WordpressVariationResponse,
} from "@/types/product";

import {
  buildBasicAuthHeader,
  getDefaultCurrency,
  getWordpressApiUrl,
  getWordpressConsumerKey,
  getWordpressConsumerSecret,
} from "@/services/wordpress";

const WORDPRESS_API_URL = getWordpressApiUrl();
const WORDPRESS_WC_CONSUMER_KEY = getWordpressConsumerKey();
const WORDPRESS_WC_CONSUMER_SECRET = getWordpressConsumerSecret();
const WORDPRESS_DEFAULT_CURRENCY = getDefaultCurrency();
const ATTRIBUTE_TERMS_PAGE_SIZE = 100;
const CATEGORY_PAGE_SIZE = 100;
const CATEGORY_NAMESPACE = "/wp-json/wc/v3/products/categories";
const VARIATIONS_PAGE_SIZE = 100;
const VARIATIONS_NAMESPACE = "/wp-json/wc/v3/products";

interface FetchProductsOptions {
  search?: string;
  perPage?: number;
  page?: number;
  includeOutOfStock?: boolean;
  fetchAll?: boolean;
  orderby?: string;
  order?: string;
  category?: number;
  min_price?: number;
  max_price?: number;
}

interface FetchProductBySlugOptions {
  includeOutOfStock?: boolean;
}

const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 100;
const API_NAMESPACE = "/wp-json/wc/v3/products";

export async function fetchProducts(
  options: FetchProductsOptions = {}
): Promise<IProduct[]> {
  const {
    search,
    includeOutOfStock = true,
    fetchAll = false,
    orderby,
    order,
    category,
    min_price,
    max_price,
  } = options;

  const perPage = normalizePerPage(
    options.perPage ?? (fetchAll ? MAX_PER_PAGE : DEFAULT_PER_PAGE)
  );

  if (!fetchAll) {
    const page = options.page ?? 1;
    const rawProducts = await requestProducts({
      search,
      includeOutOfStock,
      perPage,
      page,
      orderby,
      order,
      category,
      min_price,
      max_price,
      slug: undefined,
    });
    return mapProductsWithDetails(rawProducts);
  }

  const aggregated: WordpressProductResponse[] = [];
  let currentPage = options.page ?? 1;

  while (true) {
    const rawProducts = await requestProducts({
      search,
      includeOutOfStock,
      perPage,
      page: currentPage,
      orderby,
      order,
      category,
      min_price,
      max_price,
      slug: undefined,
    });

    aggregated.push(...rawProducts);
    if (rawProducts.length < perPage) break;
    currentPage += 1;
  }

  return mapProductsWithDetails(aggregated);
}

// Funciones auxiliares para productos específicos

/**
 * Obtiene productos más vendidos (ordenados por popularidad si está disponible, sino por ID)
 */
export async function fetchBestSellerProducts(
  limit: number = 9,
  includeOutOfStock: boolean = false
): Promise<IProduct[]> {
  // Intentar obtener por popularidad primero
  try {
    const products = await fetchProducts({
      perPage: limit,
      includeOutOfStock,
      fetchAll: false,
      page: 1,
      orderby: "popularity",
      order: "desc",
    });

    if (products.length >= limit) {
      return products.slice(0, limit);
    }

    // Si hay menos de limit, completar con productos ordenados por fecha
    const allProducts = await fetchProducts({
      perPage: limit * 2,
      includeOutOfStock,
      fetchAll: false,
      page: 1,
      orderby: "date",
      order: "desc",
    });

    // Filtrar duplicados y tomar hasta limit
    const existingIds = new Set(products.map((p) => p.id));
    const additional = allProducts
      .filter((p) => !existingIds.has(p.id))
      .slice(0, limit - products.length);

    return [...products, ...additional];
  } catch {
    // Fallback: ordenar por ID descendente
    const products = await fetchProducts({
      perPage: limit,
      includeOutOfStock,
      fetchAll: false,
      page: 1,
      orderby: "date",
      order: "desc",
    });

    return products.slice(0, limit);
  }
}

/**
 * Obtiene productos nuevos ordenados por fecha
 */
export async function fetchNewProducts(
  limit: number = 27,
  includeOutOfStock: boolean = false
): Promise<IProduct[]> {
  const products = await fetchProducts({
    perPage: limit,
    includeOutOfStock,
    fetchAll: false,
    page: 1,
    orderby: "date",
    order: "desc",
  });

  return products;
}

/**
 * Obtiene TODOS los productos nuevos ordenados por fecha (más recientes primero)
 * Similar a fetchNewProducts pero sin límite de cantidad
 */
export async function fetchAllNewProducts(
  includeOutOfStock: boolean = true
): Promise<IProduct[]> {
  const products = await fetchProducts({
    fetchAll: true,
    includeOutOfStock,
    orderby: "date",
    order: "desc",
  });

  // Asegurar ordenamiento por ID descendente como respaldo
  // Los IDs más altos generalmente corresponden a productos más recientes
  return products.sort((a, b) => b.id - a.id);
}

/**
 * Obtiene productos en oferta (con descuento)
 */
export async function fetchSaleProducts(
  limit: number = 27,
  includeOutOfStock: boolean = false
): Promise<IProduct[]> {
  // Obtener más productos para filtrar los que tienen descuento
  const allProducts = await fetchProducts({
    perPage: limit * 3,
    includeOutOfStock,
    orderby: "date",
    order: "asc",
    fetchAll: false,
    page: 1,
  });

  // Filtrar productos con descuento
  const saleProducts = allProducts.filter((product) => {
    // Productos simples con descuento
    const hasSimpleDiscount =
      product.pricing.salePrice !== null &&
      product.pricing.regularPrice !== null &&
      product.pricing.salePrice < product.pricing.regularPrice;

    // Productos variables con al menos una variación con descuento
    const hasVariableDiscount =
      product.variations?.some(
        (variation) =>
          variation.salePrice !== null &&
          variation.regularPrice !== null &&
          variation.salePrice < variation.regularPrice
      ) ?? false;

    return hasSimpleDiscount || hasVariableDiscount;
  });

  return saleProducts.slice(0, limit);
}

interface RequestProductsOptions {
  search?: string;
  slug?: string;
  includeOutOfStock: boolean;
  perPage: number;
  page: number;
  orderby?: string;
  order?: string;
  category?: number;
  min_price?: number;
  max_price?: number;
}

export async function fetchProductBySlug(
  slug: string,
  options: FetchProductBySlugOptions = {}
): Promise<IProduct | null> {
  const rawProducts = await requestProducts({
    slug,
    includeOutOfStock: options.includeOutOfStock ?? true,
    perPage: 1,
    page: 1,
  });

  if (!rawProducts.length) {
    return null;
  }

  return await mapWordpressProductToProductWithDetails(rawProducts[0]);
}

async function requestProducts(
  options: RequestProductsOptions
): Promise<WordpressProductResponse[]> {
  const {
    search,
    slug,
    includeOutOfStock,
    perPage,
    page,
    orderby,
    order,
    category,
    min_price,
    max_price,
  } = options;

  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString(),
    status: "publish",
  });

  if (search) {
    params.set("search", search);
  }

  if (slug) {
    params.set("slug", slug);
  }

  if (!includeOutOfStock) {
    params.set("stock_status", "instock");
  }

  if (orderby) {
    params.set("orderby", orderby);
  }

  if (order) {
    params.set("order", order);
  }

  if (category) {
    params.set("category", category.toString());
  }

  if (min_price !== undefined) {
    params.set("min_price", min_price.toString());
  }

  if (max_price !== undefined) {
    params.set("max_price", max_price.toString());
  }

  const endpoint = buildEndpoint(params);

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: buildBasicAuthHeader(
        WORDPRESS_WC_CONSUMER_KEY,
        WORDPRESS_WC_CONSUMER_SECRET
      ),
    },
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    const details = await safeReadError(response);
    throw new Error(
      `Error al obtener productos (${response.status}): ${details}`
    );
  }

  return (await response.json()) as WordpressProductResponse[];
}

function buildEndpoint(params: URLSearchParams): string {
  const baseUrl = new URL(WORDPRESS_API_URL);
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, "")}${API_NAMESPACE}`;
  baseUrl.search = params.toString();
  return baseUrl.toString();
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload?.message) return payload.message;
    return JSON.stringify(payload);
  } catch {
    return response.statusText || "Respuesta desconocida";
  }
}

function mapWordpressProductToProduct(
  product: WordpressProductResponse
): IProduct {
  const pricing: ProductPricing = {
    price: toNumberOrNull(product.price),
    regularPrice: toNumberOrNull(product.regular_price),
    salePrice: toNumberOrNull(product.sale_price),
    currency: product.currency ?? WORDPRESS_DEFAULT_CURRENCY,
  };

  const images: ProductImage[] = (product.images ?? []).map((image) => ({
    id: image.id,
    alt: image.alt || image.name || product.name,
    src: image.src,
  }));

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    type: product.type ?? "simple",
    permalink: product.permalink,
    description: product.description,
    shortDescription: product.short_description,
    sku: product.sku ?? null,
    stockStatus: product.stock_status ?? null,
    pricing,
    images,
    categories:
      product.categories?.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      })) ?? [],
    attributes: mapWordpressAttributes(product.attributes),
    variations: [],
  };
}

async function mapWordpressProductToProductWithDetails(
  product: WordpressProductResponse
): Promise<IProduct> {
  const baseProduct = mapWordpressProductToProduct(product);

  const attributes = product.attributes?.length
    ? await enrichAttributes(product.attributes)
    : [];

  let variations: ProductVariation[] = [];
  if (
    (product.type === "variable" || product.variations?.length) &&
    product.id
  ) {
    variations = await fetchProductVariations(product.id);
  }

  const variationImages = extractVariationImages(variations);
  const mergedImages = mergeImages(baseProduct.images, variationImages);

  return {
    ...baseProduct,
    attributes,
    variations,
    images: mergedImages,
  };
}

function mapProductsWithDetails(
  products: WordpressProductResponse[]
): Promise<IProduct[]> {
  return Promise.all(products.map(mapWordpressProductToProductWithDetails));
}

function toNumberOrNull(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePerPage(perPage?: number): number {
  if (!perPage) return DEFAULT_PER_PAGE;
  if (perPage <= 0) return DEFAULT_PER_PAGE;
  if (perPage > MAX_PER_PAGE) return MAX_PER_PAGE;
  return Math.floor(perPage);
}

function mapWordpressAttributes(
  attributes: WordpressProductAttribute[] | undefined
): ProductAttribute[] {
  return (attributes ?? []).map((attribute) => ({
    id: attribute.id,
    name: attribute.name,
    slug: attribute.slug,
    visible: attribute.visible,
    variation: attribute.variation,
    options: (attribute.options ?? []).map((option) => ({
      id: null,
      name: option,
      slug: toSlug(option),
      description: null,
    })),
  }));
}

async function enrichAttributes(
  attributes: WordpressProductAttribute[]
): Promise<ProductAttribute[]> {
  const baseAttributes = mapWordpressAttributes(attributes);
  const enriched = await Promise.all(
    baseAttributes.map(async (attribute) => {
      if (attribute.id <= 0 || !attribute.options.length) {
        return attribute;
      }

      const terms = await fetchAttributeTerms(attribute.id);
      if (!terms.length) {
        return attribute;
      }

      // Crear un mapa de términos por nombre normalizado para búsqueda rápida
      const termsMap = new Map<string, WordpressAttributeTerm>();
      terms.forEach((term) => {
        const normalizedName = normalize(term.name);
        if (!termsMap.has(normalizedName)) {
          termsMap.set(normalizedName, term);
        }
      });

      // Enriquecer SOLO las opciones que están asignadas al producto
      const options = attribute.options.map((option) => {
        const term =
          termsMap.get(normalize(option.name)) ||
          terms.find(
            (candidate) => candidate.slug && candidate.slug === option.slug
          ) ||
          null;

        if (!term) {
          return option;
        }

        return {
          id: term.id,
          name: term.name,
          slug: term.slug,
          description: term.description || null,
        };
      });

      return {
        ...attribute,
        options,
      };
    })
  );

  return enriched;
}

interface CachedAttributeTerms {
  terms: WordpressAttributeTerm[];
  timestamp: number;
}

const attributeTermsCache = new Map<number, CachedAttributeTerms>();
const ATTRIBUTE_TERMS_NAMESPACE = "/wp-json/wc/v3/products/attributes";
const CACHE_TTL_MS = 60 * 1000; // 60 segundos (1 minuto) - reducido para mostrar nuevos colores más rápido

// Función para limpiar el caché de términos de atributos
export function clearAttributeTermsCache(attributeId?: number): void {
  if (attributeId !== undefined) {
    attributeTermsCache.delete(attributeId);
  } else {
    attributeTermsCache.clear();
  }
}

async function fetchAttributeTerms(
  attributeId: number
): Promise<WordpressAttributeTerm[]> {
  const cached = attributeTermsCache.get(attributeId);
  const now = Date.now();

  // Verificar si el caché existe y no ha expirado
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.terms;
  }

  const collected: WordpressAttributeTerm[] = [];
  let page = 1;

  while (true) {
    const endpoint = buildAttributeTermsEndpoint(attributeId, page);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildBasicAuthHeader(
          WORDPRESS_WC_CONSUMER_KEY,
          WORDPRESS_WC_CONSUMER_SECRET
        ),
      },
      next: {
        revalidate: 60, // Reducido de 300 a 60 segundos para mostrar nuevos colores más rápido
      },
    });

    if (!response.ok) {
      console.warn(
        `No se pudieron obtener los términos del atributo ${attributeId}: ${response.status}`
      );
      break;
    }

    const terms = (await response.json()) as WordpressAttributeTerm[];
    collected.push(...terms);

    if (terms.length < ATTRIBUTE_TERMS_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  // Guardar en caché con timestamp
  attributeTermsCache.set(attributeId, {
    terms: collected,
    timestamp: now,
  });

  return collected;
}

function buildAttributeTermsEndpoint(
  attributeId: number,
  page: number
): string {
  const baseUrl = new URL(WORDPRESS_API_URL);
  baseUrl.pathname = `${baseUrl.pathname.replace(
    /\/$/,
    ""
  )}${ATTRIBUTE_TERMS_NAMESPACE}/${attributeId}/terms`;
  baseUrl.searchParams.set("per_page", ATTRIBUTE_TERMS_PAGE_SIZE.toString());
  baseUrl.searchParams.set("page", page.toString());
  return baseUrl.toString();
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function fetchProductVariations(
  productId: number
): Promise<ProductVariation[]> {
  const collected: WordpressVariationResponse[] = [];
  let page = 1;

  while (true) {
    const endpoint = buildVariationEndpoint(productId, page);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: buildBasicAuthHeader(
            WORDPRESS_WC_CONSUMER_KEY,
            WORDPRESS_WC_CONSUMER_SECRET
          ),
        },
        next: {
          revalidate: 300,
        },
      });
    } catch (error) {
      console.warn(
        `Error de red al obtener variaciones del producto ${productId}:`,
        error
      );
      break;
    }

    if (!response.ok) {
      console.warn(
        `No se pudieron obtener las variaciones del producto ${productId} (página ${page}): ${response.status}`
      );
      break;
    }

    const rows = (await response.json()) as WordpressVariationResponse[];
    collected.push(...rows);

    if (rows.length < VARIATIONS_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return collected.map(mapVariationResponseToProductVariation);
}

function buildVariationEndpoint(productId: number, page: number): string {
  const baseUrl = new URL(WORDPRESS_API_URL);
  baseUrl.pathname = `${baseUrl.pathname.replace(
    /\/$/,
    ""
  )}${VARIATIONS_NAMESPACE}/${productId}/variations`;
  baseUrl.searchParams.set("per_page", VARIATIONS_PAGE_SIZE.toString());
  baseUrl.searchParams.set("page", page.toString());
  baseUrl.searchParams.set("orderby", "id");
  baseUrl.searchParams.set("order", "asc");
  baseUrl.searchParams.set("hide_empty", "false");
  return baseUrl.toString();
}

function mapVariationResponseToProductVariation(
  variation: WordpressVariationResponse
): ProductVariation {
  return {
    id: variation.id,
    name: variation.image?.name ?? `Variación ${variation.id}`,
    sku: variation.sku ?? null,
    price: toNumberOrNull(variation.price),
    regularPrice: toNumberOrNull(variation.regular_price),
    salePrice: toNumberOrNull(variation.sale_price),
    image: variation.image
      ? {
          id: variation.image.id,
          alt: variation.image.alt ?? variation.image.name ?? "",
          src: variation.image.src,
          variationId: variation.id,
          attributes: buildVariationAttributeMap(variation.attributes),
        }
      : null,
    attributes: variation.attributes.map(mapVariationAttribute),
  };
}

function mapVariationAttribute(attribute: {
  id: number;
  name: string;
  option: string;
}): ProductVariationAttribute {
  return {
    id: attribute.id,
    name: attribute.name,
    slug: toSlug(attribute.name),
    option: attribute.option,
  };
}

function buildVariationAttributeMap(
  attributes: WordpressVariationResponse["attributes"]
): Record<string, string> {
  const map: Record<string, string> = {};
  attributes.forEach((attribute) => {
    if (!attribute.name || !attribute.option) return;
    map[toSlug(attribute.name)] = attribute.option;
  });
  return map;
}

function extractVariationImages(
  variations: ProductVariation[]
): ProductImage[] {
  return variations
    .map((variation) => variation.image)
    .filter((image): image is ProductImage => Boolean(image));
}

function mergeImages(
  baseImages: ProductImage[],
  variationImages: ProductImage[]
): ProductImage[] {
  const combined = [...baseImages];
  const existing = new Set(baseImages.map((image) => image.src));

  variationImages.forEach((image) => {
    if (!existing.has(image.src)) {
      combined.push(image);
      existing.add(image.src);
    }
  });

  return combined;
}
