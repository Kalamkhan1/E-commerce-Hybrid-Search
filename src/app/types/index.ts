export type Product = {
  id: string; // Mapped from _id
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string;
  rating?: string;
  colors?: string[];
  features?: string[];
  sizes?: string[];
  image: string[]; // Changed to array
  bestseller?: boolean;
};
