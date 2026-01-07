"use client";

import { useRouter } from "next/navigation";
import { IoIosSearch } from "react-icons/io";

const SearchFilter = () => {

    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const query = formData.get("query")?.toString().trim();
        if (query) router.push(`/?query=${encodeURIComponent(query)}`);
    };

    return (
        <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
            <div className="relative mb-8">
                <input name="query" type="text" placeholder="Search products..."
                    className="w-full pl-12 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] rounded-xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-lg text-lg placeholder-[var(--muted-foreground)] transition-all" autoComplete="off" />
                <IoIosSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[var(--muted-foreground)]" />
            </div>
        </form>
    );
};


export default SearchFilter