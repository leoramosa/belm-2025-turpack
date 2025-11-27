"use client";

import { useState, useEffect } from "react";
import { IPost, IPostCategory } from "@/interface/IPost";
import {
  fetchPosts,
  fetchPostCategories,
  fetchFeaturedPosts,
} from "@/services/posts";
import PoliticaCard from "./PoliticaCard";
import { Search, Filter, ArrowRight, FileText } from "lucide-react";

export default function PoliticasSection() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<IPost[]>([]);
  const [categories, setCategories] = useState<IPostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const POSTS_PER_PAGE = 9;

  // Cargar posts y categorías
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar posts destacados
        const featured = await fetchFeaturedPosts(3);
        setFeaturedPosts(featured);

        // Cargar categorías
        const cats = await fetchPostCategories();
        setCategories(cats);

        // Cargar posts iniciales
        const initialPosts = await fetchPosts({
          page: 1,
          per_page: POSTS_PER_PAGE,
          category: selectedCategory || undefined,
          search: searchTerm || undefined,
        });

        setPosts(initialPosts);
        setHasMore(initialPosts.length === POSTS_PER_PAGE);
      } catch (error) {
        console.error("Error loading politicas data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedCategory, searchTerm]);

  // Cargar más posts
  const loadMorePosts = async () => {
    try {
      const nextPage = currentPage + 1;
      const morePosts = await fetchPosts({
        page: nextPage,
        per_page: POSTS_PER_PAGE,
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
      });

      if (morePosts.length > 0) {
        setPosts((prev) => [...prev, ...morePosts]);
        setCurrentPage(nextPage);
        setHasMore(morePosts.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    }
  };

  // Filtrar posts
  const handleFilter = async () => {
    setCurrentPage(1);
    setPosts([]);

    const filteredPosts = await fetchPosts({
      page: 1,
      per_page: POSTS_PER_PAGE,
      category: selectedCategory || undefined,
      search: searchTerm || undefined,
    });

    setPosts(filteredPosts);
    setHasMore(filteredPosts.length === POSTS_PER_PAGE);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Políticas del Ecommerce
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Información importante sobre nuestras políticas de privacidad,
            términos y condiciones
          </p>
        </div>

        {/* Filters */}
        <div
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white rounded-2xl p-6 shadow-lg">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar políticas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory || ""}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all duration-300"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Button */}
            <button
              onClick={handleFilter}
              className="px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              Filtrar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div
            className="mb-12 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Políticas Destacadas
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => (
                <PoliticaCard
                  key={post.id}
                  post={post}
                  featured={index === 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {searchTerm || selectedCategory
              ? "Resultados de búsqueda"
              : "Todas las políticas"}
          </h3>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron políticas
              </h4>
              <p className="text-gray-600">
                {searchTerm || selectedCategory
                  ? "Intenta con otros términos de búsqueda o categorías"
                  : "Pronto tendremos políticas disponibles"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {posts.map((post) => (
                  <PoliticaCard key={post.id} post={post} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMorePosts}
                    className="px-8 py-3 bg-secondary hover:bg-primary text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto hover:scale-105 active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    Cargar más políticas
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
