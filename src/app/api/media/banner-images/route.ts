import { NextResponse } from "next/server";

// Interfaz para los datos que devuelve el endpoint de banners del backend
interface BackendBannerItem {
  id: number;
  title: string;
  source_url: string;
  alt_text: string;
  is_enabled: boolean;
  banner_url: string;
  discount_code: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    // Usar el endpoint del backend que devuelve banners habilitados
    const response = await fetch(`${apiUrl}/wp-json/belm/v1/banners`, {
      headers: {
        "Content-Type": "application/json",
      },
      // Sin cache - siempre obtener datos frescos
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const bannerItems = await response.json();

    if (!Array.isArray(bannerItems)) {
      return NextResponse.json([]);
    }

    // Transformar a formato MediaItem compatible con el frontend existente
    const transformedItems = bannerItems.map((item: BackendBannerItem) => ({
      id: item.id,
      title: {
        rendered: item.title,
      },
      source_url: item.source_url,
      alt_text: item.alt_text,
      media_type: "image",
      date: item.created_at,
      // Campos adicionales del backend
      is_enabled: item.is_enabled,
      banner_url: item.banner_url,
      discount_code: item.discount_code,
      order: item.order,
    }));

    // Sin cache - cambios inmediatos
    return NextResponse.json(transformedItems, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching banner images:", error);
    return NextResponse.json(
      { error: "Error fetching banner images" },
      { status: 500 }
    );
  }
}
