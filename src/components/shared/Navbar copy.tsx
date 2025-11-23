"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { IProductCategoryNode } from "@/types/ICategory";
import { useSelectCategories, useCategoryStore } from "@/store/categoryStore";

import { CategoryMegaPanel } from "./MegaMenu/MegaMenuServer";

interface CategoryMenuProps {
  categories: IProductCategoryNode[];
}

export function Navbar({ categories }: CategoryMenuProps) {
  const setCategoriesInStore = useCategoryStore((state) => state.setCategories);
  const storedCategories = useSelectCategories();

  const menuCategories = storedCategories.length
    ? storedCategories
    : categories;

  useEffect(() => {
    if (categories.length) {
      setCategoriesInStore(categories);
    }
  }, [categories, setCategoriesInStore]);

  const parentCategories = useMemo(
    () => menuCategories.filter((category) => category.children.length),
    [menuCategories]
  );

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  if (!menuCategories.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <nav className="flex w-full items-center bg-white h-14 overflow-x-auto scrollbar-hide">
        <ul className="flex justify-start items-center gap-2 md:gap-4 w-full overflow-x-auto scrollbar-hide">
          {parentCategories.map((category) => (
            <Link
              key={category.id}
              href={`/categorias/${category.slug}`}
              className="text-gray-500 cursor-pointer whitespace-nowrap px-2 md:px-4"
            >
              {category.name}
            </Link>
          ))}
          <li className=" bg-primary text-white px-2 py-1 hover:bg-secondary rounded-full cursor-pointer whitespace-nowrap  md:px-4">
            <Link href="/shop">Ver Tienda</Link>
          </li>
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => setIsPanelOpen(true)}
        aria-label="Abrir menú de categorías"
        aria-expanded={isPanelOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:text-zinc-50 lg:h-10 lg:w-10"
      >
        <HamburgerIcon />
      </button>

      {isPanelOpen ? (
        <CategoryMegaPanel
          parents={parentCategories}
          onClose={() => setIsPanelOpen(false)}
        />
      ) : null}
    </div>
  );
}

function HamburgerIcon() {
  return (
    <span className="block h-4 w-4">
      <span className="block h-0.5 w-full rounded bg-current" />
      <span className="mt-1 block h-0.5 w-full rounded bg-current" />
      <span className="mt-1 block h-0.5 w-full rounded bg-current" />
    </span>
  );
}
