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
          Ofertas especiales
        </h1>
        <p className="text-gray-600 text-lg text-center">
          Descubre nuestras mejores <strong>ofertas</strong> y{" "}
          <strong>promociones</strong> en <strong>Belm</strong>. Productos con
          <strong>descuentos</strong> especiales y precios únicos. Aprovecha
          nuestras promociones limitadas.
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
