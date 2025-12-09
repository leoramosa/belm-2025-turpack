/**
 * Links de redes sociales de Belm
 * Centralizados para fácil mantenimiento y actualización
 */

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/belmperu",
  facebook: "https://www.facebook.com/belmperu",
  tiktok: "https://www.tiktok.com/@belmperu",
} as const;

/**
 * Genera URL para compartir en Facebook
 */
export function getFacebookShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({
    u: url,
    ...(text && { quote: text }),
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Genera URL para compartir en Twitter/X
 */
export function getTwitterShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({
    url,
    ...(text && { text }),
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Genera URL para compartir en WhatsApp
 */
export function getWhatsAppShareUrl(url: string, text?: string): string {
  const message = text ? `${text} ${url}` : url;
  const params = new URLSearchParams({
    text: message,
  });
  return `https://wa.me/?${params.toString()}`;
}

/**
 * Genera URL para compartir en LinkedIn
 */
export function getLinkedInShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({
    url,
    ...(text && { summary: text }),
  });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Genera URL para compartir por email
 */
export function getEmailShareUrl(
  url: string,
  subject?: string,
  body?: string
): string {
  const params = new URLSearchParams({
    subject: subject || "Mira este producto en Belm",
    body: body || url,
  });
  return `mailto:?${params.toString()}`;
}

/**
 * Copia URL al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error("Error al copiar al portapapeles:", error);
    return false;
  }
}
