/**
 * Utilidad para copiar texto al portapapeles (solo para uso en cliente)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof window === "undefined") {
      console.warn("copyToClipboard can only be used in client components");
      return false;
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand("copy");
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    return false;
  }
}
