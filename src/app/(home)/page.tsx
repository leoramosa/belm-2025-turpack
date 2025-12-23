import HomePage from '@/components/HomePage/HomePage';
import {
	HeroBannerService,
	HeroBannerSlide,
} from '@/services/admin/heroBannerService';
import {
	FeaturedCategoriesService,
	FeaturedCategorySlide,
} from '@/services/admin/featuredCategoriesService';
import {
	fetchProducts,
	fetchBestSellerProducts,
	fetchNewProducts,
	fetchSaleProducts,
} from '@/services/products';
import { IProduct, ProductVariation } from '@/types/product';
import { DynamicShowcase } from '@/interface/IDynamicShowcase';
import { loadDynamicProductShowcases } from '@/lib/dynamicShowcases';
import type { Metadata } from 'next';

// Metadata específica para la página Home
export const metadata: Metadata = {
	title: 'BELM: Tu Tienda Online de Skincare, Belleza y Moda en Perú',
	description:
		'¿Buscas lo mejor en Skincare, Belleza y moda? Explora BELM, tu tienda especializada en Perú, con las marcas más amadas del mundo. ¡Descubre tu mejor versión hoy!',
	keywords: [
		'inicio',
		'productos premium',
		'tienda online',
		'envío gratis',
		'Perú',
		'calidad',
	],
	openGraph: {
		title: 'BELM: Tu Tienda Online de Skincare, Belleza y Moda en Perú',
		description:
			'¿Buscas lo mejor en Skincare, Belleza y moda? Explora BELM, tu tienda especializada en Perú, con las marcas más amadas del mundo. ¡Descubre tu mejor versión hoy!',
		url: 'https://www.belm.pe',
		images: [
			{
				url: '/belm-rs.jpg',
				width: 1200,
				height: 630,
				alt: 'Belm - Página de Inicio',
			},
		],
	},
	twitter: {
		title: 'BELM: Tu Tienda Online de Skincare, Belleza y Moda en Perú',
		description: 'Bienvenido a Belm, tu tienda online de productos premium.',
		images: ['/belm-rs.jpg'],
	},
	alternates: {
		canonical: 'https://www.belm.pe',
	},
};

// Revalidar la página cada 10 minutos para mejor performance
export const revalidate = 600;

// Cantidad de productos a mostrar en cada sección del home
const HOME_PRODUCTS_PER_SECTION = 27;

export default async function Home() {
	// Cargar TODOS los datos en el servidor para máxima performance
	let bannerData: HeroBannerSlide[] | null = null;
	let featuredCategoriesData: FeaturedCategorySlide[] | null = null;
	let newProducts: IProduct[] = [];
	let bestSellerProducts: IProduct[] = [];
	let saleProducts: IProduct[] = [];
	let showcaseProducts: IProduct[] = [];
	let dynamicShowcases: DynamicShowcase[] = [];

	try {
		// Cargar datos en paralelo
		const [banners, featuredCategories, dynamicShowcasesData] =
			await Promise.allSettled([
				HeroBannerService.getEnabledBanners(),
				FeaturedCategoriesService.getEnabledFeaturedCategories(),
				// Cargar dynamic showcases
				loadDynamicProductShowcases(),
			]);

		// Variable para showcase (se usará más abajo)
		const allProductsData: PromiseSettledResult<IProduct[]> | null = null;

		// Procesar resultados básicos
		bannerData = banners.status === 'fulfilled' ? banners.value : null;
		featuredCategoriesData =
			featuredCategories.status === 'fulfilled'
				? featuredCategories.value
				: null;
		dynamicShowcases =
			dynamicShowcasesData.status === 'fulfilled'
				? dynamicShowcasesData.value
				: [];

		// Procesar productos usando las funciones auxiliares del servicio
		try {
			[newProducts, bestSellerProducts, saleProducts] = await Promise.all([
				fetchNewProducts(HOME_PRODUCTS_PER_SECTION, false),
				fetchBestSellerProducts(HOME_PRODUCTS_PER_SECTION, false),
				fetchSaleProducts(HOME_PRODUCTS_PER_SECTION, false),
			]);

			// Productos para showcase: obtener algunos productos para showcase
			const showcaseData = await fetchProducts({
				perPage: 6,
				includeOutOfStock: false,
				fetchAll: false,
			});
			showcaseProducts = showcaseData;
		} catch {
			// Si falla, continuar con datos vacíos
			newProducts = [];
			bestSellerProducts = [];
			saleProducts = [];
			showcaseProducts = [];
		}
	} catch {
		// Continuar con datos vacíos, los componentes manejarán el fallback
	}

	return (
		<HomePage
			initialBannerData={bannerData || undefined}
			initialFeaturedCategoriesData={featuredCategoriesData || undefined}
			initialNewProducts={newProducts}
			initialBestSellerProducts={bestSellerProducts}
			initialSaleProducts={saleProducts}
			initialShowcaseProducts={showcaseProducts}
			initialDynamicShowcases={dynamicShowcases}
		/>
	);
}
