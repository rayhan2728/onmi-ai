
import { GoogleGenAI, Type, GenerateContentResponse, Chat, Modality } from "@google/genai";

// Standard way to get client with environment variable validation
export const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("CRITICAL ERROR: API_KEY is undefined in process.env. Ensure your deployment environment has the API_KEY variable set.");
    throw new Error("Missing API configuration. Please verify deployment secrets.");
  }
  return new GoogleGenAI({ apiKey });
};

// Internal helper to refine image prompts (Translates Bengali and adds detail)
const enhanceImagePrompt = async (userInput: string, isEdit: boolean = false, sourceContext?: string): Promise<string> => {
  try {
    const ai = getGeminiClient();
    const systemPrompt = isEdit 
      ? `You are an AI that converts image editing instructions into high-quality English prompts for a generative image model. 
         Translate any non-English text to English. 
         Your goal is to describe the FINAL desired image. 
         If the user says "add a girl next to the boy", your prompt should be "A realistic photo of a boy and a girl standing next to each other in the same style and environment as the original". 
         Focus on keeping the original subjects 'real' and consistent. 
         ${sourceContext ? `The original image contains: ${sourceContext}` : ''}`
      : "You are an AI that converts simple image generation requests into detailed English prompts. If the input is in Bengali, translate it and add artistic details like lighting, style, and composition.";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userInput,
      config: { systemInstruction: systemPrompt }
    });
    return response.text || userInput;
  } catch (err) {
    return userInput;
  }
};

// Robust Chat initialization
export const createChat = (model: string = 'gemini-3-flash-preview', systemInstruction?: string): Chat => {
  try {
    const ai = getGeminiClient();
    return ai.chats.create({
      model,
      config: { 
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });
  } catch (error) {
    console.error("Failed to initialize chat session:", error);
    throw error;
  }
};

// Robust search with detailed logging
export const performWebSearch = async (query: string) => {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response) throw new Error("Empty response from AI model.");

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    return { text, sources };
  } catch (error: any) {
    console.error("Gemini Search Error:", error.message || error);
    throw new Error(error.message || "Network connectivity issue with AI services.");
  }
};

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1") => {
  const enhancedPrompt = await enhanceImagePrompt(prompt, false);
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: enhancedPrompt }] },
    config: { imageConfig: { aspectRatio } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const editImage = async (imageB64: string, prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1") => {
  // First, get a description of the current image to maintain context
  let context = "";
  try {
    context = await analyzeImage(imageB64, "Describe this image in 10 words.") || "";
  } catch(e) {}

  // Get a high-quality English instruction for the edit
  const enhancedInstruction = await enhanceImagePrompt(prompt, true, context);
  
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageB64, mimeType: 'image/png' } },
        { text: enhancedInstruction }
      ]
    },
    config: { imageConfig: { aspectRatio } }
  });

  const candidates = response.candidates || [];
  if (candidates.length > 0) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  
  throw new Error("Image editing failed. The model might have found the request complex or unsafe.");
};

export const analyzeImage = async (imageB64: string, prompt: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: imageB64, mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });
  return response.text;
};

export const generateTTS = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return base64Audio;
};

export const analyzeData = async (csvText: string, query: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this CSV data:\n\n${csvText}\n\nTask: ${query}. Return findings and a suggested JSON array for visualization if applicable.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          insights: { type: Type.ARRAY, items: { type: Type.STRING } },
          chartData: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            } 
          }
        },
        required: ["summary", "insights"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
