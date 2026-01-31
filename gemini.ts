
import { GoogleGenAI, Type } from "@google/genai";
import { CaseStage, ClinicalCase } from "./types";

export interface AIFeedbackResponse {
  feedback: string;
  score: number;
  justification: string;
}

/**
 * Verifica se a API Key está presente e funcional.
 */
export async function validateApiKey(): Promise<{success: boolean, message: string, code?: string}> {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_api_key")) {
    return { success: false, message: "A variável API_KEY não foi configurada ou contém um valor padrão.", code: "MISSING" };
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: "ping" }],
      config: { 
        maxOutputTokens: 1,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return { success: true, message: "Conexão com Gemini API estabelecida!" };
  } catch (error: any) {
    console.group("Diagnóstico de API");
    console.error("Status:", error.status);
    console.error("Mensagem:", error.message);
    console.groupEnd();

    const msg = error.message || "";
    // Erro 400 do Google geralmente indica chave mal formatada ou inválida
    if (msg.includes("API key not valid") || msg.includes("INVALID_ARGUMENT") || msg.includes("400")) {
      return { success: false, message: "A chave API_KEY configurada é inválida ou expirou.", code: "INVALID" };
    }
    return { success: false, message: `Erro na API: ${msg}`, code: "ERROR" };
  }
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s+/, '').replace(/\s+```$/, '');
  }
  return cleaned;
}

export async function getClinicalFeedback(
  currentCase: ClinicalCase,
  stageIndex: number,
  studentResponse: string
): Promise<AIFeedbackResponse> {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Chave de API não detectada.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const currentStage = currentCase.stages[stageIndex];
  
  const systemInstruction = `
    Você é um Tutor especializado em Oftalmologia.
    Avalie a resposta do aluno e retorne JSON: feedback, score (0-3), justification.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        { text: `Pergunta: ${currentStage.question}\nResposta: ${studentResponse}` }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            score: { type: Type.NUMBER },
            justification: { type: Type.STRING }
          },
          required: ["feedback", "score", "justification"]
        }
      }
    });

    return JSON.parse(cleanJsonString(response.text || "{}"));
  } catch (error: any) {
    throw new Error("Erro na IA. Por favor, verifique se sua chave de API é válida.");
  }
}
