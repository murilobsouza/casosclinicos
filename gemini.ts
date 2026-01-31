
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
export async function validateApiKey(): Promise<{success: boolean, message: string}> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { success: false, message: "Variável API_KEY não encontrada no sistema." };
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Faz uma chamada ultra simples apenas para testar a chave
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: "oi" }],
      config: { maxOutputTokens: 1 }
    });
    return { success: true, message: "Conexão com Gemini API estabelecida com sucesso!" };
  } catch (error: any) {
    console.error("Erro no Teste de API:", error);
    return { success: false, message: `Erro na API: ${error.message}` };
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
    throw new Error("Configuração ausente: Chave de API não detectada no ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const currentStage = currentCase.stages[stageIndex];
  
  const systemInstruction = `
    Você é um Tutor especializado em Oftalmologia para alunos de graduação em Medicina.
    Avalie a resposta do aluno para a etapa atual.
    Retorne um JSON com: feedback (string), score (0-3), justification (string).
    Caso: ${currentCase.title}. Etapa ${stageIndex + 1}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: `Pergunta: ${currentStage.question}\nResposta do Aluno: ${studentResponse}` }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
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

    const jsonStr = cleanJsonString(response.text || "{}");
    return JSON.parse(jsonStr);

  } catch (error: any) {
    console.group("Erro na Integração Gemini");
    console.error("Mensagem:", error.message);
    console.groupEnd();

    let userMessage = "Houve um erro ao processar sua resposta. ";
    if (error.message?.includes("429")) userMessage += "Cota de uso excedida.";
    else if (error.message?.includes("403")) userMessage += "Chave de API sem permissão ou inválida.";
    else userMessage += "Verifique a configuração da variável API_KEY.";

    throw new Error(userMessage);
  }
}

