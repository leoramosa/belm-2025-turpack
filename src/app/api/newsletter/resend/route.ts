import { NextRequest, NextResponse } from "next/server";
import { newsletterResendService } from "@/services/newsletterResend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    const result = await newsletterResendService.subscribe(email);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await newsletterResendService.testConnection();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Newsletter test error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error de conexión",
      },
      { status: 500 }
    );
  }
}
