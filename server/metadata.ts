
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { InferredMetadata } from "./services/ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "metadata.json");

// In-Memory Cache
let metadataCache: Map<string, InferredMetadata> = new Map();

// Load from disk
function loadMetadata() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, "utf-8");
            const data = JSON.parse(raw);
            metadataCache = new Map(Object.entries(data));
            console.log(`[Metadata] Loaded ${metadataCache.size} known types.`);
        }
    } catch (err) {
        console.error("[Metadata] Failed to load metadata:", err);
    }
}

// Save to disk
function saveMetadata() {
    try {
        const obj = Object.fromEntries(metadataCache);
        fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
    } catch (err) {
        console.error("[Metadata] Failed to save metadata:", err);
    }
}

// Initial Load
loadMetadata();

export const metadataService = {
    get: (key: string) => metadataCache.get(key),

    set: (key: string, data: InferredMetadata) => {
        metadataCache.set(key, data);
        saveMetadata();
    },

    getAll: () => Array.from(metadataCache.values()),

    has: (key: string) => metadataCache.has(key)
};
