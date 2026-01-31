import { GoogleGenAI, Type } from "@google/genai";
import { ClinicalCase } from "./types.ts";

// Declaração para satisfazer o compilador TypeScript sem definir o valor manualmente.
// Isso resolve o erro de build "exited with 1" em ambientes de compilação rigorosos.
declare const process: any;

export interface AIFeedbackResponse {
  feedback: string;
  score: number;
  justification: string;
}

/**
 * Inicializa a instância do Gemini usando a chave de API do ambiente.
 * Conforme as diretrizes: new GoogleGenAI({ apiKey: process.env.API_KEY })
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("A chave de API (API_KEY) não foi encontrada no ambiente.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function validateApiKey(): Promise<{success: boolean, message: string, technicalError?: string}> {
  try {
    const ai = getAI();
    // Teste simples de conectividade
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
    });
    return { success: true, message: "Gemini Online" };
  } catch (error: any) {
    console.error("Erro ao validar API Key do Gemini:", error);
    return { 
      success: false, 
      message: "Não foi possível conectar com o Gemini.",
      technicalError: error.message || "Erro desconhecido ao validar a chave."
    };
  }
}

export async function getClinicalFeedback(
  currentCase: ClinicalCase,
  stageIndex: number,
  studentResponse: string
): Promise<AIFeedbackResponse> {
  const currentStage = currentCase.stages[stageIndex];
  const ai = getAI();
  
  const systemInstruction = `Você é um professor sênior de Oftalmologia avaliando um aluno de graduação em Medicina.
  Analise a resposta técnica do aluno para o caso clínico fornecido.
  
  CRITÉRIOS DE AVALIAÇÃO:
  - Pontuação (score): 0 (Incorreto), 1 (Incompleto), 2 (Bom), 3 (Excelente/Completo).
  - Linguagem: Técnica, mas encorajadora (Markdown).
  - Rigor: Avalie termos oftalmológicos e condutas clínicas.`;

  const prompt = `
  CASO: ${currentCase.title}
  ETAPA ATUAL: ${currentStage.title}
  CONTEÚDO DA ETAPA: ${currentStage.content}
  PERGUNTA FEITA: ${currentStage.question}
  RESPOSTA DO ALUNO: ${studentResponse}
  
  Analise se o aluno identificou corretamente a patologia ou conduta baseada na descrição.
  Forneça o feedback em formato JSON estruturado seguindo o schema fornecido.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING, description: "Feedback detalhado em Markdown para o aluno." },
            score: { type: Type.NUMBER, description: "Nota numérica de 0 a 3." },
            justification: { type: Type.STRING, description: "Justificativa pedagógica curta para a nota." }
          },
          required: ["feedback", "score", "justification"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("A IA retornou uma resposta vazia.");
    
    return JSON.parse(jsonText.trim()) as AIFeedbackResponse;
  } catch (error: any) {
    console.error("Erro no Processamento Gemini:", error);
    throw new Error(error.message || "Erro ao consultar o Tutor Inteligente.");
  }
}
