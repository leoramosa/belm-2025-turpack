import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductGridClient } from '@/components/Product/ProductGridClient';
import CategorySubcategories from '@/components/CategoryPage/CategorySubcategories';
import { fetchProductCategoriesTree } from '@/services/categories';
import { fetchProducts } from '@/services/products';
import type { IProductCategoryNode } from '@/types/ICategory';
import type { IProduct } from '@/types/product';
import {
	generateCategoryMetaDescription,
	generateCategoryTitle,
} from '@/utils/seo';

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
		<div className="min-h-screen ">
			{/* Mostrar subcategorías si existen - CategorySubcategories maneja el título */}
			{category.children && category.children.length > 0 ? (
				<CategorySubcategories
					key={`subcategories-${category.id}`}
					subcategories={category.children}
					parentCategoryName={category.name}
				/>
			) : (
				/* Si no hay subcategorías, mostrar el título aquí */
				<div className="text-center mb-8">
					<h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
						{category.name}
					</h1>
					{category.description ? (
						<p className="text-gray-600 text-lg text-center">
							{category.description.replace(/<[^>]*>/g, ' ').trim()}
						</p>
					) : (
						<p className="text-gray-600 text-lg text-center">
							Explora nuestra selección de <strong>productos premium</strong> de{' '}
							{category.name.toLowerCase()}.
						</p>
					)}
				</div>
			)}

			<ProductGridClient
				key={`products-${category.id}`}
				products={filteredProducts}
				disableAutoCategoryFilter={true}
			/>
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
			title: 'Categoría no encontrada',
		};
	}

	// Optimizar título para SEO (50-60 caracteres óptimo)
	const title = generateCategoryTitle(category.name, 'Belm');
	const rawDescription = category.description
		?.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	// Optimizar metadescripción para SEO
	const description = generateCategoryMetaDescription(
		category.name,
		rawDescription
	);

	return {
		title,
		description,
		keywords: [
			category.name.toLowerCase(),
			'productos',
			'categoría',
			'productos premium',
			'envío gratis',
			'Perú',
		],
		openGraph: {
			title,
			description,
			url: `https://www.belm.pe/categorias/${slug}`,
			images: [
				{
					url: category.image?.src || '/belm-rs.jpg',
					width: 1200,
					height: 630,
					alt: category.name,
				},
			],
			type: 'website',
			siteName: 'Belm',
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [category.image?.src || '/belm-rs.jpg'],
		},
		alternates: {
			canonical: `https://www.belm.pe/categorias/${slug}`,
		},
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

	return products.filter(product =>
		product.categories.some(productCategory =>
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
		category.children.forEach(child =>
			collectCategoryIds(child, accumulator, visited)
		);
	}
}
