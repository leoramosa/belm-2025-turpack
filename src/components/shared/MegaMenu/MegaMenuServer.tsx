"use client";

import { useState, useEffect, useCallback } from "react";
import { FiMenu } from "react-icons/fi";
import { MdOutlineClose } from "react-icons/md";
import { IProductCategoryNode } from "@/types/ICategory";
import Link from "next/link";

// Constantes de ordenamiento fuera del componente para evitar dependencias
const categoryOrder = [
  "MAQUILLAJE",
  "MODA Y ACCESORIOS",
  "CUIDADO FACIAL",
  "CUIDADO CORPORAL",
  "CABELLO",
  "FRAGANCIAS",
];

const maquillajeSubcategoryOrder = [
  "ROSTRO",
  "LABIOS",
  "OJOS",
  "UÑAS",
  "ACCESORIOS",
];

const modaAccesoriosSubcategoryOrder = [
  "CARTERAS Y BOLSOS",
  "ACCESORIOS",
  "CALZADO MUJER",
  "JOYERIA",
];

const cuidadoFacialSubcategoryOrder = [
  "LIMPIEZA",
  "HUMECTANTES",
  "MASCARILLAS",
  "CUIDADO DE LOS OJOS",
  "PROTECTOR SOLAR",
  "ACCESORIOS",
];

const cuidadoCorporalSubcategoryOrder = [
  "HIDRATANTES CORPORALES",
  "BAÑO Y DUCHA",
  "DESODORANTES Y ANTITRASNPIRANTE",
  "PROTECTOR SOLAR",
  "ACCESORIOS",
];

const cabelloSubcategoryOrder = [
  "LIMPIEZA Y TRATAMIENTO",
  "ESTILOS",
  "TRATAMIENTO",
  "ACCESORIOS",
];

const fraganciasSubcategoryOrder = ["PERFUMES", "COLONIAS"];

interface MegaMenuServerProps {
  categories: IProductCategoryNode[];
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
  // Hooks siempre al inicio
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [panel, setPanel] = useState<"padre" | "hijo" | "nieto">("padre");
  const [selectedPadre, setSelectedPadre] =
    useState<IProductCategoryNode | null>(null);
  const [selectedHijo, setSelectedHijo] = useState<IProductCategoryNode | null>(
    null
  );

  // Organizar categorías por jerarquía (las categorías ya vienen como árbol con children)
  const parentCategories = categories.filter(
    (cat) => !cat.parentId || cat.parentId === null
  );
  const getChildren = useCallback(
    (parentId: number) => {
      // Buscar la categoría padre y retornar sus hijos
      const findCategoryById = (
        cats: IProductCategoryNode[],
        id: number
      ): IProductCategoryNode | null => {
        for (const cat of cats) {
          if (cat.id === id) return cat;
          if (cat.children && cat.children.length > 0) {
            const found = findCategoryById(cat.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const parentCategory = findCategoryById(categories, parentId);
      const children = parentCategory?.children
        ? [...parentCategory.children]
        : [];

      // Ordenar subcategorías de MAQUILLAJE
      if (
        parentCategory &&
        parentCategory.name.toUpperCase() === "MAQUILLAJE"
      ) {
        return children.sort((a, b) => {
          const aIndex = maquillajeSubcategoryOrder.indexOf(
            a.name.toUpperCase()
          );
          const bIndex = maquillajeSubcategoryOrder.indexOf(
            b.name.toUpperCase()
          );
          return aIndex - bIndex;
        });
      }

      // Ordenar subcategorías de MODA Y ACCESORIOS
      if (
        parentCategory &&
        parentCategory.name.toUpperCase() === "MODA Y ACCESORIOS"
      ) {
        return children.sort((a, b) => {
          const aIndex = modaAccesoriosSubcategoryOrder.indexOf(
            a.name.toUpperCase()
          );
          const bIndex = modaAccesoriosSubcategoryOrder.indexOf(
            b.name.toUpperCase()
          );
          return aIndex - bIndex;
        });
      }

      // Ordenar subcategorías de CUIDADO FACIAL
      if (
        parentCategory &&
        parentCategory.name.toUpperCase() === "CUIDADO FACIAL"
      ) {
        return children.sort((a, b) => {
          const aIndex = cuidadoFacialSubcategoryOrder.indexOf(
            a.name.toUpperCase()
          );
          const bIndex = cuidadoFacialSubcategoryOrder.indexOf(
            b.name.toUpperCase()
          );
          return aIndex - bIndex;
        });
      }

      // Ordenar subcategorías de CUIDADO CORPORAL
      if (
        parentCategory &&
        parentCategory.name.toUpperCase() === "CUIDADO CORPORAL"
      ) {
        return children.sort((a, b) => {
          const aIndex = cuidadoCorporalSubcategoryOrder.indexOf(
            a.name.toUpperCase()
          );
          const bIndex = cuidadoCorporalSubcategoryOrder.indexOf(
            b.name.toUpperCase()
          );
          return aIndex - bIndex;
        });
      }

      // Ordenar subcategorías de CABELLO
      if (parentCategory && parentCategory.name.toUpperCase() === "CABELLO") {
        return children.sort((a, b) => {
          const aIndex = cabelloSubcategoryOrder.indexOf(a.name.toUpperCase());
          const bIndex = cabelloSubcategoryOrder.indexOf(b.name.toUpperCase());
          return aIndex - bIndex;
        });
      }

      // Ordenar subcategorías de FRAGANCIAS
      if (
        parentCategory &&
        parentCategory.name.toUpperCase() === "FRAGANCIAS"
      ) {
        return children.sort((a, b) => {
          const aIndex = fraganciasSubcategoryOrder.indexOf(
            a.name.toUpperCase()
          );
          const bIndex = fraganciasSubcategoryOrder.indexOf(
            b.name.toUpperCase()
          );
          return aIndex - bIndex;
        });
      }

      // Para otras categorías, mantener el orden del backend (fecha de creación)
      return children;
    },
    [categories]
  );

  useEffect(() => {
    if (open && parentCategories.length > 0) {
      const firstValid = parentCategories.find(
        (cat) => getChildren(cat.id).length > 0
      );
      if (firstValid && !activeCategory) {
        setActiveCategory(firstValid.id);
      }
    }
  }, [open]);

  // Resetear estados cuando el menú se cierra
  useEffect(() => {
    if (!open) {
      setPanel("padre");
      setSelectedPadre(null);
      setSelectedHijo(null);
      setActiveCategory(null);
    }
  }, [open]);

  const visibleCategories = parentCategories
    .filter((cat) => getChildren(cat.id).length > 0)
    .sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.name.toUpperCase());
      const bIndex = categoryOrder.indexOf(b.name.toUpperCase());
      return aIndex - bIndex;
    });

  // Función para cerrar el menú
  const handleCloseMenu = () => {
    setOpen(false);
    setPanel("padre");
    setSelectedPadre(null);
    setSelectedHijo(null);
    setActiveCategory(null);
  };

  // Mejor experiencia en tablet: panel más ancho y tipografía más grande
  const mobilePanelClass =
    "w-full sm:w-[350px] md:w-[400px] lg:w-[500px] mx-auto";

  if (isMobile) {
    // Mobile slide panel navigation: padre -> hijo -> nieto
    // Panel padre
    if (panel === "padre") {
      return (
        <nav className={mobilePanelClass}>
          <div className="bg-primary-light px-4 py-4 font-bold text-primary text-xl md:text-2xl">
            ¡HOLA!
          </div>
          <ul className="flex flex-col gap-1">
            {visibleCategories.map((cat) => (
              <li key={cat.id}>
                <button
                  className="w-full text-left px-4 py-3  text-primary flex items-center justify-between border-b border-secondary text-md md:text-xl"
                  onClick={() => {
                    setSelectedPadre(cat);
                    setPanel("hijo");
                  }}
                >
                  {cat.name}
                  <span className="ml-2">&gt;</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      );
    }

    // Panel hijo
    if (panel === "hijo" && selectedPadre) {
      const hijos = getChildren(selectedPadre.id);
      return (
        <nav className={mobilePanelClass}>
          <button
            className="w-full text-left px-4 py-3 font-base text-primary flex items-center border-b bg-primary-light text-md md:text-xl"
            onClick={() => setPanel("padre")}
          >
            <span className="mr-2">&lt;</span> Volver al menú principal
          </button>
          <div className="bg-primary-light px-4 py-2  flex justify-between items-center text-white bg-secondary text-lg md:text-2xl border-b   transition-colors cursor-pointer">
            <Link
              href={`/categorias/${selectedPadre.slug}`}
              onClick={handleCloseMenu}
            >
              {selectedPadre.name}
            </Link>
            <Link
              className="border border-white rounded-md px-2 py-1 text-xs lg:text-sm text-white"
              href={`/categorias/${selectedPadre.slug}`}
              onClick={handleCloseMenu}
            >
              Ver todo
            </Link>
          </div>

          <ul className="flex flex-col gap-1">
            {hijos.map((hijo) => (
              <li key={hijo.id} className="flex items-center">
                <button
                  className="w-full text-left px-4 py-3  text-primary flex items-center justify-between border-b border-secondary text-md md:text-xl"
                  onClick={() => {
                    setSelectedHijo(hijo);
                    setPanel("nieto");
                  }}
                >
                  {hijo.name}
                  <span className="ml-2">&gt;</span>
                </button>
              </li>
            ))}
            <li></li>
          </ul>
        </nav>
      );
    }

    // Panel nieto
    if (panel === "nieto" && selectedPadre && selectedHijo) {
      const nietos = getChildren(selectedHijo.id);
      return (
        <nav className={mobilePanelClass}>
          <button
            className="w-full text-left px-4 py-3 font-base text-primary flex items-center border-b bg-primary-light text-md md:text-xl"
            onClick={() => setPanel("hijo")}
          >
            <span className="mr-2">&lt;</span> Volver a {selectedPadre.name}
          </button>
          <Link
            href={`/categorias/${selectedHijo.slug}`}
            className="bg-primary-light px-4 py-2  text-white bg-secondary text-lg md:text-2xl border-b block hover:bg-primary/10 transition-colors cursor-pointer"
            onClick={handleCloseMenu}
          >
            {selectedHijo.name}
          </Link>
          <ul className="flex flex-col gap-1">
            {nietos.map((nieto) => (
              <li key={nieto.id}>
                <Link
                  href={`/categorias/${nieto.slug}`}
                  className="block px-4 py-1.5 text-primary border-b text-md md:text-xl"
                  onClick={handleCloseMenu}
                >
                  {nieto.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      );
    }
    return null;
  }
  // Desktop MegaMenu (responsive)
  return (
    <div className="relative z-50 w-full">
      <div className="flex w-full items-center bg-white h-14 overflow-x-auto scrollbar-hide">
        <div className="min-w-[120px] md:min-w-[160px] lg:min-w-[180px]">
          <button
            onClick={() => setOpen(!open)}
            className="flex flex-nowrap cursor-pointer whitespace-nowrap pr-4 md:pr-8 flex-row text-primary items-center"
          >
            {open ? (
              <MdOutlineClose className="text-primary h-7 w-7 mr-2" />
            ) : (
              <FiMenu className="text-primary h-7 w-7 mr-2" />
            )}
            <span className="hidden sm:inline">Todas las categorías</span>
          </button>
        </div>
        <ul className="flex justify-start items-center gap-2 md:gap-4 w-full overflow-x-auto scrollbar-hide">
          {visibleCategories.map((cat) => (
            <li
              key={cat.id}
              className="text-gray-500 cursor-pointer whitespace-nowrap px-2 md:px-4"
            >
              <Link href={`/categorias/${cat.slug}`} onClick={handleCloseMenu}>
                {cat.name}
              </Link>
            </li>
          ))}
          <li className=" bg-primary text-white px-2 py-1 hover:bg-secondary rounded-full cursor-pointer whitespace-nowrap  md:px-4">
            <Link href="/shop">Ver Tienda</Link>
          </li>
        </ul>
      </div>

      {open && (
        <>
          {/* Menú por encima del overlay, z-50 */}
          <div
            className="fixed left-1/2 top-[175px] -translate-x-1/2 flex mt-4 z-50"
            style={{ width: `${maxWidth ?? 1290}px`, maxWidth: "100vw" }}
          >
            <div className="w-64 bg-primary-light rounded-2xl overflow-y-auto max-h-[600px]">
              <ul>
                {visibleCategories.map((cat) => (
                  <li
                    key={cat.id}
                    className={`p-4 cursor-pointer border-b border-b-gray-500 hover:bg-primary ${
                      activeCategory === cat.id
                        ? "bg-primary text-white"
                        : "text-gray-300 bg-primary"
                    }`}
                    onMouseEnter={() => {
                      setActiveCategory(cat.id);
                    }}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full flex flex-wrap rounded-2xl bg-white ml-4">
              {visibleCategories.map(
                (cat) =>
                  activeCategory === cat.id && (
                    <div key={cat.id} className="w-full">
                      <div className="flex flex-col md:flex-row justify-between bg-primary mb-4 w-full items-center py-4 rounded-t-2xl">
                        <h3 className="text-lg font-bold text-white px-4 md:px-10">
                          {cat.name}
                        </h3>
                        <Link
                          href={`/categorias/${cat.slug}`}
                          className="text-white px-4 md:mr-10 hover:underline"
                          onClick={handleCloseMenu}
                        >
                          Ver todo
                        </Link>
                      </div>

                      <div className="w-full">
                        <div className="flex flex-wrap w-full">
                          {getChildren(cat.id).map((sub, i) => (
                            <div
                              className="w-full md:w-1/3 pb-6 border-r border-r-gray-400 last:border-r-0"
                              key={i}
                            >
                              <div className="pr-5 pl-4 md:pl-10">
                                <strong className="text-primary">
                                  <Link
                                    href={`/categorias/${sub.slug}`}
                                    onClick={handleCloseMenu}
                                    className="hover:underline"
                                  >
                                    {sub.name}
                                  </Link>
                                </strong>
                                <ul className="mt-2 space-y-1 text-gray-700">
                                  {getChildren(sub.id).map((item, idx) => (
                                    <li key={idx}>
                                      <Link
                                        href={`/categorias/${item.slug}`}
                                        className="text-sm hover:underline"
                                        onClick={handleCloseMenu}
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
                  )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
