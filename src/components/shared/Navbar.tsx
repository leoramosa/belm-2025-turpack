"use client";

import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import Logo from "../../../public/logo.svg";
import { LuCircleUserRound } from "react-icons/lu";
import { BsBag } from "react-icons/bs";
import { FiMenu, FiHeart } from "react-icons/fi";
import { HiOutlineSearch } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { CiDeliveryTruck } from "react-icons/ci";
import { useUIStore } from "@/store/useUIStore";
import { useUserStore } from "@/store/userStore";
import type { UserState } from "@/store/userStore";
import { IProductCategoryNode } from "@/types/ICategory";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import WishlistCount from "./WishlistCount";
import MegaMenuServer from "./MegaMenu/MegaMenuServer";
import { useSelectCategories, useCategoryStore } from "@/store/categoryStore";
import { useAuth } from "@/hooks/useAuth";
import "./Navbar/navbar.css";

interface NavbarProps {
  categories?: IProductCategoryNode[];
}

export default function Navbar({ categories: propCategories }: NavbarProps) {
  const { cart } = useCartStore();
  const openCart = useUIStore((s) => s.openCart);
  const user = useUserStore((s: UserState) => s.user);
  const profile = useUserStore((s: UserState) => s.profile);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [openMegaMenu, setOpenMegaMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Obtener setCategories del store
  const setCategoriesInStore = useCategoryStore((state) => state.setCategories);

  // Usar store de categorías si está disponible, sino usar props
  const storeCategories = useSelectCategories();

  // Guardar categorías en el store cuando se reciben como props
  useEffect(() => {
    if (
      propCategories &&
      propCategories.length > 0 &&
      storeCategories.length === 0
    ) {
      setCategoriesInStore(propCategories);
    }
  }, [propCategories, storeCategories.length, setCategoriesInStore]);

  const categories = useMemo(() => {
    // Si hay categorías en el store, usarlas; sino usar props
    const result =
      storeCategories && storeCategories.length > 0
        ? storeCategories
        : propCategories || [];
    return result;
  }, [storeCategories, propCategories]);

  // Función para obtener el nombre del usuario (solo nombre, sin apellido)
  const getUserDisplayName = () => {
    // Prioridad: profile.first_name > user.displayName > user.nicename > email > default
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (user?.displayName) {
      // Si displayName tiene espacio, tomar solo la primera parte
      return user.displayName.split(" ")[0];
    }
    if (user?.nicename) {
      return user.nicename;
    }
    if (user?.user_email) {
      const emailName = user.user_email.split("@")[0];
      return emailName; // Mostrar solo la parte antes del @
    }
    if (user?.email) {
      const emailName = user.email.split("@")[0];
      return emailName; // Mostrar solo la parte antes del @
    }
    return "Mi Cuenta";
  };

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Efecto para cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Limpiar el input de búsqueda cuando se navega a la página de búsqueda
  useEffect(() => {
    if (pathname === "/search") {
      // Limpiar el input cuando se navega a /search
      setSearchQuery("");
    }
  }, [pathname]);

  const handleAccountClick = (e: React.MouseEvent) => {
    // Solo alternar el dropdown (ya sabemos que está autenticado)
    e.preventDefault();
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    // Aquí deberías llamar a la función de logout del store
    if (user) {
      // Limpiar el store de usuario
      useUserStore.getState().logout();
      router.push("/");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Búsqueda simplificada sin validación (validación removida temporalmente)
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      // Limpiar el input inmediatamente después de navegar
      setSearchQuery("");
      // Navegar a la página de búsqueda
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Memoizar el cálculo de maxWidth
  const maxWidth = useMemo(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1290) {
      return Math.max(window.innerWidth - 40, 900);
    }
    return 1290;
  }, []);

  return (
    <>
      {/* Overlay para el MegaMenu */}
      <div
        className={`overlay fixed inset-0 bg-black/40  ${
          openMegaMenu ? "open" : ""
        }`}
        onClick={() => setOpenMegaMenu(false)}
      />

      {/* Overlay para el menú móvil */}
      <div
        className={`overlay fixed inset-0 bg-black/40  ${
          mobileMenuOpen ? "open" : ""
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Banner superior con animación CSS */}
      <div className="banner bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center text-white text-sm text-center py-3 relative ">
        <div className="absolute left-4 animate-pulse hidden md:block">
          <CiDeliveryTruck className="text-white w-5 h-5" />
        </div>

        <span className="font-medium">
          Por compras mayores a S/ 149.00, envío gratis a todo el Perú
        </span>

        <div className="absolute right-4 hidden md:block">
          {/* <Link
            href="/shop"
            className="btn-animate bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 backdrop-blur-sm"
          >
            Ver Tienda
          </Link> */}
        </div>
      </div>

      {/* Header principal con efectos de scroll */}
      <header
        className={`header bg-white shadow-lg transition-all duration-300  top-0 z-50 ${
          isScrolled ? "shadow-xl" : "shadow-md"
        }`}
      >
        {/* Navbar Desktop */}
        <div className="max-w-7xl mx-auto items-center justify-between px-4 py-4 hidden md:flex">
          {/* Logo con animación */}
          <div className="logo flex items-center space-x-2 min-w-[120px] md:min-w-[160px] lg:min-w-[180px]">
            <Link href="/">
              <div className="text-2xl font-extrabold text-primary">
                <Image
                  src={Logo}
                  alt="Logo Belm"
                  width={120}
                  className="md:w-[160px] lg:w-[300px] cursor-pointer"
                />
              </div>
            </Link>
            {/* BOTÓN TEMPORAL PARA REFRESCAR CATEGORÍAS */}
          </div>

          {/* Barra de búsqueda mejorada */}
          <div className="search-container flex-1 mx-2 md:mx-6 max-w-[400px] md:max-w-[500px] lg:max-w-[600px] relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="¿Qué estás buscando hoy?"
                  className={`w-full text-gray-800 border-2 rounded-full px-5 py-3.5 text-sm focus:outline-none transition-all duration-300 ${
                    isSearchFocused
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-gray-200 hover:border-primary"
                  }`}
                />

                <button
                  type="submit"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                    isSearchFocused
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-primary hover:text-white"
                  }`}
                >
                  <HiOutlineSearch className="w-4 h-4" />
                </button>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors duration-200"
                  >
                    <IoClose className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Iconos de navegación con animaciones */}
          <div className="flex items-center space-x-4 text-gray-600 text-sm min-w-[120px] md:min-w-[160px] lg:min-w-[180px] justify-end">
            {/* Botón de cuenta con dropdown */}
            <div className="relative" ref={userDropdownRef}>
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  className="flex items-center space-x-2 group relative focus:outline-none"
                >
                  <div className="icon-animate relative">
                    <LuCircleUserRound className="w-6 h-6 transition-colors duration-300 group-hover:text-primary" />
                  </div>
                  <span className="cursor-pointer font-medium transition-colors duration-300 group-hover:text-primary hidden sm:inline">
                    {getUserDisplayName()}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={handleAccountClick}
                  className="flex items-center space-x-2 group relative focus:outline-none"
                >
                  <div className="icon-animate relative">
                    <LuCircleUserRound className="w-6 h-6 transition-colors duration-300 group-hover:text-primary" />
                  </div>
                  <span className="cursor-pointer font-medium transition-colors duration-300 group-hover:text-primary hidden sm:inline">
                    {getUserDisplayName()}
                  </span>
                </button>
              )}

              {/* Dropdown del usuario */}
              {isAuthenticated && userDropdownOpen && (
                <div className="absolute cursor-pointer left-0 top-full mt-1 w-auto min-w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-70">
                  {/* Información del usuario */}
                  <div className="px-3 py-2 border-b border-gray-200">
                    <div className="font-semibold text-gray-900 text-sm">
                      {getUserDisplayName()}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {profile?.email || user?.user_email || user?.email || ""}
                    </div>
                  </div>

                  {/* Opciones del menú */}
                  <div className="">
                    <Link
                      href="/my-account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="cursor-pointer w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <LuCircleUserRound className="w-4 h-4" />
                      <span>Mi Perfil</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="cursor-pointer w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <span>Mis Pedidos</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="cursor-pointer w-full px-3 py-1.5 text-left text-sm text-red-800 hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 text-red-800"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Separador animado */}
            <div className="border-l border-primary h-6" />

            {/* Botón de wishlist */}
            <div>
              <Link
                href="/wishlist"
                className="flex items-center space-x-4 focus:outline-none relative group"
              >
                <div className="icon-animate relative">
                  <FiHeart className="w-6 h-6 transition-colors duration-300 group-hover:text-primary" />
                </div>
                <WishlistCount />
              </Link>
            </div>

            {/* Separador animado */}
            <div className="border-l border-primary h-6" />

            {/* Botón de carrito */}
            <div>
              <button
                type="button"
                onClick={openCart}
                className="flex items-center  focus:outline-none relative group"
              >
                <div className="icon-animate relative">
                  <BsBag className="cursor-pointer  w-6 h-6 transition-colors duration-300 group-hover:text-primary" />
                </div>

                {/* Contador de carrito con animación */}
                {cartItemCount > 0 && (
                  <span className="cart-counter bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transition-all duration-300 group-hover:bg-primary-dark -translate-x-2">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navbar Mobile Mejorado */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Menú hamburguesa con animación */}
            <button
              type="button"
              className="btn-animate text-2xl text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(true)}
            >
              <FiMenu />
            </button>

            {/* Logo centrado */}
            <div className="logo flex-1 flex justify-center">
              <Link href="/">
                <Image
                  src={Logo}
                  alt="BELM: Skincare | Maquillaje | Accesorios"
                  width={120}
                  className="cursor-pointer"
                />
              </Link>
            </div>

            {/* Íconos de usuario y carrito */}
            <div className="flex items-center space-x-3">
              <div>
                {!isAuthenticated ? (
                  <Link
                    href="/login"
                    className="btn-animate flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <LuCircleUserRound className="w-6 h-6 text-primary" />
                  </Link>
                ) : (
                  <button
                    onClick={handleAccountClick}
                    className="btn-animate flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <LuCircleUserRound className="w-6 h-6 text-primary" />
                  </button>
                )}
              </div>

              <div>
                <Link
                  href="/wishlist"
                  className="btn-animate flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 relative"
                >
                  <FiHeart className="w-6 h-6 text-red-500" />
                  <WishlistCount />
                </Link>
              </div>

              <div>
                <button
                  type="button"
                  onClick={openCart}
                  className="btn-animate flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 relative"
                >
                  <BsBag className="w-6 h-6 text-primary" />
                  {cartItemCount > 0 && (
                    <span className="cart-counter absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Buscador mobile mejorado */}
          <div className="px-4 pb-3 flex gap-2">
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="¿Qué estás buscando hoy?"
                  className={`w-full text-gray-800 border-2 rounded-full px-4 py-3 text-sm focus:outline-none transition-colors duration-300 ${
                    isSearchFocused
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-gray-200 hover:border-primary"
                  }`}
                />

                <button
                  type="submit"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
                    isSearchFocused
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-primary hover:text-white"
                  }`}
                >
                  <HiOutlineSearch className="w-4 h-4" />
                </button>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors duration-200"
                  >
                    <IoClose className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>

            {/* Botón "Ver tienda" al lado */}
            <Link
              href="/shop"
              className="bg-primary text-white px-4 py-3 rounded-full text-sm font-medium hover:bg-primary-dark transition-colors duration-300 whitespace-nowrap flex items-center justify-center flex-shrink-0"
            >
              Ver tienda
            </Link>
          </div>
        </div>

        {/* MegaMenu Desktop con animación */}
        <div className="max-w-7xl mx-auto items-center justify-between px-2 md:px-4 relative hidden md:flex">
          <MegaMenuServer
            categories={categories}
            open={openMegaMenu}
            setOpen={setOpenMegaMenu}
            isMobile={false}
            maxWidth={maxWidth}
          />
        </div>
      </header>

      {/* Drawer menú mobile mejorado - MOVIDO FUERA DEL HEADER */}
      <div
        className={`mobile-menu fixed top-0 left-0 w-full max-w-xs h-full bg-white z-[60] shadow-2xl flex flex-col ${
          mobileMenuOpen ? "open" : ""
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b bg-gradient-to-r from-primary to-primary-dark">
          <Image
            src={Logo}
            alt="Logo Belm"
            width={100}
            className="filter brightness-0 invert"
          />
          <button
            className="btn-animate text-2xl text-white p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            <IoClose />
          </button>
        </div>
        <div className="flex flex-col h-full overflow-y-auto justify-between">
          <MegaMenuServer
            categories={categories}
            open={true}
            setOpen={setMobileMenuOpen}
            isMobile={true}
          />
          <div className="px-4 pb-8 flex flex-col gap-2">
            {!isAuthenticated ? (
              // Botones de Login/Registro cuando NO está autenticado
              <>
                <Link
                  className="w-full"
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <button className="btn-animate w-full border-2 font-semibold border-primary text-primary px-4 py-2 rounded-lg">
                    Login
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="btn-animate w-full border-2 font-semibold border-primary text-white bg-primary px-4 py-2 rounded-lg">
                    Registrate
                  </button>
                </Link>
              </>
            ) : (
              // Opciones del usuario cuando SÍ está autenticado
              <div className=" ">
                {/* Información del usuario */}
                <div className=" border border-primary rounded-lg mb-3 ">
                  <div className="px-4 py-3 border-b border-primary">
                    <div className="font-semibold text-primary text-sm">
                      {getUserDisplayName()}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {user?.user_email || user?.email}
                    </div>
                  </div>

                  {/* Opciones del menú */}

                  <Link
                    href="/my-account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-2 text-md border-b border-primary text-center text-primary hover:bg-gray-50 transition-colors duration-200"
                  >
                    <LuCircleUserRound className="w-4 h-4" />
                    <span>Mi Perfil</span>
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-2 text-md text-primary hover:bg-gray-50 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <span>Mis Pedidos</span>
                  </Link>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-3  px-4 py-3 text-md border border-red-800 text-center text-red-800 hover:bg-red-50  duration-200 w-full rounded-lg"
                >
                  <svg
                    className="w-4 h-4 text-red-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
