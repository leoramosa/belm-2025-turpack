import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Categoría no encontrada
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Puede que haya sido eliminada o que el enlace sea incorrecto.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
