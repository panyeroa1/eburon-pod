
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Type, GroundingChunk } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Define the history type based on the expected API structure
interface ChatHistoryContent {
    role: 'user' | 'model';
    parts: { text: string }[];
}


// --- Text and Chat ---
export const createChat = (systemInstruction?: string, history?: ChatHistoryContent[]): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: systemInstruction ? { systemInstruction } : undefined,
        history: history,
    });
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message:", error);
        return "Sorry, I encountered an error. Please try again.";
    }
};

export const solveComplexTask = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error solving complex task:", error);
        return "An error occurred while processing the complex task.";
    }
};


// --- Image Generation and Editing ---
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio,
            },
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image.");
    }
};

const fileToGenerativePart = (file: File) => {
    return new Promise<{ mimeType: string; data: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve({
                mimeType: file.type,
                data: result.split(',')[1],
            });
        };
        reader.onerror = (error) => reject(error);
    });
};


export const editImage = async (prompt: string, imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: imagePart },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image found in response");

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image.");
    }
};

export const analyzeImage = async (prompt: string, imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            // FIX: The image part needs to be wrapped in an `inlineData` object.
            contents: { parts: [{ inlineData: imagePart }, { text: prompt }] },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze image.");
    }
};


// --- Grounding ---
export const performGroundedSearch = async (
    query: string, 
    tool: 'googleSearch' | 'googleMaps',
    location?: { latitude: number, longitude: number }
): Promise<{ text: string, chunks: GroundingChunk[] }> => {
    try {
        const config: any = {
            tools: tool === 'googleSearch' ? [{ googleSearch: {} }] : [{ googleMaps: {} }],
        };

        if (tool === 'googleMaps' && location) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: location
                }
            };
        }
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config,
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, chunks };

    } catch (error) {
        console.error("Error with grounded search:", error);
        throw new Error("Failed to perform grounded search.");
    }
};


// --- Audio ---
export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
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
        if (!base64Audio) {
            throw new Error("No audio data received.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech.");
    }
};
