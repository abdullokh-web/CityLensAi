import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface LandmarkAnalysis {
  name: string;
  location: string;
  shortDescription: string;
  lat?: number;
  lng?: number;
}

export interface LandmarkLocation {
  uri: string;
  title: string;
}

export interface LandmarkHistory {
  history: string;
  funFacts: string[];
  sources: { uri: string; title: string }[];
}

export async function analyzeLandmark(base64Image: string, mimeType: string): Promise<LandmarkAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: "Identify the landmark in this photo. Return the name, city/country, a one-sentence description, and its approximate latitude and longitude in JSON format with keys: name, location, shortDescription, lat, lng.",
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function fetchLandmarkLocation(landmarkName: string, location: string): Promise<LandmarkLocation | null> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find the exact location and Google Maps link for ${landmarkName} in ${location}.`,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });

  const mapsChunk = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find((chunk: any) => chunk.maps);
  
  if (mapsChunk) {
    return {
      uri: mapsChunk.maps.uri,
      title: mapsChunk.maps.title,
    };
  }

  return null;
}

export async function fetchLandmarkHistory(landmarkName: string, location: string): Promise<LandmarkHistory> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide a detailed history and 3 fun facts about ${landmarkName} in ${location}. Focus on historical significance and architectural details.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: "object" as any,
        properties: {
          history: { type: "string" },
          funFacts: { type: "array", items: { type: "string" } },
        },
        required: ["history", "funFacts"],
      },
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({
      uri: chunk.web.uri,
      title: chunk.web.title,
    }));

  const data = JSON.parse(response.text || "{}");
  return { ...data, sources };
}

export async function generateNarration(landmarkName: string, history: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a short, engaging, 2-3 sentence narration for a tourist visiting ${landmarkName}. Use the following history as context: ${history}. The tone should be like a professional tour guide.`,
  });

  return response.text || "";
}

export async function generateSpeech(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say enthusiastically: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio");
  return base64Audio;
}

export async function askQuestion(question: string, context: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are a professional tour guide. Answer the following question about a landmark: "${question}". 
    Use this context for accuracy: ${context}. 
    Provide a detailed, insightful answer.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  });

  return response.text || "I'm sorry, I couldn't find an answer to that.";
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType,
        },
      },
      {
        text: "Transcribe the audio exactly. If there is no speech, return an empty string.",
      },
    ],
  });

  return response.text || "";
}
