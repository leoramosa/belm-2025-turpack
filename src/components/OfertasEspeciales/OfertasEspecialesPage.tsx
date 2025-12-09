"use client";

import { IProduct } from "@/types/product";
import { ProductGridClient } from "@/components/Product/ProductGridClient";

interface OfertasEspecialesPageProps {
  products: IProduct[];
}

export default function OfertasEspecialesPage({
  products,
}: OfertasEspecialesPageProps) {
  return (
    <div className="min-h-screen">
      {/* Header fuera de ProductGridClient para evitar duplicación */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-primary text-center pt-10">
          Ofertas especiales - Descuentos y Promociones en Belm
        </h1>
        <p className="text-gray-600 text-lg text-center">
          Descubre nuestras mejores ofertas y promociones. Productos con
          descuentos especiales y precios únicos.
        </p>
      </div>

      {/* ProductGridClient sin título ni customHeader */}
      <ProductGridClient
        products={products}
        disableAutoCategoryFilter={true}
        defaultSortBy="sale"
      />
    </div>
  );
}
