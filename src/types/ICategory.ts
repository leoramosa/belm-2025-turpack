export interface IProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface IProductCategoryNode {
  id: number;
  name: string;
  slug: string;
  description: string;
  parentId: number | null;
  count: number;
  menuOrder?: number;
  image?: {
    id: number;
    src: string;
    alt?: string;
  } | null;
  children: IProductCategoryNode[];
}

export interface WordpressCategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  menu_order?: number;
  display?: string;
  image?: {
    id: number;
    src: string;
    alt?: string;
  } | null;
}
