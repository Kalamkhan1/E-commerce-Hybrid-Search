"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { assets, products as assetsProducts } from "../../data/assets";
import { Product } from "../../types";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params); // Unwrapping params with use() for Next.js 15+
    const [product, setProduct] = useState<Product | null>(null);

    useEffect(() => {
        // In a real app, this might be an API call, but we can access local data directly for now
        // Mapping _id to id to match what we did in the API
        const found = assetsProducts.find(p => p._id === id);

        if (found) {
            // Map the internal structure to our Product type
            const mappedProduct: Product = {
                id: found._id,
                name: found.name,
                description: found.description,
                price: found.price,
                category: found.category,
                subCategory: found.subCategory,
                rating: undefined, // ratings missing in assets.js root object, but could be added later
                colors: [], // colors missing in assets.js root object
                features: [],
                sizes: found.sizes,
                image: found.image, // it is string[] now in assets.js? lets check. Yes in assets.js it is [p_img1] so array.
                bestseller: found.bestseller
            };
            setProduct(mappedProduct);
        }
    }, [id]);

    if (!product) {
        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
                <p>Loading product...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20">
            <div className="container mx-auto px-4 py-8">
                <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] mb-8 inline-block transition-colors">
                    ← Back to Search
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Image Section */}
                    <div className="space-y-4">
                        <div className="aspect-square relative overflow-hidden rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                            <Image
                                src={product.image[0]} // Use path from assets
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                        {/* Thumbnail Grid - if multiple images exist */}
                        {product.image.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {product.image.map((img, index) => (
                                    <div key={index} className="aspect-square relative overflow-hidden rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] cursor-pointer transition-colors">
                                        <Image src={img} alt={`View ${index + 1}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div>
                            {product.bestseller && (
                                <span className="inline-block bg-yellow-500/20 text-yellow-500 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-yellow-500/30">
                                    Bestseller
                                </span>
                            )}
                            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-2">
                                {product.name}
                            </h1>
                            <div className="flex items-center space-x-4 text-[var(--muted-foreground)]">
                                <span>{product.category}</span>
                                {product.subCategory && (
                                    <>
                                        <span>•</span>
                                        <span>{product.subCategory}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="text-2xl font-bold text-[var(--primary)]">
                            ${product.price.toFixed(2)}
                        </div>

                        <p className="text-[var(--muted-foreground)] leading-relaxed">
                            {product.description}
                        </p>


                        {/* Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-3 text-[var(--foreground)]">Select Size</h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map(size => (
                                        <button key={size} className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all">
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button className="w-full md:w-auto bg-[var(--primary)] text-[var(--primary-foreground)] px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity mt-8 shadow-lg shadow-blue-900/20">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
