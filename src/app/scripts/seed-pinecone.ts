import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import path from "path";
import { getPineconeClient } from "../lib/pinecone";
import { InferenceClient } from "@huggingface/inference";
import { products } from "../data/assets";
import { AutoTokenizer } from "@xenova/transformers";

config({ path: path.resolve(__dirname, '../../../.env.local') });

// Start: Sparse Vector Generation Logic (BERT Token Count)
const generateSparseVectors = async (texts: string[], tokenizer: any) => {
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
};
// End: Sparse Vector Generation Logic

const seedPinecone = async () => {
    try {
        const indexName = process.env.PINECONE_INDEX || "";
        console.log("Seeding Pinecone index:", indexName);
        const pinecone = getPineconeClient();

        // --- Index Recreation for DotProduct ---
        const existingIndexes = await pinecone.listIndexes();
        const indexExists = existingIndexes.indexes?.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`Deleting existing index ${indexName} to recreate with dotproduct metric...`);
            await pinecone.deleteIndex(indexName);
            // Wait a bit for deletion to propagate? Pinecone is usually fast but consistency varies.
            await new Promise(r => setTimeout(r, 5000));
        }

        console.log(`Creating new index ${indexName}...`);
        await pinecone.createIndex({
            name: indexName,
            dimension: 384, // sentence-transformers/all-MiniLM-L6-v2 output dimension
            metric: 'dotproduct',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            },
            waitUntilReady: true
        });
        console.log("Index created/ready.");
        // ---------------------------------------

        const index = pinecone.Index(indexName);
        const hf = new InferenceClient(process.env.HF_TOKEN);

        console.log("Loading Tokenizer...");
        const model_id = 'Xenova/bert-base-uncased';
        const tokenizer = await AutoTokenizer.from_pretrained(model_id);
        console.log("Tokenizer loaded.");

        // batch embedding
        const batchSize = 10;

        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);

            // Text for Dense Embedding
            const inputs = batch.map(p => {
                return `${p.name}: ${p.description} Category: ${p.category} ${p.subCategory}`;
            });

            // 1. Generate Dense Embeddings
            const embeddings = await hf.featureExtraction({
                model: process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2",
                inputs: inputs,
                options: { wait_for_model: true }
            });

            // 2. Generate Sparse Vectors
            const sparseVectors = await generateSparseVectors(inputs, tokenizer);

            // prepare upsert request
            const upsertRequest = batch.map((product, idx) => ({
                id: product._id,
                metadata: {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.category,
                    subCategory: product.subCategory,
                    image: product.image.join("|"),
                    sizes: product.sizes.join("|"),
                    bestseller: product.bestseller,
                    rating: 4.5,
                    colors: "",
                    features: ""
                },
                values: Array.isArray(embeddings[idx]) ? embeddings[idx].flat(Infinity) as number[]
                    : [embeddings[idx] as number],
                sparseValues: sparseVectors[idx] // Add sparse values
            }));

            await index.upsert(upsertRequest);
            console.log(`Upserted batch ${i / batchSize + 1}`);

        }

        console.log("Seeding completed.");
    } catch (error) {
        console.error("Error seeding Pinecone:", error);
        process.exit(1);

    }

}

seedPinecone();