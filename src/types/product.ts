import {
  IProductCategory,
  IProductCategoryNode,
  WordpressCategoryResponse,
} from "./ICategory";

export type {
  IProductCategory,
  IProductCategoryNode,
  WordpressCategoryResponse,
};

export interface ProductImage {
  id: number;
  alt: string;
  src: string;
  variationId?: number | null;
  attributes?: Record<string, string>;
}

export interface ProductAttributeOption {
  id: number | null;
  name: string;
  slug: string | null;
  description: string | null;
}

export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  visible: boolean;
  variation: boolean;
  options: ProductAttributeOption[];
}

export interface ProductVariationAttribute {
  id: number;
  name: string;
  slug: string;
  option: string;
}

export interface ProductVariation {
  id: number;
  name: string;
  sku?: string | null;
  price: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  image: ProductImage | null;
  attributes: ProductVariationAttribute[];
  stockQuantity?: number | null; // Cantidad disponible en inventario para esta variación
}

export interface ProductPricing {
  price: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  currency: string;
}

export interface IProductTag {
  id: number;
  name: string;
  slug: string;
}

export interface IProductBrand {
  id: number;
  name: string;
  slug: string;
}

export interface IProductAttributeGlobal {
  id: number;
  name: string;
  slug: string;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface IProduct {
  id: number;
  slug: string;
  name: string;
  type: string;
  permalink?: string;
  description: string;
  shortDescription: string;
  sku?: string | null;
  stockStatus: string | null;
  stockQuantity?: number | null; // Cantidad disponible en inventario (no se muestra visualmente)
  pricing: ProductPricing;
  images: ProductImage[];
  categories: IProductCategory[];
  attributes: ProductAttribute[];
  variations: ProductVariation[];
  tags?: IProductTag[];
  brands?: IProductBrand[];
}

export interface WordpressProductResponse {
  id: number;
  slug: string;
  name: string;
  type?: string;
  permalink?: string;
  description: string;
  short_description: string;
  sku?: string;
  stock_status: string | null;
  stock_quantity?: number | null;
  manage_stock?: boolean;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  currency?: string;
  images?: Array<{
    id: number;
    src: string;
    alt?: string;
    name?: string;
  }>;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  brands?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  attributes?: WordpressProductAttribute[];
  variations?: number[];
}

export interface WordpressProductAttribute {
  id: number;
  name: string;
  slug: string;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WordpressAttributeTerm {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface WordpressVariationResponse {
  id: number;
  sku?: string | null;
  price?: string | null;
  regular_price?: string | null;
  sale_price?: string | null;
  stock_quantity?: number | null;
  manage_stock?: boolean;
  image?: {
    id: number;
    src: string;
    alt?: string;
    name?: string;
  } | null;
  attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
}
