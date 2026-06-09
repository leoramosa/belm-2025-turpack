import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";
import { fetchProductCategoriesTree } from "@/services/categories";
import { fetchPosts } from "@/services/posts";
import { fetchProducts } from "@/services/products";
import type { IProductCategoryNode } from "@/types/ICategory";

export const revalidate = 3600;

function flattenCategories(
  nodes: IProductCategoryNode[]
): IProductCategoryNode[] {
  const out: IProductCategoryNode[] = [];
  const walk = (list: IProductCategoryNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

async function fetchAllPostSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  for (let page = 1; page < 40; page += 1) {
    const batch = await fetchPosts({ page, per_page: 100 });
    if (!batch.length) break;
    for (const post of batch) {
      if (post.slug) slugs.push(post.slug);
    }
    if (batch.length < 100) break;
  }
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/shop",
    "/politicas",
    "/ofertas-especiales",
    "/lo-mas-vendido",
    "/lo-mas-nuevo",
    "/order-track",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: absoluteUrl(p),
    lastModified: new Date(),
  }));

  try {
    const [products, categoryTree, postSlugs] = await Promise.all([
      fetchProducts({ fetchAll: true }),
      fetchProductCategoriesTree(),
      fetchAllPostSlugs(),
    ]);

    const now = new Date();

    const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
      url: absoluteUrl(`/productos/${p.slug}`),
      lastModified: now,
    }));

    const categoryNodes = flattenCategories(categoryTree);
    const categoryEntries: MetadataRoute.Sitemap = categoryNodes.map((c) => ({
      url: absoluteUrl(`/categorias/${c.slug}`),
      lastModified: now,
    }));

    const politicasEntries: MetadataRoute.Sitemap = postSlugs.map((slug) => ({
      url: absoluteUrl(`/politicas/${slug}`),
      lastModified: now,
    }));

    return [
      ...staticEntries,
      ...categoryEntries,
      ...productEntries,
      ...politicasEntries,
    ];
  } catch (e) {
    console.error("[sitemap] Error generando entradas dinámicas:", e);
    return staticEntries;
  }
}
