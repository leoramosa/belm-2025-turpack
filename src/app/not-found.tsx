import Link from "next/link";
import { Home, Search, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex py-20 items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-4">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-lg">
        {/* 404 Number */}
        <div className="text-8xl font-bold text-primary opacity-80">404</div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-zinc-900">
          Página no encontrada
        </h1>

        {/* Description */}
        <p className="text-base text-zinc-600 max-w-md">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
          Puede que el enlace sea incorrecto o que la página haya sido
          eliminada.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </Link>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/10 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ShoppingBag className="w-4 h-4" />
            Ver tienda
          </Link>

          {/* <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            <Search className="w-4 h-4" />
            Buscar productos
          </Link> */}
        </div>
      </div>
    </div>
  );
}
