'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IProduct } from '@/types/product';
import { ProductCard } from '@/components/Product/ProductCard';
import { getSectionIntroText } from '@/utils/contentVariation';
// Removido import de servicios - ahora usamos API routes
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface SaleProductsProps {
	products?: IProduct[];
}

const SaleProducts = ({ products: initialProducts }: SaleProductsProps) => {
	const router = useRouter();
	const [products, setProducts] = useState<IProduct[]>(initialProducts || []);
	const [loading, setLoading] = useState(!initialProducts);
	const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
	const [canGoPrev, setCanGoPrev] = useState(false);
	const [canGoNext, setCanGoNext] = useState(true);
	// Si recibimos productos como prop, ordenarlos y usarlos
	useEffect(() => {
		if (initialProducts) {
			// Ordenar productos por ID ascendente (cambiar de desc a asc)
			const sortedProducts = [...initialProducts].sort((a, b) => a.id - b.id);
			setProducts(sortedProducts);
			setLoading(false);
		} else {
			// Si no hay productos iniciales, no mostrar nada
			setProducts([]);
			setLoading(false);
		}
	}, [initialProducts]);

	// Función para actualizar el estado de las flechas
	const updateNavigationState = (swiper: SwiperType) => {
		setCanGoPrev(swiper.isBeginning === false);
		setCanGoNext(swiper.isEnd === false);
	};

	// Función para navegar
	const goToPrev = () => {
		if (swiperInstance) {
			swiperInstance.slidePrev();
		}
	};

	const goToNext = () => {
		if (swiperInstance) {
			swiperInstance.slideNext();
		}
	};

	if (loading) {
		return (
			<section className="py-16 bg-white">
				<div className="container  mx-auto px-4">
					<div className="text-center mb-8">
						<div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-gray-600 font-medium">
							Cargando ofertas especiales...
						</p>
					</div>
				</div>
			</section>
		);
	}

	if (products.length === 0) {
		return null;
	}

	return (
		<section className="lg:py-16 py-8 bg-white">
			<div className="container relative mx-auto px-4">
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<div>
						<h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
							Ofertas especiales
						</h2>
						{/* Texto introductorio único para evitar contenido duplicado */}
						<p className="text-gray-600 text-sm mt-1 hidden lg:block">
							Aprovecha nuestros beneficios de temporada y llévate lo último en
							tendencias por mucho menos, ¡No dejes pasar estos elegidos!
						</p>
					</div>
					<button
						onClick={() => router.push('/ofertas-especiales')}
						className="border border-primary text-white bg-primary lg:px-6 lg:py-3 px-4 py-2 rounded-lg hover:bg-primary-dark hover:text-white transition-colors duration-300 cursor-pointer"
					>
						Ver Más
					</button>
				</div>

				{/* Swiper */}
				<Swiper
					modules={[Navigation]}
					onSwiper={setSwiperInstance}
					onSlideChange={updateNavigationState}
					onInit={updateNavigationState}
					loop={false}
					spaceBetween={16}
					slidesPerView={2.3}
					pagination={{ clickable: true }}
					breakpoints={{
						640: {
							slidesPerView: 2.3,
						},
						768: {
							slidesPerView: 3,
						},
						1024: {
							slidesPerView: 4,
						},
						1280: {
							slidesPerView: 5,
						},
					}}
					className="pb-12"
				>
					{products.map(product => {
						// Calcular porcentaje de descuento
						const isVariableProduct =
							product.variations && product.variations.length > 0;

						// Obtener la primera variación para productos variables
						const getDefaultVariationForPricing = () => {
							if (!product.variations || product.variations.length === 0)
								return null;
							return product.variations[0];
						};
						const defaultVariationForPricing = getDefaultVariationForPricing();

						// Determinar precios y descuento basado en primera variación o producto principal
						const currentRegularPrice =
							defaultVariationForPricing?.regularPrice ??
							product.pricing.regularPrice;
						const currentSalePrice =
							defaultVariationForPricing?.salePrice ??
							product.pricing.salePrice;

						const hasDiscount =
							currentSalePrice &&
							currentRegularPrice &&
							currentSalePrice !== currentRegularPrice;

						// Calcular porcentaje de descuento
						const calculateDiscountPercentage = () => {
							if (!hasDiscount) return 0;
							const regular = currentRegularPrice ?? 0;
							const sale = currentSalePrice ?? 0;
							if (regular === 0) return 0;
							return Math.round(((regular - sale) / regular) * 100);
						};

						const discountPercentage = calculateDiscountPercentage();

						return (
							<SwiperSlide key={product.id} className="relative h-full py-5">
								<ProductCard
									product={product}
									viewMode="grid"
									context="home"
									customBadge={{
										text: 'Oferta',
										className: 'bg-orange-500',
									}}
									discountPercentage={discountPercentage}
								/>
							</SwiperSlide>
						);
					})}
				</Swiper>
				{/* Flechas de navegación inteligentes */}
				{canGoPrev && (
					<button
						onClick={goToPrev}
						className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 lg:w-15 lg:h-15 w-12 h-12 bg-primary hover:bg-primary-dark cursor-pointer  text-white border border-gray-200 rounded-full flex items-center justify-center  hover:text-white hover:shadow-lg transition-all duration-300 shadow-sm"
					>
						<svg
							className="w-5 h-5 text-white"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				)}

				{canGoNext && (
					<button
						onClick={goToNext}
						className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 lg:w-15 lg:h-15 w-12 h-12 bg-primary  text-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark hover:shadow-lg transition-all duration-300 shadow-sm"
					>
						<svg
							className="w-5 h-5 text-white"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				)}
			</div>
		</section>
	);
};

export default SaleProducts;
