import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${apiUrl}/wp-json/transfer-peru/v1/cuentas`);

    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudieron obtener las cuentas bancarias" },
        { status: 500 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Error de red o servidor" },
      { status: 500 }
    );
  }
}
