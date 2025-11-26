import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Código de cupón es requerido" },
        { status: 400 }
      );
    }

    // Para remover un cupón, simplemente devolvemos éxito
    // El manejo del estado se hace en el frontend
    return NextResponse.json({
      success: true,
      message: "Cupón removido exitosamente",
    });
  } catch (error) {
    console.error("Error removing coupon:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
