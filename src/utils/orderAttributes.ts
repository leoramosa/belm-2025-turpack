import { IOrderItem } from "@/interface/IOrder";

/**
 * Extrae atributos de meta_data del item de orden
 * Similar a la función en OrderDetail.tsx pero como utilidad compartida
 */
export function extractAttributes(
  item:
    | IOrderItem
    | { meta_data?: Array<{ key: string; value: string | number | boolean }> }
): Array<{ name: string; value: string }> {
  if (!item.meta_data || !Array.isArray(item.meta_data)) {
    return [];
  }

  const attributes: Array<{ name: string; value: string }> = [];

  item.meta_data.forEach(
    (meta: { key: string; value: string | number | boolean }) => {
      const key = meta.key || "";
      const value = meta.value || "";

      // Ignorar metadatos que no son atributos
      if (
        !key ||
        key.startsWith("_") ||
        key === "product_id" ||
        key === "variation_id" ||
        typeof value !== "string"
      ) {
        return;
      }

      // Si la key empieza con "pa_", remover el prefijo y capitalizar
      let attributeName = key;
      if (key.startsWith("pa_")) {
        attributeName = key.replace("pa_", "");
        attributeName =
          attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
      } else if (key.toLowerCase().includes("attribute")) {
        attributeName = key.replace(/attribute/i, "").replace(/[_-]/g, " ");
        attributeName = attributeName.trim();
        if (!attributeName) return;
      } else {
        attributeName = key;
      }

      // Limpiar y formatear el nombre del atributo
      attributeName = attributeName
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase())
        .trim();

      // Agregar el atributo si tiene un valor válido
      if (attributeName && value) {
        attributes.push({
          name: attributeName,
          value: String(value),
        });
      }
    }
  );

  return attributes;
}
