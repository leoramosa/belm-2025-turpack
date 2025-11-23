"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { IProductCategoryNode } from "@/types/ICategory";
import { useSelectCategories, useCategoryStore } from "@/store/categoryStore";

interface CategoryMenuProps {
  categories: IProductCategoryNode[];
}

export function Category({ categories }: CategoryMenuProps) {
  const setCategories = useCategoryStore((state) => state.setCategories);
  const storedCategories = useSelectCategories();
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (categories.length) {
      setCategories(categories);
    }
  }, [categories, setCategories]);

  const menuCategories = storedCategories.length
    ? storedCategories
    : categories;

  const activeCategory = useMemo(() => {
    if (activeId === null) return null;
    return menuCategories.find((category) => category.id === activeId) ?? null;
  }, [activeId, menuCategories]);

  if (!menuCategories.length) {
    return null;
  }

  return (
    <nav
      className="relative"
      onMouseLeave={() => setActiveId(null)}
      aria-label="Categorías de productos"
    >
      <ul className="flex flex-wrap gap-3">
        {menuCategories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/categorias/${category.slug}`}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeId === category.id ? " text-white" : ""
              }`}
              onMouseEnter={() => setActiveId(category.id)}
              onFocus={() => setActiveId(category.id)}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>

      {activeCategory && activeCategory.children.length ? (
        <div className="absolute left-0 top-full z-50  mt-4 min-w-[280px] max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-900/10 ">
          <div className="grid gap-6 sm:grid-cols-2">
            {activeCategory.children.map((child) => (
              <div key={child.id} className="space-y-2">
                <Link
                  href={`/categorias/${child.slug}`}
                  className="text-sm font-semibold text-zinc-900 transition hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                >
                  {child.name}
                </Link>
                {child.children.length ? (
                  <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {child.children.map((grandchild) => (
                      <li key={grandchild.id}>
                        <Link
                          href={`/categorias/${grandchild.slug}`}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                          {grandchild.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    Sin subcategorías
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
