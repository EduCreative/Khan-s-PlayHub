
import { GoogleGenAI, Type } from "@google/genai";

export const fetchDailyRiddle = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  
  try {
    return JSON.parse(response.text);
  } catch (e) {
    return {
      riddle: "I have keys but no locks. I have a space but no room. You can enter, but never leave. What am I?",
      answer: "A keyboard",
      hint: "I'm right in front of you if you're on a computer."
    };
  }
};
