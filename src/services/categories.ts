import "server-only";

import {
  IProductCategoryNode,
  WordpressCategoryResponse,
} from "@/types/ICategory";
import {
  buildBasicAuthHeader,
  getWordpressApiUrl,
  getWordpressConsumerKey,
  getWordpressConsumerSecret,
} from "@/services/wordpress";

const WORDPRESS_API_URL = getWordpressApiUrl();
const WORDPRESS_WC_CONSUMER_KEY = getWordpressConsumerKey();
const WORDPRESS_WC_CONSUMER_SECRET = getWordpressConsumerSecret();

const CATEGORY_PAGE_SIZE = 100;
const CATEGORY_NAMESPACE = "/wp-json/wc/v3/products/categories";

interface CategoryNodeAccumulator extends IProductCategoryNode {
  menuOrder: number;
  children: CategoryNodeAccumulator[];
}

export async function fetchProductCategoriesTree(): Promise<
  IProductCategoryNode[]
> {
  const categories = await fetchAllCategories();
  if (!categories.length) return [];

  const map = new Map<number, CategoryNodeAccumulator>();
  const roots: CategoryNodeAccumulator[] = [];

  for (const category of categories) {
    const node: CategoryNodeAccumulator = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parent === 0 ? null : category.parent,
      count: category.count,
      image: category.image ?? null,
      children: [],
      menuOrder: category.menu_order ?? 0,
    };

    map.set(node.id, node);
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Ordenar por ID (orden de creación) en lugar de menuOrder
  sortCategoryTree(roots);
  return roots.map(compactCategoryNode);
}

async function fetchAllCategories(): Promise<WordpressCategoryResponse[]> {
  const collected: WordpressCategoryResponse[] = [];
  let page = 1;

  while (true) {
    const endpoint = buildCategoryEndpoint(page);
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: buildBasicAuthHeader(
            WORDPRESS_WC_CONSUMER_KEY,
            WORDPRESS_WC_CONSUMER_SECRET
          ),
        },
        next: {
          revalidate: 300,
        },
      });
    } catch (error) {
      console.warn("Error de red al obtener categorías:", error);
      break;
    }

    if (!response.ok) {
      console.warn(
        `No se pudieron obtener las categorías (página ${page}): ${response.status}`
      );
      break;
    }

    const rows = (await response.json()) as WordpressCategoryResponse[];
    collected.push(...rows);

    if (rows.length < CATEGORY_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return collected;
}

function buildCategoryEndpoint(page: number): string {
  const baseUrl = new URL(WORDPRESS_API_URL);
  baseUrl.pathname = `${baseUrl.pathname.replace(
    /\/$/,
    ""
  )}${CATEGORY_NAMESPACE}`;
  baseUrl.searchParams.set("per_page", CATEGORY_PAGE_SIZE.toString());
  baseUrl.searchParams.set("page", page.toString());
  baseUrl.searchParams.set("orderby", "id");
  baseUrl.searchParams.set("order", "asc");
  baseUrl.searchParams.set("hide_empty", "false");
  return baseUrl.toString();
}

function compactCategoryNode(
  node: CategoryNodeAccumulator
): IProductCategoryNode {
  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    description: node.description,
    parentId: node.parentId,
    count: node.count,
    menuOrder: node.menuOrder,
    image: node.image ?? null,
    children: node.children.map(compactCategoryNode),
  };
}

function sortCategoryTree(nodes: CategoryNodeAccumulator[]) {
  // Ordenar por ID (orden de creación) - el ID más bajo fue creado primero
  nodes.sort((a, b) => {
    return a.id - b.id;
  });

  nodes.forEach((node) => sortCategoryTree(node.children));
}
