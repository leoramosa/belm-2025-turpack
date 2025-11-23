"use client";

import { useEffect } from "react";
import { ICategory } from "@/interface/ICategory";
import { IProduct } from "@/interface/IProduct";
import { useCategoriesStore } from "@/store/useCategories";
import { useProductsStore as useProductsCatalogStore } from "@/store/useProductsStore";
import { useProductsStore as useProductsPersistStore } from "@/store/useProducts";

interface CatalogHydratorProps {
  categories: ICategory[];
  products: IProduct[];
}

export default function CatalogHydrator({
  categories,
  products,
}: CatalogHydratorProps) {
  useEffect(() => {
    if (categories.length > 0) {
      useCategoriesStore.setState((state) => {
        if (state.categories.length > 0) return state;

        const categoryCache: Record<string, ICategory> = {};
        categories.forEach((category) => {
          categoryCache[category.slug] = category;
        });

        return {
          categories,
          categoryCache,
          lastFetched: Date.now(),
          isInitialized: true,
          loading: false,
          error: null,
        };
      });
    }

    if (products.length > 0) {
      const { setAllProducts } = useProductsCatalogStore.getState();
      const catalogState = useProductsCatalogStore.getState();
      if (catalogState.allProducts.length === 0) {
        setAllProducts(products);
      }

      useProductsPersistStore.setState((state) => {
        if (state.products.length > 0) return state;

        const productCache: Record<string, IProduct> = {};
        products.forEach((product) => {
          productCache[product.slug] = product;
        });

        return {
          products,
          productCache,
          lastFetched: Date.now(),
          isInitialized: true,
          loading: false,
          error: null,
        };
      });
    }
  }, [categories, products]);

  return null;
}
