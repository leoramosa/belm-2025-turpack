import { IProduct } from "@/types/product";
import { IProductCategory } from "@/types/ICategory";

export interface MediaItem {
  id: number;
  title?: {
    rendered: string;
  };
  source_url: string;
  media_type?: string;
  alt_text: string;
  date?: string;
}

export interface DynamicShowcase {
  mediaItem: MediaItem;
  categoryName: string;
  categorySlug: string;
  products: IProduct[];
  categoryData: IProductCategory | null;
}
