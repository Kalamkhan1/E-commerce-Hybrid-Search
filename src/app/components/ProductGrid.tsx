"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {Product} from "../types";
import ProductCard from "./ProductCard";


const ProductGrid = () => { 

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const searchParams = useSearchParams();
    console.log("Search Params:", searchParams.get("query"));

    useEffect (() => { 
        const query = searchParams.get("query");
        if (!query) {
            return;
        }

        const fetchProducts = async () => {
            try {
                setLoading(true);
               

                const response = await fetch("/api/search", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ query }),
                });
                const data = await response.json();
                setProducts(data);


            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
            
            setLoading(false);
            }
        };

        fetchProducts();
    },[searchParams]);


    if(loading) {
        return <p className="text-gray-500 text-center mt-5">Loading products...</p>
    }

    if(!products.length) {
        return <p className="text-gray-500 text-center mt-5">No products found. Try a different search.</p>
    }


    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
        ))}

    </div>
    );


};

export default ProductGrid;