"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { IProductCategoryNode } from "@/types/ICategory";

interface CategoryState {
  categories: IProductCategoryNode[];
  lastUpdated: number | null;
  setCategories: (categories: IProductCategoryNode[]) => void;
  clear: () => void;
  findBySlug: (slug: string) => IProductCategoryNode | null;
}

const initialState: Pick<CategoryState, "categories" | "lastUpdated"> = {
  categories: [],
  lastUpdated: null,
};

export const useCategoryStore = create<CategoryState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      setCategories: (categories) =>
        set((state) => {
          if (areCategoriesEqual(state.categories, categories)) {
            return state;
          }
          return {
            categories,
            lastUpdated: Date.now(),
          };
        }),
      clear: () => set(() => ({ ...initialState })),
      findBySlug: (slug: string) => findCategoryBySlug(get().categories, slug),
    }),
    {
      name: "category-store",
      enabled:
        typeof window !== "undefined" && process.env.NODE_ENV !== "production",
    }
  )
);

export function useSelectCategories() {
  return useCategoryStore((state) => state.categories);
}

export function useSelectCategoryBySlug(slug: string) {
  return useCategoryStore((state) => state.findBySlug(slug));
}

function areCategoriesEqual(
  current: IProductCategoryNode[],
  next: IProductCategoryNode[]
): boolean {
  if (current === next) return true;
  if (current.length !== next.length) return false;
  for (let index = 0; index < current.length; index += 1) {
    if (current[index].id !== next[index].id) {
      return false;
    }
  }
  return true;
}

// Función auxiliar para encontrar categoría por slug (con protección contra bucles)
function findCategoryBySlug(
  nodes: IProductCategoryNode[],
  slug: string,
  visited: Set<number> = new Set()
): IProductCategoryNode | null {
  for (const node of nodes) {
    // Protección contra bucles infinitos
    if (visited.has(node.id)) {
      continue;
    }
    visited.add(node.id);

    if (node.slug === slug) {
      return node;
    }

    if (node.children && node.children.length > 0) {
      const childMatch = findCategoryBySlug(node.children, slug, visited);
      if (childMatch) {
        return childMatch;
      }
    }
  }
  return null;
}
