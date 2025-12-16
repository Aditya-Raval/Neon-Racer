import { GoogleGenAI } from "@google/genai";
import { AIVibe } from "../types";

const SYSTEM_INSTRUCTION = `
You are the "Neon DJ", a disembodied AI voice living in a vaporwave simulation from 1989. 
Your tone is nostalgic, philosophical, calm, and slightly glitchy.
You talk about: eternity, digital sunsets, grid lines, endless drives, and the beauty of low-poly geometry.
Keep responses short (under 20 words).
`;

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (e) {
  console.error("Failed to initialize Gemini client", e);
}

export const generateVibeQuote = async (context: 'start' | 'crash' | 'driving'): Promise<AIVibe> => {
  if (!ai) {
    return {
      quote: "S Y S T E M   O F F L I N E",
      mood: "static"
    };
  }

  let prompt = "";
  switch (context) {
    case 'start':
      prompt = "Give a welcoming, hype quote about starting an endless drive into the digital horizon.";
      break;
    case 'crash':
      prompt = "Give a melancholic but encouraging quote about crashing and trying again in the simulation.";
      break;
    case 'driving':
      prompt = "Give a short, deep philosophical thought about speed and neon lights.";
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        maxOutputTokens: 50,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    const text = response.text || "Loading simulation data...";
    return {
      quote: text.trim(),
      mood: "neon"
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      quote: "R E C O N N E C T I N G . . .",
      mood: "glitch"
    };
  }
};