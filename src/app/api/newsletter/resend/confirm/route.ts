import { NextRequest, NextResponse } from "next/server";
import { newsletterResendService } from "@/services/newsletterResend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token y email son requeridos" },
        { status: 400 }
      );
    }

    const result = await newsletterResendService.confirm(token, email);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Newsletter confirmation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
