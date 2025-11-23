// Interfaz para reviews de productos de WooCommerce
export interface IProductReview {
  id: number;
  product_id: number;
  status: "approved" | "hold" | "spam" | "trash";
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  date_created: string;
  date_created_gmt: string;
  reviewer_avatar_urls: {
    "24": string;
    "48": string;
    "96": string;
  };
}

// Interfaz para crear un nuevo review
export interface ICreateProductReview {
  product_id: number;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
}

// Interfaz para la respuesta de reviews con paginación
export interface IProductReviewsResponse {
  reviews: IProductReview[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Interfaz para estadísticas de reviews
export interface IReviewStats {
  average_rating: number;
  rating_count: number;
  rating_counts: {
    [key: string]: number;
  };
}
