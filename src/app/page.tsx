import Image from "next/image";
import { Suspense } from "react";
import SeachFilter from "./components/SearchFilter";
import ProductGrid from "./components/ProductGrid";


export default function Home() {
  return (
    <div className="flex min-h-screen justify-center bg-[var(--background)] font-sans">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-col-1 md:grid-col-4 gap-8">
          <main className="md:col-span-4 flex flex-col items-center">
            <h1 className="text-5xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-cyan-400">
              Semantic Search
            </h1>
            <p className="text-[var(--muted-foreground)] text-center mb-10 max-w-lg text-lg">
              Experience next-generation search. Find exactly what you are looking for by typing natural descriptions.
            </p>
            <aside className="w-full max-w-2xl mb-12">
              <SeachFilter />
            </aside>

            <Suspense fallback={<div className="text-[var(--muted-foreground)]">Loading products...</div>}>
              <ProductGrid />
            </Suspense>

          </main>
        </div>
      </div>
    </div>
  );
}
