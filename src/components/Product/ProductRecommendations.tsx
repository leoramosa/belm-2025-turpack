"use client";

import { IProduct } from "@/types/product";
import { ProductCard } from "./ProductCard";

interface ProductRecommendationsProps {
  recommendations: IProduct[];
  currentProduct: IProduct;
  title?: string;
}

export default function ProductRecommendations({
  recommendations,
  currentProduct,
  title = "TAMBIÉN TE PUEDE INTERESAR",
}: ProductRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 transition-opacity duration-500 ease-out opacity-100">
      <h2 className="text-2xl lg:text-4xl font-bold mb-8">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}
