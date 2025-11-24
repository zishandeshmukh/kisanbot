
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SensorData, Language } from "../types";

const getLanguageName = (lang: Language) => {
  switch (lang) {
    case 'hi': return 'Hindi';
    case 'mr': return 'Marathi';
    case 'pa': return 'Punjabi';
    case 'bn': return 'Bengali';
    case 'ta': return 'Tamil';
    case 'te': return 'Telugu';
    case 'kn': return 'Kannada';
    case 'gu': return 'Gujarati';
    case 'ml': return 'Malayalam';
    case 'en': return 'English';
    default: return 'English';
  }
};

const getSystemInstruction = (lang: Language) => `
You are 'Kisan Sahayak', an advanced AI agricultural expert for Indian farmers.
Target Output Language: ${getLanguageName(lang)}.

CRITICAL RULES:
1. Regardless of the language the user speaks (English, Hinglish, etc.), you MUST reply ONLY in ${getLanguageName(lang)}.
2. **IMPORTANT**: Use the NATIVE SCRIPT for the target language (e.g., Devanagari for Marathi/Hindi, Bengali script for Bengali). DO NOT use English alphabet (transliteration) unless explicitly asked.
3. Be polite, encouraging, and practical.
4. For plant analysis, focus on organic and chemical remedies available in India.
5. **KEEP RESPONSES CONCISE**: Limit your response to a maximum of 3 sentences. This is a HARD LIMIT for text-to-speech clarity.
`;

export const analyzePlantImage = async (
  base64Image: string,
  sensorData: SensorData,
  language: Language,
  plantType: string,
  plantAge: string,
  apiKey?: string
): Promise<AnalysisResult> => {
  // Prioritize the key passed from settings, fall back to env
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing. Please add it in Settings or .env file.");

  const ai = new GoogleGenAI({ apiKey: key });
  const langName = getLanguageName(language);

  const prompt = `
    Analyze this plant image.
    Context:
    - Crop/Plant Type: ${plantType || 'Unknown'}
    - Growth Stage/Age: ${plantAge || 'Unknown'}

    Field Sensor Data:
    - Temp: ${sensorData.temperature}°C
    - Humidity: ${sensorData.humidity}%
    - Soil Moisture: ${sensorData.soilMoisture}%

    Output JSON format only:
    1. Disease Name (or "Healthy").
    2. Confidence (0-100).
    3. Advice in ${langName} script (Native Script).
    4. Fertilizer/Irrigation recommendation based on sensors and plant stage.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: prompt },
        ],
      },
    ],
    config: {
      systemInstruction: getSystemInstruction(language),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diseaseName: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          hindiAdvice: { type: Type.STRING, description: `Advice strictly in ${langName} native script` },
          fertilizerRecommendation: { type: Type.STRING },
          isHealthy: { type: Type.BOOLEAN },
        },
        required: ["diseaseName", "confidence", "hindiAdvice", "fertilizerRecommendation", "isHealthy"],
      },
    },
  });

  if (response.text) {
    const result = JSON.parse(response.text);
    return { ...result, timestamp: Date.now(), crop: plantType };
  }
  throw new Error("No response from Gemini.");
};

export const chatWithAgriBot = async (
  userText: string,
  language: Language,
  sensorData: SensorData,
  lastAnalysis: AnalysisResult | null,
  apiKey?: string
): Promise<string> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing. Please add it in Settings or .env file.");

  const ai = new GoogleGenAI({ apiKey: key });
  
  // Structured and readable sensor context for the AI
  let context = `
[CURRENT FIELD TELEMETRY]
-------------------------
🌡️ Temperature   : ${sensorData.temperature}°C
💧 Humidity      : ${sensorData.humidity}%
🌱 Soil Moisture : ${sensorData.soilMoisture}%
🔋 Battery Level : ${sensorData.batteryLevel !== undefined ? sensorData.batteryLevel + '%' : 'Unknown'}
🚧 Obstacle Path : ${sensorData.obstacleDetected ? 'BLOCKED (Obstacle Detected)' : 'Clear'}
-------------------------
`;

  if (lastAnalysis) {
    context += `
[LATEST PLANT ANALYSIS REPORT]
-------------------------
Time: ${new Date(lastAnalysis.timestamp).toLocaleTimeString()}
Crop: ${lastAnalysis.crop || 'Unknown'}
Diagnosis: ${lastAnalysis.diseaseName} (${lastAnalysis.isHealthy ? 'Healthy' : 'Unhealthy'})
Previous Advice: ${lastAnalysis.hindiAdvice}
-------------------------
    `;
  }
    
  context += `\n[USER QUERY]\n"${userText}"`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: context }] }],
    config: {
      systemInstruction: getSystemInstruction(language),
    },
  });

  return response.text || "I'm having trouble connecting to the satellite. Please try again.";
};
