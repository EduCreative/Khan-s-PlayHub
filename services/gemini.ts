
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Service for fetching AI-generated content.
 * Currently returns mock data to support deployment without an API key.
 */
export const fetchDailyRiddle = async () => {
  // Check if API Key exists before attempting to initialize
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    // Return mock data immediately if no key is present
    return {
      riddle: "I have keys but no locks. I have a space but no room. You can enter, but never leave. What am I?",
      answer: "A keyboard",
      hint: "I'm right in front of you if you're on a computer."
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a short, addictive daily brain teaser riddle for a mobile gaming app. Keep it fun and approachable.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riddle: { type: Type.STRING },
            answer: { type: Type.STRING },
            hint: { type: Type.STRING }
          },
          required: ["riddle", "answer", "hint"]
        }
      }
    });
    
    // Ensure response.text is a string before parsing to satisfy TypeScript
    const textOutput = response.text || "{}";
    return JSON.parse(textOutput);
  } catch (e) {
    console.error("Gemini API Error:", e);
    return {
      riddle: "I have keys but no locks. I have a space but no room. You can enter, but never leave. What am I?",
      answer: "A keyboard",
      hint: "I'm right in front of you if you're on a computer."
    };
  }
};
