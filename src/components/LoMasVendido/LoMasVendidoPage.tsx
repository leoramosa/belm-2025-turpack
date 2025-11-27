"use client";

import { IProduct } from "@/types/product";
import { ProductGridClient } from "@/components/Product/ProductGridClient";

interface LoMasVendidoPageProps {
  products: IProduct[];
}

export default function LoMasVendidoPage({ products }: LoMasVendidoPageProps) {
  return (
    <div className="min-h-screen">
      {/* Header fuera de ProductGridClient para evitar duplicación */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-primary text-center pt-10">
          Lo más vendido
        </h1>
        <p className="text-gray-600 text-lg text-center">
          Descubre nuestros productos más populares y vendidos. Los favoritos de
          nuestros clientes con las mejores calificaciones.
        </p>
      </div>

      {/* ProductGridClient sin título ni customHeader */}
      <ProductGridClient
        products={products}
        disableAutoCategoryFilter={true}
        defaultSortBy="popularity"
      />
    </div>
  );
}
