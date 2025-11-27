import { NextRequest, NextResponse } from "next/server";
import { fetchProductReviews, createProductReview } from "@/services/reviews";

// GET - Obtener reviews de un producto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID de producto inválido" },
        { status: 400 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");
    const status =
      (searchParams.get("status") as
        | "approved"
        | "hold"
        | "spam"
        | "trash"
        | "all") || "approved";

    const reviewsResponse = await fetchProductReviews(
      productId,
      page,
      perPage,
      status
    );

    return NextResponse.json(reviewsResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("API Route - Error fetching product reviews:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor al cargar los comentarios",
      },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo review para un producto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID de producto inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validar campos requeridos
    if (
      !body.reviewer ||
      !body.reviewer_email ||
      !body.review ||
      !body.rating
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Validar rating
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "El rating debe estar entre 1 y 5" },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.reviewer_email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Crear el review
    const reviewData = {
      product_id: productId,
      reviewer: body.reviewer,
      reviewer_email: body.reviewer_email,
      review: body.review,
      rating: parseInt(body.rating),
    };

    const newReview = await createProductReview(reviewData);

    return NextResponse.json(
      {
        success: true,
        review: newReview,
        message:
          "Review creado exitosamente. Será revisado antes de publicarse.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Route - Error creating product review:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor al crear el review",
      },
      { status: 500 }
    );
  }
}
