import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGridClient } from "@/components/Product/ProductGridClient";
import CategorySubcategories from "@/components/CategoryPage/CategorySubcategories";
import { fetchProductCategoriesTree } from "@/services/categories";
import { fetchProducts } from "@/services/products";
import type { IProductCategoryNode } from "@/types/ICategory";
import type { IProduct } from "@/types/product";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [categories, products] = await Promise.all([
    fetchProductCategoriesTree(),
    fetchProducts({ fetchAll: true }),
  ]);

  const category = findCategoryBySlug(categories, slug);

  if (!category) {
    notFound();
  }

  const filteredProducts = filterProductsByCategory(products, category);

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <section className="border-b border-zinc-200 ">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-12">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              Categoría
            </p>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              {category.name}
            </h1>
            {category.description ? (
              <div
                className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-400"
                dangerouslySetInnerHTML={{ __html: category.description }}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Productos disponibles: {filteredProducts.length}</span>
            {category.count ? (
              <span>Publicado en tienda: {category.count}</span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Mostrar subcategorías si existen */}
      {category.children && category.children.length > 0 && (
        <CategorySubcategories
          subcategories={category.children}
          parentCategoryName={category.name}
        />
      )}

      {filteredProducts.length ? (
        <ProductGridClient
          title={`Productos en ${category.name}`}
          products={filteredProducts}
        />
      ) : (
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            No hay productos en esta categoría
          </h2>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Te recomendamos volver al catálogo principal o explorar otras
            categorías.
          </p>
        </section>
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await fetchProductCategoriesTree();
  const category = findCategoryBySlug(categories, slug);

  if (!category) {
    return {
      title: "Categoría no encontrada",
    };
  }

  const title = `${category.name} | Tienda Store`;
  const description =
    category.description
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? `Explora productos de la categoría ${category.name}.`;

  return {
    title,
    description,
  };
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

function filterProductsByCategory(
  products: IProduct[],
  category: IProductCategoryNode
): IProduct[] {
  const categoryIds = new Set<number>();

  collectCategoryIds(category, categoryIds);

  return products.filter((product) =>
    product.categories.some((productCategory) =>
      categoryIds.has(productCategory.id)
    )
  );
}

// Función auxiliar para recopilar IDs de categoría (incluyendo hijos) con protección contra bucles
function collectCategoryIds(
  category: IProductCategoryNode,
  accumulator: Set<number>,
  visited: Set<number> = new Set()
) {
  // Protección contra bucles infinitos
  if (visited.has(category.id)) {
    return;
  }
  visited.add(category.id);
  accumulator.add(category.id);

  if (category.children && category.children.length > 0) {
    category.children.forEach((child) =>
      collectCategoryIds(child, accumulator, visited)
    );
  }
}
