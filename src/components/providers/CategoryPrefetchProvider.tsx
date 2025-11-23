"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchProductCategories } from "@/services/categories";
import { ICategory } from "@/interface/ICategory";

// Cache para prefetching
const prefetchCache = new Set<string>();

export default function CategoryPrefetchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Solo hacer prefetch una vez
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    // Prefetch categorías populares
    const popularCategories = [
      "maquillaje",
      "cuidado-personal",
      "moda-y-accesorios",
      "hogar",
      "tecnologia",
    ];

    popularCategories.forEach((slug) => {
      if (!prefetchCache.has(slug)) {
        router.prefetch(`/categoria/${slug}`);
        prefetchCache.add(slug);
      }
    });

    // Prefetch productos de categorías principales (solo si no hay cache)
    const prefetchCategoryProducts = async () => {
      try {
        // Verificar si ya tenemos categorías en el cache global
        const categories = await fetchProductCategories();
        const mainCategories = categories
          .filter((cat: ICategory) => cat.parent === 0)
          .slice(0, 3);

        for (const category of mainCategories) {
          const categoryUrl = `/categoria/${category.slug}`;
          if (!prefetchCache.has(categoryUrl)) {
            router.prefetch(categoryUrl);
            prefetchCache.add(categoryUrl);
          }
        }
      } catch (error) {
        // Silenciar errores de prefetch para no afectar la UX
        console.warn("Error prefetching category products:", error);
      }
    };

    prefetchCategoryProducts();
  }, [router]);

  return <>{children}</>;
}
