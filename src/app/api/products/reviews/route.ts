import { NextRequest, NextResponse } from "next/server";
import { fetchAllReviews } from "@/services/reviews";

// GET - Obtener todos los reviews con filtros
export async function GET(request: NextRequest) {
  try {
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
    const productId = searchParams.get("product_id")
      ? parseInt(searchParams.get("product_id")!)
      : undefined;

    const reviewsResponse = await fetchAllReviews(
      page,
      perPage,
      status,
      productId
    );

    return NextResponse.json(reviewsResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("API Route - Error fetching all reviews:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
