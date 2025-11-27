"use client";
import { useState, useEffect, useCallback } from "react";
import {
  IProductReviewsResponse,
  ICreateProductReview,
  IProductReview,
} from "@/interface/IProductReview";
import { Star, Calendar, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

// Componente para mostrar el rating con estrellas
function StarRating({
  rating,
  count,
  interactive = false,
  onRatingChange,
}: {
  rating: number;
  count?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            interactive ? "cursor-pointer transition-colors" : ""
          } ${
            star <= (interactive ? hoverRating || rating : rating)
              ? "text-yellow-400 fill-current"
              : "text-gray-300"
          }`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRatingChange?.(star)}
        />
      ))}
      {count !== undefined && (
        <span className="ml-2 text-sm text-gray-500">({count})</span>
      )}
    </div>
  );
}

// Componente para el formulario de review
function ReviewForm({
  productId,
  onReviewAdded,
}: {
  productId: number;
  onReviewAdded: (newReview?: IProductReview) => void;
}) {
  const [formData, setFormData] = useState<ICreateProductReview>({
    product_id: productId,
    reviewer: "",
    reviewer_email: "",
    review: "",
    rating: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el review");
      }

      const responseData = await response.json();

      toast.success("¡Review enviado! Será revisado antes de publicarse.");
      setFormData({
        product_id: productId,
        reviewer: "",
        reviewer_email: "",
        review: "",
        rating: 5,
      });

      // Pasar el review creado para agregarlo inmediatamente a la lista
      onReviewAdded(responseData.review);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al enviar el review"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8 opacity-100 transform translate-y-0 transition-all duration-500 ease-out">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Escribe tu review
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.reviewer}
              onChange={(e) =>
                setFormData({ ...formData, reviewer: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.reviewer_email}
              onChange={(e) =>
                setFormData({ ...formData, reviewer_email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calificación *
          </label>
          <StarRating
            rating={formData.rating}
            interactive={true}
            onRatingChange={(rating) => setFormData({ ...formData, rating })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comentario *
          </label>
          <textarea
            required
            rows={4}
            value={formData.review}
            onChange={(e) =>
              setFormData({ ...formData, review: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Comparte tu experiencia con este producto..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Componente principal de reviews
export default function ProductReviews({
  productId,
  productName,
}: ProductReviewsProps) {
  const [reviewsData, setReviewsData] =
    useState<IProductReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const loadReviews = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/products/${productId}/reviews?page=${page}&per_page=5`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setReviewsData(data);
      } catch {
        toast.error("Error al cargar los comentarios");
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    loadReviews(currentPage);
  }, [productId, currentPage, loadReviews]);

  const handleReviewAdded = (newReview?: IProductReview) => {
    setShowReviewForm(false);

    // Si se pasó un review nuevo, agregarlo inmediatamente a la lista
    if (newReview) {
      if (reviewsData) {
        // Si ya hay reviews, agregar el nuevo al inicio
        const updatedReviews = [newReview, ...reviewsData.reviews];
        setReviewsData({
          ...reviewsData,
          reviews: updatedReviews,
          total: reviewsData.total + 1,
        });
      } else {
        // Si no hay reviews aún, crear la estructura inicial
        setReviewsData({
          reviews: [newReview],
          total: 1,
          totalPages: 1,
          currentPage: 1,
        });
      }
    } else {
      // Si no hay review nuevo, recargar desde el backend
      loadReviews(currentPage);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Hace 1 día";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return `Hace ${Math.ceil(diffDays / 30)} meses`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-8">Comentarios</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      id="reviews"
      className="mt-16 opacity-100 transform translate-y-0 transition-all duration-700 ease-out"
      style={{
        animationDelay: "1.6s",
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Comentarios</h2>
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {showReviewForm ? "Cancelar" : "Escribir Review"}
        </button>
      </div>

      {/* Formulario de review */}
      {showReviewForm && (
        <div className="opacity-100 transform translate-y-0 transition-all duration-500 ease-out">
          <ReviewForm productId={productId} onReviewAdded={handleReviewAdded} />
        </div>
      )}

      {/* Lista de reviews */}
      {reviewsData && reviewsData.reviews.length > 0 ? (
        <div className="space-y-6">
          {reviewsData.reviews.map((review, index) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 opacity-100 transform translate-y-0 transition-all duration-500 ease-out"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  {getInitials(review.reviewer)}
                </div>
                <div>
                  <span className="font-semibold">{review.reviewer}</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(review.date_created)}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="text-gray-700"
                dangerouslySetInnerHTML={{ __html: review.review }}
              />
            </div>
          ))}

          {/* Paginación */}
          {reviewsData.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <span className="px-4 py-2 text-sm text-gray-600">
                Página {currentPage} de {reviewsData.totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === reviewsData.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No hay comentarios aún
          </h3>
          <p className="text-gray-500 mb-6">
            Sé el primero en compartir tu experiencia con este producto
          </p>
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Escribir el primer review
          </button>
        </div>
      )}
    </div>
  );
}
