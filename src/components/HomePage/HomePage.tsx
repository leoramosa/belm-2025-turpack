import HeroBanner from "./sections/HeroBanner";
import FeaturedCategories from "./sections/FeaturedCategories";
import { DynamicProductShowcases } from "./sections/DynamicProductShowcase";
import NewProducts from "./sections/NewProducts";
import BestSeller from "./sections/BestSeller";
import SaleProducts from "./sections/SaleProducts";
import { HeroBannerSlide } from "@/services/admin/heroBannerService";
import { FeaturedCategorySlide } from "@/services/admin/featuredCategoriesService";
import { IProduct } from "@/types/product";
import { DynamicShowcase } from "@/interface/IDynamicShowcase";
interface HomePageProps {
  initialBannerData?: HeroBannerSlide[];
  initialFeaturedCategoriesData?: FeaturedCategorySlide[];
  initialNewProducts?: IProduct[];
  initialBestSellerProducts?: IProduct[];
  initialSaleProducts?: IProduct[];
  initialShowcaseProducts?: IProduct[];
  initialDynamicShowcases?: DynamicShowcase[];
}

const HomePage = ({
  initialBannerData,
  initialFeaturedCategoriesData,
  initialNewProducts,
  initialBestSellerProducts,
  initialSaleProducts,
  initialShowcaseProducts,
  initialDynamicShowcases,
}: HomePageProps) => {
  return (
    <div className=" bg-linear-to-br from-purple-50 via-white to-purple-50 overflow-hidden">
      {/* SEO H1 - Palabras clave del título deben aparecer en el contenido */}
      <h1 className="sr-only">
        BELM: Skincare, Maquillaje y Accesorios - Tu tienda de belleza premium
      </h1>

      {/* Hero Banner Section */}
      <HeroBanner initialData={initialBannerData} />

      {/* Featured Categories Section */}
      <FeaturedCategories initialData={initialFeaturedCategoriesData} />

      {/* Dynamic Product Showcases Section */}
      <DynamicProductShowcases showcases={initialDynamicShowcases || []} />

      {/* New Products Section */}
      <NewProducts products={initialNewProducts} />

      {/* Best Seller Section */}
      <BestSeller products={initialBestSellerProducts} />

      {/* Sale Products Section */}
      <SaleProducts products={initialSaleProducts} />
    </div>
  );
};

export default HomePage;
