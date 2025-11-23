export interface AdminBanner {
  id: string;
  mediaItem: {
    id: number;
    title: string;
    source_url: string;
    alt_text: string;
  };
  isEnabled: boolean;
  url?: string;
  discountCode?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBannerFormData {
  isEnabled: boolean;
  url: string;
  discountCode: string;
  order: number;
}

export interface AdminCategory {
  id: string;
  mediaItem: {
    id: number;
    title: string;
    source_url: string;
    alt_text: string;
  };
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryFormData {
  isFeatured: boolean;
  order: number;
}

export interface AdminModule {
  id: string;
  name: string;
  path: string;
  icon: string;
  isActive: boolean;
}

export interface AdminStats {
  totalBanners: number;
  enabledBanners: number;
  totalCategories: number;
  featuredCategories: number;
}
