import { InferenceClient } from '@huggingface/inference';
import { getPineconeClient } from '../../lib/pinecone';
import { NextResponse } from 'next/server';
import { config } from "dotenv";
import { AutoTokenizer } from "@xenova/transformers";

config({ path: "../../.env.local" });

// Start: Hybrid Search Helpers (BERT Token Count)
const generateSparseVectors = async (texts: string[]) => {
    // Load Tokenizer
    const model_id = 'Xenova/bert-base-uncased';
    const tokenizer = await AutoTokenizer.from_pretrained(model_id);

    const batchSparse = [];

    for (const text of texts) {
        const tokenized = await tokenizer(text, {
            padding: true,
            truncation: true,
            maxLength: 512,
            return_token_type_ids: false
        });

        // input_ids is a BigInt64Array or similar, convert to number
        const inputIds = Array.from(tokenized.input_ids.data).map(Number);

        // Count frequency (histogram)
        const freq: Record<number, number> = {};
        for (const id of inputIds) {
            // Exclude special tokens if needed (CLS=101, SEP=102, PAD=0, MASK=103 for BERT)
            if (id !== 0 && id !== 101 && id !== 102 && id !== 103) {
                freq[id] = (freq[id] || 0) + 1;
            }
        }

        const indices = Object.keys(freq).map(Number);
        const values = Object.values(freq);
        batchSparse.push({ indices, values });
    }
    return batchSparse;
}; // End: Hybrid Search Helpers

const hybridScale = (dense: number[], sparse: { indices: number[], values: number[] }, alpha: number) => {
    if (alpha < 0 || alpha > 1) {
        throw new Error("Alpha must be between 0 and 1");
    }

    const hsparse = {
        indices: sparse.indices,
        values: sparse.values.map(v => v * (1 - alpha))
    };

    const hdense = dense.map(v => v * alpha);

    return { hdense, hsparse };
};

export const POST = async (req: Request) => {

    try {
        console.log("HF_TOKEN exists:", !!process.env.HF_TOKEN);

        const hf = new InferenceClient(process.env.HF_TOKEN);
        const { query } = await req.json();

        console.log("Received search query:", query);

        // 1. Generate Dense Embedding
        const response = await hf.featureExtraction({
            model: process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2",
            inputs: query,
            options: { wait_for_model: true }
        });


        const normalizedEmbedding = (embedding: unknown) => {
            if (typeof embedding === 'number') {
                return [embedding];
            }
            if (Array.isArray(embedding)) {
                return embedding.flatMap((item) => (Array.isArray(item) ? item : [item])).map(Number);
            }
            throw new Error("Invalid embedding format");
        };

        const denseEmbedding = normalizedEmbedding(response);

        // 2. Generate Sparse Vector
        const sparseVectors = await generateSparseVectors([query]);
        const sparseVector = sparseVectors[0];

        // 3. Hybrid Scale
        // Alpha controls weighting: 1.0 = Pure Vector, 0.0 = Pure Keyword
        const alpha = 0.5; // Default to hybrid
        const { hdense, hsparse } = hybridScale(denseEmbedding, sparseVector, alpha);

        const indexName = process.env.PINECONE_INDEX || "";
        console.log("Seeding Pinecone index:", indexName);
        const pinecone = getPineconeClient();

        const results = await pinecone.Index(indexName).query({
            vector: hdense,
            sparseVector: hsparse,
            topK: 10,
            includeMetadata: true
        });

        const products = results.matches.map((match) => {
            const metadata = match.metadata as any;
            return {
                id: match.id,
                name: metadata.name,
                description: metadata.description,
                price: metadata.price,
                category: metadata.category,
                subCategory: metadata.subCategory,
                rating: metadata.rating,
                // Split image by pipe
                image: typeof metadata.image === "string" ? metadata.image.split("|") : [],
                // Handle optional fields
                colors: typeof metadata.colors === "string" && metadata.colors
                    ? metadata.colors.split("|") : [],
                features: typeof metadata.features === "string" && metadata.features
                    ? metadata.features.split("|") : [],
                sizes: typeof metadata.sizes === "string" && metadata.sizes ? metadata.sizes.split("|") : [],
                bestseller: metadata.bestseller
            }
        });

        return NextResponse.json(products);

    } catch (error) {
        console.error("Error during search:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}