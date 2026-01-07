import { Pinecone } from "@pinecone-database/pinecone"
import {config} from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, '../.env.local') });



export const getPineconeClient = () => {

    return new Pinecone({
        apiKey: process.env.PINECONE_APIKEY!,
    })

};

