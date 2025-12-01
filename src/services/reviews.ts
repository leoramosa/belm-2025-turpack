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

  console.log(`Fetching reviews from: ${url}`);

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  });

  console.log(`Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`WooCommerce API error: ${response.status}`, errorText);
    throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wooReviews: any[] = await response.json();
  console.log(`Found ${wooReviews.length} reviews from WooCommerce`);

  // Mapear reviews de WooCommerce a nuestro formato
  const reviews: IProductReview[] = wooReviews.map((wooReview) => ({
    id: wooReview.id,
    product_id: wooReview.product_id,
    status: wooReview.status,
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

  console.log(`Creating review at: ${url}`, reviewPayload);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewPayload),
  });

  console.log(`Create review response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`WooCommerce API error: ${response.status}`, errorText);
    throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
  }

  const review: IProductReview = await response.json();
  console.log(`Review created successfully:`, review);

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
