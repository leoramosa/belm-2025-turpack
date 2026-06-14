import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

// Tipos para el webhook
interface WebhookPayload {
  action: string;
  type: string;
  id: number;
  slug?: string;
  data?: {
    id: number;
    name: string;
    slug: string;
    status: string;
    type: string;
  };
}

// Función para verificar el webhook (seguridad)
function verifyWebhook(request: NextRequest): boolean {
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("⚠️ WEBHOOK_SECRET no configurado");
    return true; // En desarrollo, permitir sin verificación
  }

  const signature = request.headers.get("x-webhook-signature");
  const body = request.body;

  if (!signature || !body) {
    return false;
  }

  // Aquí implementarías la verificación de firma HMAC
  // Por simplicidad, usamos un token simple
  return signature === webhookSecret;
}

// Función para invalidar caches específicos
async function invalidateCaches(payload: WebhookPayload) {
  const { action, type, slug } = payload;

  try {
    // Invalidar por tipo de contenido
    if (type === "product") {
      // Invalidar cache de productos
      await revalidateTag("products");
      await revalidateTag("product-categories");

      // Invalidar páginas específicas
      if (slug) {
        await revalidatePath(`/product/${slug}`);
      }
      await revalidatePath("/shop");
      await revalidatePath("/");
    } else if (type === "category") {
      // Invalidar cache de categorías
      await revalidateTag("categories");
      await revalidateTag("product-categories");

      // Invalidar páginas de categorías
      if (slug) {
        await revalidatePath(`/categoria/${slug}`);
      }
      await revalidatePath("/categorias");
      await revalidatePath("/");
    } else if (type === "order") {
      // Invalidar cache relacionado con órdenes
      await revalidateTag("orders");
    }

    // Invalidar cache general en cambios importantes
    if (action === "created" || action === "updated" || action === "deleted") {
      await revalidateTag("dynamic-showcases");
      await revalidateTag("featured-categories");
      await revalidatePath("/");
    }
  } catch (error) {
    console.error("❌ Error invalidando cache:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar webhook
    if (!verifyWebhook(request)) {
      console.warn("⚠️ Webhook no verificado");
      return NextResponse.json(
        { error: "Webhook no autorizado" },
        { status: 401 }
      );
    }

    // Parsear payload
    const payload: WebhookPayload = await request.json();

    // Invalidar caches
    await invalidateCaches(payload);

    return NextResponse.json({
      success: true,
      message: "Cache invalidado exitosamente",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Error procesando webhook:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

// Método GET para testing
export async function GET() {
  return NextResponse.json({
    message: "Webhook endpoint activo",
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: "/api/webhooks/invalidate-cache",
    },
  });
}
