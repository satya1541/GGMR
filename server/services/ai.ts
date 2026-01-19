
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const API_KEY = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log("[AI] Service Initialized");
} else {
    console.warn("[AI] Warning: GEMINI_API_KEY not found in .env");
}

export interface InferredMetadata {
    originalKey: string;
    label: string;
    unit: string;
    description: string;
    category: "sensor" | "status" | "technical" | "other";
}

export async function inferMetadata(key: string, sampleValue: any): Promise<InferredMetadata> {
    if (!genAI) {
        return {
            originalKey: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            unit: "",
            description: "Auto-detected field",
            category: "other"
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
        Act as an IoT Data Expert. I have a raw JSON data field from a sensor.
        Key: "${key}"
        Sample Value: ${JSON.stringify(sampleValue)}

        Infer the most likely human-readable Name, Unit, and Description.
        Return ONLY valid JSON in this format:
        {
            "label": "Human Readable Name",
            "unit": "Unit (or empty string)",
            "description": "Short explanation",
            "category": "sensor" | "status" | "technical" | "other"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        let cleanerText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const json = JSON.parse(cleanerText);

        return {
            originalKey: key,
            ...json
        };

    } catch (err) {
        console.error("[AI] Inference failed:", err);
        // Fallback
        return {
            originalKey: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            unit: "",
            description: "Auto-detected field",
            category: "other"
        };
    }
}
