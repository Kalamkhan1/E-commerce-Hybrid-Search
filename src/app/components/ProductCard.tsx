
"use client";

import Image from "next/image";
import { Product } from "../types";
import Link from "next/link";

type ProductCardProps = {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {

    return (
        <div className="group relative bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <Link href={`/products/${product.id}`} className="block">
                {/* Product Image*/}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <Image src={product.image[0] || `/public/globe.svg`} alt={product.name} fill
                        className="object-cover group-hover:opacity-90 transition-transform duration-300"
                        sizes="(max-width:640px) 11vw, (max-width:1024px) 50vw, 25vw" />

                    {/* Stock Status Badge */}
                    {product.bestseller && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-semibold px-2 py-1 rounded">
                            Bestseller
                        </div>
                    )}

                </div>

                {/* Product Info*/}
                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {product.name}
                    </h3>

                    {/* Rating*/}
                    {product.rating && (
                        <div className="mt-1 flex items-center text-gray-900">
                            <div className="flex">{product.rating} ★</div>
                        </div>
                    )}

                    {/* Price*/}
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                            ${product.price.toFixed(2)}
                        </p>
                    </div>

                    {/* Colors*/}
                    {product.colors && product.colors.length > 0 && (
                        <div className="mt-2 ">
                            <p className="text-xs text-gray-500">
                                Colors:
                            </p>
                            <div className="flex space-x-2 mt-1">
                                {product.colors.map((color: string) => (
                                    <span key={color}
                                        className="w-5 h-5 rounded-full border border-gray-300"
                                        style={{ backgroundColor: color }}
                                        title={color} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );

};
