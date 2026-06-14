import {
  IProductReview,
  ICreateProductReview,
  IProductReviewsResponse,
  IReviewStats,
} from "@/interface/IProductReview";
import {
  getWordpressApiUrl,
  getWordpressConsumerKey,
  getWordpressConsumerSecret,
  buildBasicAuthHeader,
} from "@/services/wordpress";

// Interfaz para comentarios de WordPress
interface WordPressComment {
  id: number;
  post: number;
  status: string;
  author_name: string;
  author_email: string;
  content: {
    rendered: string;
    raw: string;
  };
  date: string;
  date_gmt: string;
  author_avatar_urls: {
    "24": string;
    "48": string;
    "96": string;
  };
  meta?: {
    rating?: number;
  };
}

// Interfaz para la respuesta de reviews de WooCommerce API
interface WooCommerceReviewResponse {
  id: number;
  product_id: number;
  status: string;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified?: boolean;
  date_created: string;
  date_created_gmt: string;
  reviewer_avatar_urls?: {
    "24"?: string;
    "48"?: string;
    "96"?: string;
  };
}

// Función para obtener reviews de un producto específico
export async function fetchProductReviews(
  productId: number,
  page: number = 1,
  perPage: number = 10,
  status: "approved" | "hold" | "spam" | "trash" | "all" = "approved"
): Promise<IProductReviewsResponse> {
  const apiUrl = getWordpressApiUrl();
  const consumerKey = getWordpressConsumerKey();
  const consumerSecret = getWordpressConsumerSecret();

  if (!apiUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce credentials not configured");
  }

  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(status !== "all" && { status }),
  });

  // Usar el endpoint oficial de WooCommerce para reviews (con filtro por producto)
  const url = `${apiUrl}/wp-json/wc/v3/products/reviews?product=${productId}&${queryParams}`;
  const authHeader = buildBasicAuthHeader(consumerKey, consumerSecret);

  // Agregar timeout para evitar que la petición se cuelgue
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

  let wooReviews: WooCommerceReviewResponse[] = [];
  let response: Response | null = null;

  try {
    response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Si es 404, el producto no tiene reviews, devolver array vacío
      if (response.status === 404) {
        return {
          reviews: [],
          total: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`WooCommerce API error: ${response.status}`, errorText);
      throw new Error(
        `WooCommerce API error: ${response.status} - ${errorText}`
      );
    }

    // Validar que la respuesta sea JSON válido
    try {
      wooReviews = await response.json();
    } catch (jsonError) {
      console.error("Error parsing reviews JSON:", jsonError);
      // Si no es JSON válido, devolver array vacío
      return {
        reviews: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      };
    }

    if (!Array.isArray(wooReviews)) {
      console.warn("Reviews response is not an array, returning empty array");
      return {
        reviews: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      };
    }
  } catch (fetchError) {
    clearTimeout(timeoutId);

    // Si es un error de timeout o red, devolver array vacío
    if (
      fetchError instanceof Error &&
      (fetchError.name === "AbortError" ||
        fetchError.message.includes("fetch failed") ||
        fetchError.message.includes("network"))
    ) {
      console.warn(
        "Network error fetching reviews, returning empty array:",
        fetchError.message
      );
      return {
        reviews: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      };
    }
    throw fetchError;
  }

  // Mapear reviews de WooCommerce a nuestro formato
  const reviews: IProductReview[] = wooReviews.map((wooReview) => {
    // Validar y convertir el status a un tipo válido
    const validStatus: "approved" | "hold" | "spam" | "trash" =
      wooReview.status === "approved" ||
      wooReview.status === "hold" ||
      wooReview.status === "spam" ||
      wooReview.status === "trash"
        ? wooReview.status
        : "hold"; // Default a "hold" si el status no es válido

    return {
      id: wooReview.id,
      product_id: wooReview.product_id,
      status: validStatus,
      reviewer: wooReview.reviewer,
      reviewer_email: wooReview.reviewer_email,
      review: wooReview.review,
      rating: wooReview.rating,
      verified: wooReview.verified || false,
      date_created: wooReview.date_created,
      date_created_gmt: wooReview.date_created_gmt,
      reviewer_avatar_urls: {
        "24": wooReview.reviewer_avatar_urls?.["24"] || "",
        "48": wooReview.reviewer_avatar_urls?.["48"] || "",
        "96": wooReview.reviewer_avatar_urls?.["96"] || "",
      },
    };
  });

  // Obtener información de paginación de los headers
  const total = parseInt(response?.headers.get("X-WP-Total") || "0");
  const totalPages = parseInt(response?.headers.get("X-WP-TotalPages") || "0");

  return {
    reviews,
    total,
    totalPages,
    currentPage: page,
  };
}

// Función para crear un nuevo review
export async function createProductReview(
  reviewData: ICreateProductReview
): Promise<IProductReview> {
  const apiUrl = getWordpressApiUrl();
  const consumerKey = getWordpressConsumerKey();
  const consumerSecret = getWordpressConsumerSecret();

  if (!apiUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce credentials not configured");
  }

  // Usar el endpoint oficial de WooCommerce para crear reviews
  const url = `${apiUrl}/wp-json/wc/v3/products/reviews`;
  const authHeader = buildBasicAuthHeader(consumerKey, consumerSecret);

  // 🆕 Crear el review con status "hold" (pendiente) para que requiera aprobación del administrador
  const reviewPayload = {
    ...reviewData,
    status: "hold", // Status "hold" = pendiente de aprobación
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`WooCommerce API error: ${response.status}`, errorText);
    throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
  }

  const review: IProductReview = await response.json();

  return review;
}

// Función para obtener estadísticas de reviews de un producto
export async function fetchProductReviewStats(
  productId: number
): Promise<IReviewStats> {
  const apiUrl = getWordpressApiUrl();
  const consumerKey = getWordpressConsumerKey();
  const consumerSecret = getWordpressConsumerSecret();

  if (!apiUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce credentials not configured");
  }

  const url = `${apiUrl}/wp-json/wc/v3/products/${productId}`;
  const authHeader = buildBasicAuthHeader(consumerKey, consumerSecret);

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status}`);
  }

  const product = await response.json();

  return {
    average_rating: parseFloat(product.average_rating || "0"),
    rating_count: parseInt(product.rating_count || "0"),
    rating_counts: product.rating_counts || {},
  };
}

// Función para obtener todos los reviews (con filtros)
export async function fetchAllReviews(
  page: number = 1,
  perPage: number = 10,
  status: "approved" | "hold" | "spam" | "trash" | "all" = "approved",
  productId?: number
): Promise<IProductReviewsResponse> {
  const apiUrl = getWordpressApiUrl();
  const consumerKey = getWordpressConsumerKey();
  const consumerSecret = getWordpressConsumerSecret();

  if (!apiUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce credentials not configured");
  }

  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(status !== "all" && { status }),
    ...(productId && { post: productId.toString() }),
  });

  // Usar el endpoint de WordPress Comments
  const url = `${apiUrl}/wp-json/wp/v2/comments?${queryParams}`;
  const authHeader = buildBasicAuthHeader(consumerKey, consumerSecret);

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  const wpComments: WordPressComment[] = await response.json();

  // Mapear comentarios de WordPress a nuestro formato de reviews
  const reviews: IProductReview[] = wpComments.map((comment) => ({
    id: comment.id,
    product_id: comment.post,
    status: comment.status === "approved" ? "approved" : "hold",
    reviewer: comment.author_name,
    reviewer_email: comment.author_email,
    review: comment.content.rendered || comment.content.raw,
    rating: comment.meta?.rating || 5,
    verified: false,
    date_created: comment.date,
    date_created_gmt: comment.date_gmt,
    reviewer_avatar_urls: {
      "24": comment.author_avatar_urls?.["24"] || "",
      "48": comment.author_avatar_urls?.["48"] || "",
      "96": comment.author_avatar_urls?.["96"] || "",
    },
  }));

  // Obtener información de paginación de los headers
  const total = parseInt(response.headers.get("X-WP-Total") || "0");
  const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "0");

  return {
    reviews,
    total,
    totalPages,
    currentPage: page,
  };
}
