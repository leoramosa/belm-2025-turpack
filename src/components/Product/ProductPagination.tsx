"use client";

import { useMemo, useEffect, useState } from "react";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  filteredItems: number;
}

export function ProductPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  filteredItems,
}: ProductPaginationProps) {
  // Resetear a página 1 si la página actual excede el total
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      onPageChange(1);
    }
  }, [totalPages, currentPage, onPageChange]);

  // Calcular páginas - debe estar antes de cualquier return condicional para cumplir las reglas de hooks
  const pages = useMemo(() => {
    const total = Math.max(1, totalPages);
    const maxVisible = 5;
    const pages: (number | string)[] = [];

    if (total <= maxVisible) {
      // Mostrar todas las páginas si hay 5 o menos
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1);

      // Calcular el rango de páginas a mostrar alrededor de la página actual
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(total - 1, currentPage + 1);

      // Ajustar si estamos cerca del inicio
      if (currentPage <= 3) {
        end = Math.min(4, total - 1);
      }

      // Ajustar si estamos cerca del final
      if (currentPage >= total - 2) {
        start = Math.max(2, total - 3);
      }

      // Agregar elipsis antes si es necesario
      if (start > 2) {
        pages.push("ellipsis-start");
      }

      // Agregar páginas del rango
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Agregar elipsis después si es necesario
      if (end < total - 1) {
        pages.push("ellipsis-end");
      }

      // Siempre mostrar última página si hay más de 1
      if (total > 1) {
        pages.push(total);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // Calcular índices de productos mostrados - debe estar antes de cualquier return condicional
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredItems);

  // Retornar null solo después de todos los hooks
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 space-y-4">
      {/* Información de resultados */}
      <div className="text-sm text-zinc-600 text-center">
        Mostrando {startIndex} - {endIndex} de {filteredItems} productos
        {filteredItems !== totalItems && (
          <span className="text-zinc-400"> (de {totalItems} total)</span>
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
            currentPage === 1
              ? "cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-primary"
          }`}
          aria-label="Página anterior"
        >
          Anterior
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-2 text-zinc-400"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg border transition ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-primary"
                }`}
                aria-label={`Ir a página ${pageNumber}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
            currentPage === totalPages
              ? "cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-primary"
          }`}
          aria-label="Página siguiente"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
