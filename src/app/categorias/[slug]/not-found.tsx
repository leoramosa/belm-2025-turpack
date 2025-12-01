import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <div className="flex py-40 items-center justify-center  ">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <h2 className="text-2xl font-semibold  ">Categoría no encontrada</h2>
        <p className="text-sm text-zinc-600 ">
          Puede que haya sido eliminada o que el enlace sea incorrecto.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 "
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
