import { ProductGrid } from "@/components/Product/ProductGrid";

export default function Shop() {
  return (
    <div className="">
      <header className="">tienda</header>

      <main>
        {/* Puedes pasar props como search o title si lo necesitas */}
        <ProductGrid />
      </main>
    </div>
  );
}
