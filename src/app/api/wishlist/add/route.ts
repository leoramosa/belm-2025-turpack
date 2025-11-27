import { NextRequest, NextResponse } from "next/server";

// Función helper para extraer el token JWT del header
function getJWTToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.replace("Bearer ", "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const { product_id } = await request.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    // Extraer el token JWT del header del cliente
    const token = getJWTToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Token de autenticación requerido" },
        { status: 401 }
      );
    }

    // Proxy a la API del backend pasando el token JWT del usuario
    const response = await fetch(`${apiUrl}/wp-json/belm/v1/wishlist/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product_id }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status} - ${errorData}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Error adding to wishlist" },
      { status: 500 }
    );
  }
}
