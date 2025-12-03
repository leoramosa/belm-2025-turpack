"server-only";

/**
 * Valida el stock disponible de productos antes de crear una orden
 * Esta función se ejecuta en el servidor para garantizar que el stock sea válido
 * incluso si múltiples usuarios intentan comprar simultáneamente
 */

interface LineItem {
  product_id: number;
  variation_id?: number;
  quantity: number;
  meta_data?: Array<{ key: string; value: string | number | boolean }>;
}

interface StockValidationResult {
  isValid: boolean;
  errors: Array<{
    productId: number;
    variationId?: number;
    requestedQuantity: number;
    availableStock: number;
    productName?: string;
    baseProductName?: string;
    attributes?: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Obtiene el stock disponible de un producto o variación desde WooCommerce
 * También obtiene información sobre el producto base y los atributos de la variación
 */
async function getProductStock(
  productId: number,
  variationId: number | undefined,
  metaData:
    | Array<{ key: string; value: string | number | boolean }>
    | undefined,
  apiUrl: string,
  authHeader: string
): Promise<{
  stock: number | null;
  productName: string;
  baseProductName: string;
  attributes: Array<{ name: string; value: string }>;
}> {
  let baseProductName = `Producto #${productId}`;
  const attributes: Array<{ name: string; value: string }> = [];

  try {
    // Primero obtener el producto base para tener su nombre
    const productUrl = `${apiUrl}/wp-json/wc/v3/products/${productId}`;
    const productResponse = await fetch(productUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (productResponse.ok) {
      const product = (await productResponse.json()) as {
        name?: string;
        attributes?: Array<{
          id: number;
          name: string;
          slug: string;
        }>;
      };
      baseProductName = product.name || baseProductName;
    }

    if (variationId) {
      // Si es una variación, obtener el stock de la variación
      const variationUrl = `${apiUrl}/wp-json/wc/v3/products/${productId}/variations/${variationId}`;
      const variationResponse = await fetch(variationUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (variationResponse.ok) {
        const variation = (await variationResponse.json()) as {
          stock_quantity: number | null;
          manage_stock: boolean;
          name?: string;
          attributes?: Array<{
            id: number;
            name: string;
            option: string;
          }>;
        };

        // Extraer atributos de la variación
        if (variation.attributes && variation.attributes.length > 0) {
          variation.attributes.forEach((attr) => {
            if (attr.name && attr.option) {
              // Limpiar el nombre del atributo (remover prefijo "pa_" si existe)
              let attributeName = attr.name;
              if (attributeName.startsWith("pa_")) {
                attributeName = attributeName.replace("pa_", "");
              }
              // Capitalizar primera letra
              attributeName =
                attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
              attributes.push({
                name: attributeName,
                value: attr.option,
              });
            }
          });
        }

        // Si no hay atributos en la variación pero hay meta_data, intentar extraer de ahí
        if (attributes.length === 0 && metaData && metaData.length > 0) {
          metaData.forEach((meta) => {
            if (meta.key && typeof meta.value === "string") {
              // Ignorar metadatos que no son atributos
              if (
                meta.key.startsWith("_") ||
                meta.key === "product_id" ||
                meta.key === "variation_id"
              ) {
                return;
              }

              // Limpiar el nombre del atributo
              let attributeName = meta.key;
              if (attributeName.startsWith("pa_")) {
                attributeName = attributeName.replace("pa_", "");
              }
              // Capitalizar y limpiar
              attributeName = attributeName
                .replace(/[_-]/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())
                .trim();

              if (attributeName && meta.value) {
                attributes.push({
                  name: attributeName,
                  value: String(meta.value),
                });
              }
            }
          });
        }

        if (variation.manage_stock && variation.stock_quantity !== null) {
          return {
            stock: variation.stock_quantity,
            productName: variation.name || baseProductName,
            baseProductName,
            attributes,
          };
        }
      }
    }

    // Si no es variación o no se encontró, obtener el stock del producto base
    if (productResponse.ok) {
      const product = (await productResponse.json()) as {
        stock_quantity: number | null;
        manage_stock: boolean;
        name?: string;
      };

      if (product.manage_stock && product.stock_quantity !== null) {
        return {
          stock: product.stock_quantity,
          productName: product.name || baseProductName,
          baseProductName,
          attributes,
        };
      }
    }

    // Si no se gestiona stock o no se encontró, retornar null (sin límite)
    return {
      stock: null,
      productName: baseProductName,
      baseProductName,
      attributes,
    };
  } catch (error) {
    console.error(
      `Error obteniendo stock para producto ${productId}, variación ${variationId}:`,
      error
    );
    // En caso de error, retornar null para permitir la orden (fallback)
    return {
      stock: null,
      productName: baseProductName,
      baseProductName,
      attributes,
    };
  }
}

/**
 * Valida el stock de todos los productos en una orden antes de crearla
 * Optimizado para hacer llamadas en paralelo en lugar de secuenciales
 */
export async function validateOrderStock(
  lineItems: LineItem[],
  apiUrl: string,
  authHeader: string
): Promise<StockValidationResult> {
  // 🆕 OPTIMIZACIÓN: Hacer todas las validaciones en paralelo en lugar de secuencial
  const stockValidations = await Promise.all(
    lineItems.map(async (item) => {
      const { stock, productName, baseProductName, attributes } =
        await getProductStock(
          item.product_id,
          item.variation_id,
          item.meta_data,
          apiUrl,
          authHeader
        );

      return {
        item,
        stock,
        productName,
        baseProductName,
        attributes,
      };
    })
  );

  // Filtrar solo los errores (productos sin stock suficiente)
  const errors: StockValidationResult["errors"] = stockValidations
    .filter(
      (validation) =>
        validation.stock !== null && validation.item.quantity > validation.stock
    )
    .map((validation) => ({
      productId: validation.item.product_id,
      variationId: validation.item.variation_id,
      requestedQuantity: validation.item.quantity,
      availableStock: validation.stock!,
      productName: validation.productName,
      baseProductName: validation.baseProductName,
      attributes: validation.attributes,
    }));

  return {
    isValid: errors.length === 0,
    errors,
  };
}
