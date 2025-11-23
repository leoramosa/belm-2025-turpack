"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { IProductCategory, IProductCategoryNode } from "@/types/ICategory";

interface CategoryMegaPanelProps {
  parents: IProductCategoryNode[];
  onClose: () => void;
}

export function CategoryMegaPanel({
  parents,
  onClose,
}: CategoryMegaPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!parents.length) {
      setActiveParentId(null);
      return;
    }

    if (
      !activeParentId ||
      !parents.some((parent) => parent.id === activeParentId)
    ) {
      setActiveParentId(parents[0].id);
    }
  }, [parents, activeParentId]);

  useEffect(() => {
    if (!mounted) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [mounted, onClose]);

  const activeParent = useMemo(() => {
    if (!activeParentId) return parents[0] ?? null;
    return (
      parents.find((category) => category.id === activeParentId) ??
      parents[0] ??
      null
    );
  }, [activeParentId, parents]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-[175px] -translate-x-1/2 flex mt-4 z-50">
        <div className="w-64 bg-primary-light rounded-2xl overflow-y-auto max-h-[600px]">
          <ul className="">
            {parents.map((parent) => {
              const isActive = activeParent?.id === parent.id;
              return (
                <li key={parent.id}>
                  <button
                    type="button"
                    onClick={() => setActiveParentId(parent.id)}
                    onMouseEnter={() => setActiveParentId(parent.id)}
                    className={`p-4 cursor-pointer border-b border-b-gray-500 hover:bg-primary${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-300 bg-primary"
                    }`}
                  >
                    {parent.name}
                    <span className="ml-4 text-xs text-zinc-400">
                      {parent.children.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="w-full flex flex-wrap rounded-2xl bg-white ml-4">
          {activeParent ? (
            <div className="space-y-6">
              <div className="w-full">
                <div className="flex flex-col md:flex-row justify-between bg-primary mb-4 w-full items-center py-4 rounded-t-2xl">
                  <h3 className="text-lg font-bold text-white px-4 md:px-10">
                    {activeParent.name}
                  </h3>
                  <Link
                    href={`/categorias/${activeParent.slug}`}
                    className="text-white px-4 md:mr-10 hover:underline"
                    onClick={onClose}
                  >
                    Ver todo
                  </Link>
                </div>

                <div className="w-full">
                  <div className="flex flex-wrap w-full">
                    {activeParent.children.map((child, i) => (
                      <div
                        className="w-full md:w-1/3 pb-6 border-r border-r-gray-400 last:border-r-0"
                        key={i}
                      >
                        <div className="pr-5 pl-4 md:pl-10">
                          <strong className="text-primary">
                            <Link
                              href={`/categorias/${child.slug}`}
                              onClick={onClose}
                              className="hover:underline"
                            >
                              {child.name}
                            </Link>
                          </strong>
                          <ul className="mt-2 space-y-1 text-gray-700">
                            {child.children.map((item, idx) => (
                              <li key={idx}>
                                <Link
                                  href={`/categoria/${item.slug}`}
                                  className="text-sm hover:underline"
                                  onClick={onClose}
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
              Selecciona una categoría para ver sus subcategorías.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function CloseIcon() {
  return (
    <span className="relative block h-4 w-4">
      <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded bg-current" />
      <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded bg-current" />
    </span>
  );
}

// Componente wrapper MegaMenuServer
interface MegaMenuServerProps {
  categories: IProductCategory[] | IProductCategoryNode[];
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile?: boolean;
  maxWidth?: number;
}

export default function MegaMenuServer({
  categories,
  open,
  setOpen,
  isMobile = false,
  maxWidth,
}: MegaMenuServerProps) {
  // Convertir IProductCategory[] a IProductCategoryNode[] si es necesario
  const categoryNodes = useMemo(() => {
    if (!categories || categories.length === 0) {
      return [];
    }

    // Si ya son IProductCategoryNode[], devolverlos directamente
    if ("children" in categories[0]) {
      return categories as IProductCategoryNode[];
    }

    // Si son IProductCategory[], convertirlos a IProductCategoryNode[]
    return (categories as IProductCategory[]).map(
      (cat): IProductCategoryNode => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: "",
        parentId: null,
        count: 0,
        children: [],
      })
    );
  }, [categories]);

  // Filtrar solo las categorías padre (sin parent)
  const parentCategories = useMemo(() => {
    return categoryNodes.filter(
      (cat) => !cat.children || cat.children.length > 0
    );
  }, [categoryNodes]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    setOpen(false);
  };

  if (isMobile) {
    // Renderizado móvil simplificado
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <nav className="flex-1">
          <ul className="space-y-1">
            {parentCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categorias/${category.slug}`}
                  onClick={handleClose}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }

  // Renderizado desktop con panel mega
  return <CategoryMegaPanel parents={parentCategories} onClose={handleClose} />;
}
