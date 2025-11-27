"use client";

import { IProduct } from "@/types/product";
import { ProductGridClient } from "@/components/Product/ProductGridClient";

interface LoMasNuevoPageProps {
  products: IProduct[];
}

export default function LoMasNuevoPage({ products }: LoMasNuevoPageProps) {
  return (
    <div className="min-h-screen">
      {/* Header fuera de ProductGridClient para evitar duplicación */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-primary text-center pt-10">
          Lo más nuevo
        </h1>
        <p className="text-gray-600 text-lg text-center">
          Descubre nuestros productos más recientes con las últimas tendencias y
          ofertas.
        </p>
      </div>

      {/* ProductGridClient sin título ni customHeader */}
      <ProductGridClient
        products={products}
        disableAutoCategoryFilter={true}
        defaultSortBy="newest"
      />
    </div>
  );
}
