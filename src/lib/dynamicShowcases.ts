import "server-only";

import { DynamicShowcase } from "@/interface/IDynamicShowcase";
import { IProductCategory, IProductCategoryNode } from "@/types/ICategory";
import { IProduct } from "@/types/product";
import { DynamicShowcaseService } from "@/services/admin/dynamicShowcaseService";
import { fetchProducts } from "@/services/products";
import { fetchProductCategoriesTree } from "@/services/categories";

// Funciones auxiliares para carga de datos en el servidor
function findCategoryBySlug(
  nodes: IProductCategoryNode[],
  slug: string,
  visited: Set<number> = new Set()
): IProductCategoryNode | null {
  for (const node of nodes) {
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

function collectCategoryIds(
  category: IProductCategoryNode,
  accumulator: Set<number>,
  visited: Set<number> = new Set()
) {
  if (visited.has(category.id)) {
    return;
  }
  visited.add(category.id);
  accumulator.add(category.id);

  if (category.children && category.children.length > 0) {
    for (const child of category.children) {
      collectCategoryIds(child, accumulator, visited);
    }
  }
}

function filterProductsByCategory(
  products: IProduct[],
  category: IProductCategoryNode
): IProduct[] {
  const categoryIds = new Set<number>();
  const visited = new Set<number>();
  collectCategoryIds(category, categoryIds, visited);

  return products.filter((product) =>
    product.categories.some((productCategory) =>
      categoryIds.has(productCategory.id)
    )
  );
}

function categoryNodeToIProductCategory(
  category: IProductCategoryNode
): IProductCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

// Función para cargar datos en el servidor (SSR)
export async function loadDynamicProductShowcases(): Promise<
  DynamicShowcase[]
> {
  try {
    const showcaseSlides =
      await DynamicShowcaseService.getEnabledDynamicShowcases();

    if (showcaseSlides.length === 0) {
      return [];
    }

    const [allProducts, allCategories] = await Promise.all([
      fetchProducts({ fetchAll: true, includeOutOfStock: false }),
      fetchProductCategoriesTree(),
    ]);

    const showcasesWithProducts: DynamicShowcase[] = [];

    for (const slide of showcaseSlides) {
      try {
        const category = findCategoryBySlug(allCategories, slide.category_key);

        if (!category) {
          showcasesWithProducts.push({
            mediaItem: {
              id: slide.id,
              source_url:
                slide.source_url || `/placeholder-${slide.category_key}.jpg`,
              alt_text: slide.alt_text,
            },
            categoryName: slide.category_name,
            categorySlug: slide.category_key,
            products: [],
            categoryData: null,
          });
          continue;
        }

        const categoryProducts = filterProductsByCategory(
          allProducts,
          category
        );
        const limitedProducts = categoryProducts.slice(0, 25);
        const categoryData = categoryNodeToIProductCategory(category);

        showcasesWithProducts.push({
          mediaItem: {
            id: slide.id,
            source_url:
              slide.source_url || `/placeholder-${slide.category_key}.jpg`,
            alt_text: slide.alt_text,
          },
          categoryName: slide.category_name,
          categorySlug: slide.category_key,
          products: limitedProducts,
          categoryData: categoryData,
        });
      } catch {
        showcasesWithProducts.push({
          mediaItem: {
            id: slide.id,
            source_url:
              slide.source_url || `/placeholder-${slide.category_key}.jpg`,
            alt_text: slide.alt_text,
          },
          categoryName: slide.category_name,
          categorySlug: slide.category_key,
          products: [],
          categoryData: null,
        });
      }
    }

    return showcasesWithProducts;
  } catch {
    return [];
  }
}
