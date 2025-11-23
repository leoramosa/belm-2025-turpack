import { IProduct } from "@/interface/IProduct";
import Link from "next/link";
import Image from "next/image";
import { getColorHex } from "@/utils/colors";
import { memo } from "react";

interface LoMasNuevoProductCardProps {
  product: IProduct;
  viewMode?: "grid" | "list";
}

const LoMasNuevoProductCard = memo(function LoMasNuevoProductCard({
  product,
  viewMode = "grid",
}: LoMasNuevoProductCardProps) {
  // Extraer colores si existen como atributo
  const colorAttr = product.attributes?.find(
    (a) =>
      a.name.toLowerCase() === "color" || a.name.toLowerCase() === "colores"
  );
  const colors = colorAttr?.options || [];

  // Lógica de descuento para productos variables (igual que NewProducts)
  const isVariableProduct = product.variations && product.variations.length > 0;
  const getDefaultVariationForPricing = () => {
    if (!product.variations || product.variations.length === 0) return null;
    return product.variations[0];
  };
  const defaultVariationForPricing = getDefaultVariationForPricing();

  const currentPrice = defaultVariationForPricing?.price || product.price;
  const currentRegularPrice =
    defaultVariationForPricing?.regular_price || product.regular_price;
  const currentSalePrice =
    defaultVariationForPricing?.sale_price || product.sale_price;

  const hasDiscount =
    currentSalePrice &&
    currentRegularPrice &&
    parseFloat(currentSalePrice) < parseFloat(currentRegularPrice) &&
    currentSalePrice !== currentRegularPrice;

  // Para productos variables, usar la imagen de la primera variación si está disponible
  const getProductImage = () => {
    if (
      product.variations &&
      product.variations.length > 0 &&
      product.variations[0].image?.src
    ) {
      return product.variations[0].image.src;
    }
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    return product.image?.sourceUrl || "/logo-belm-v2.png";
  };

  const productImage = getProductImage();

  // Función para limpiar HTML
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "");
  };

  // Vista horizontal (list)
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row gap-6 items-center transition hover:shadow-lg">
        <div className="relative w-full md:w-56 flex-shrink-0">
          <Link
            href={`/product/${product.slug}`}
            prefetch={false}
            className="block group"
          >
            <div className="relative w-full h-48">
              <Image
                src={productImage}
                alt={product.name}
                fill
                className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, 224px"
                priority={false}
                loading="lazy"
              />
            </div>
          </Link>
          {/* Badges NUEVO y OFERTA */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <div className="bg-green-500 text-white px-2 py-1 rounded text-sm font-semibold">
              NUEVO
            </div>
            {hasDiscount && (
              <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                Oferta
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col h-full justify-between">
          <div>
            <Link
              href={`/product/${product.slug}`}
              prefetch={false}
              className="hover:underline"
            >
              <h3 className="font-bold text-xl mb-1 cursor-pointer">
                {product.name}
              </h3>
            </Link>
            {product.tags?.[0]?.name && (
              <div className="text-xs text-gray-500 mb-1">
                by {product.tags[0].name}
              </div>
            )}
            <div className="text-gray-600 text-base mb-2 line-clamp-2">
              {stripHtml(
                product.short_description || product.description || ""
              )}
            </div>
            {/* Colores y atributos destacados */}
            {colors.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 mr-1">Color:</span>
                {colors.slice(0, 4).map((color) => (
                  <span
                    key={color}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: getColorHex(color) }}
                    title={color}
                  />
                ))}
                {colors.length > 4 && (
                  <span className="text-xs text-gray-500">
                    +{colors.length - 4} más
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mt-4">
            <div className="flex items-end gap-2">
              <span className="text-primary font-bold text-2xl">
                S/ {hasDiscount ? currentSalePrice : currentPrice}
              </span>
              {hasDiscount && (
                <span className="text-gray-400 line-through text-lg">
                  S/ {currentRegularPrice}
                </span>
              )}
              {typeof product.stock_quantity === "number" && (
                <span className="text-xs text-gray-500 ml-2">
                  {product.stock_quantity} en stock
                </span>
              )}
            </div>
            <button className="bg-primary text-white rounded-xl px-6 py-3 font-semibold hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6m8 0V9a1 1 0 00-1-1H9a1 1 0 00-1 1v4.01"
                />
              </svg>
              {isVariableProduct ? "Seleccionarr" : "Ver Producto"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista de cuadrícula (grid)
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div className="relative h-72 w-full flex-shrink-0">
        <Link href={`/product/${product.slug}`} prefetch={false}>
          <div className="relative w-full h-full">
            <Image
              src={productImage}
              alt={product.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={false}
              loading="lazy"
            />
          </div>
        </Link>
        {/* Badges NUEVO y OFERTA */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="bg-green-500 text-white px-2 py-1 rounded text-sm font-semibold">
            NUEVO
          </div>
          {hasDiscount && (
            <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
              Oferta
            </div>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col justify-between flex-grow">
        <Link href={`/product/${product.slug}`} prefetch={false}>
          <h3
            className="font-semibold text-gray-900 mb-2 hover:text-primary transition-colors h-12 overflow-hidden text-ellipsis"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {product.name}
          </h3>
        </Link>
        {/* Colores */}
        {colors.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 mr-1">Colores:</span>
            {colors.slice(0, 5).map((color) => (
              <span
                key={color}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: getColorHex(color) }}
                title={color}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-xs text-gray-500">
                +{colors.length - 5}
              </span>
            )}
          </div>
        )}
        <div className="text-gray-600 text-sm mb-2 line-clamp-2">
          {stripHtml(product.short_description || product.description || "")}
        </div>
        {/* Precios */}
        <div className="flex items-end gap-2 mb-3">
          <span className="text-lg font-bold text-primary">
            S/ {hasDiscount ? currentSalePrice : currentPrice}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              S/ {currentRegularPrice}
            </span>
          )}
        </div>
        {/* Botón */}
        <Link
          href={`/product/${product.slug}`}
          className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-300 text-center block mt-auto"
        >
          {isVariableProduct ? "Seleccionarr" : "Ver Producto"}
        </Link>
      </div>
    </div>
  );
});

export default LoMasNuevoProductCard;
