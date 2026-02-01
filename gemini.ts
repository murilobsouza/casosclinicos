import { GoogleGenAI, Type } from "@google/genai";
import { ClinicalCase } from "./types.ts";

/**
 * Interface para a resposta do tutor
 */
export interface AIFeedbackResponse {
  feedback: string;
  score: number;
  justification: string;
}

/**
 * Valida a disponibilidade do serviço de IA de forma segura
 */
export async function validateApiKey(): Promise<{success: boolean, message: string, technicalError?: string}> {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return { 
        success: false, 
        message: "Chave de IA não configurada no ambiente.",
        technicalError: "process.env.GEMINI_API_KEY está indefinido."
      };
    }
    
    const ai = new GoogleGenAI({ apiKey: key });
    // Uma chamada simples para testar a conectividade
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Olá",
    });
    return { success: true, message: "Gemini Online" };
  } catch (error: any) {
    console.error("Erro na validação da IA:", error);
    return { 
      success: false, 
      message: "Falha na conexão com Google AI.",
      technicalError: error.message
    };
  }
}

/**
 * Gera feedback pedagógico para a resposta do aluno
 */
export async function getClinicalFeedback(
  currentCase: ClinicalCase,
  stageIndex: number,
  studentResponse: string
): Promise<AIFeedbackResponse> {
  const currentStage = currentCase.stages[stageIndex];
  const key = process.env.API_KEY;
  
  if (!key) throw new Error("Chave de API não encontrada (process.env.API_KEY).");
  
  const ai = new GoogleGenAI({ apiKey: key });

  const systemInstruction = `Você é um professor sênior de Oftalmologia avaliando um aluno de graduação em Medicina.
  Sua tarefa é analisar a resposta técnica do aluno para o caso clínico fornecido.
  
  CRITÉRIOS DE AVALIAÇÃO:
  - Pontuação (score): 0 (Incorreto), 1 (Incompleto), 2 (Bom), 3 (Excelente/Completo).
  - Linguagem: Técnica, objetiva, mas encorajadora. Use Markdown para formatar o feedback.
  - Rigor: Avalie se o aluno usou a terminologia oftalmológica correta e propôs a conduta baseada em evidências.`;

  const prompt = `
  CASO CLÍNICO: ${currentCase.title}
  TEMA: ${currentCase.theme}
  
  ETAPA ATUAL: ${currentStage.title}
  CONTEÚDO APRESENTADO: ${currentStage.content}
  PERGUNTA FEITA AO ALUNO: ${currentStage.question}
  
  RESPOSTA DO ALUNO: ${studentResponse}
  
  Analise a resposta e forneça um feedback construtivo, uma nota de 0 a 3 e uma justificativa breve.`;

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
            feedback: { 
              type: Type.STRING, 
              description: "O feedback detalhado para o aluno em formato Markdown." 
            },
            score: { 
              type: Type.NUMBER, 
              description: "Nota numérica de 0 a 3 baseada na qualidade da resposta." 
            },
            justification: { 
              type: Type.STRING, 
              description: "Uma justificativa técnica curta para a nota dada." 
            }
          },
          required: ["feedback", "score", "justification"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");
    
    // O texto retornado deve ser um JSON válido conforme o schema acima
    return JSON.parse(text.trim()) as AIFeedbackResponse;
  } catch (error: any) {
    console.error("Erro no Processamento Gemini:", error);
    if (error.message?.includes("API_KEY")) {
      throw new Error("Erro de autenticação: Verifique se sua API Key é válida.");
    }
    throw new Error(error.message || "Erro desconhecido ao consultar o Tutor Inteligente.");
  }
}

