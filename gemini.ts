
import { GoogleGenAI, Type } from "@google/genai";
import { CaseStage, ClinicalCase } from "./types";

// Always use the process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIFeedbackResponse {
  feedback: string;
  score: number;
  justification: string;
}

export async function getClinicalFeedback(
  currentCase: ClinicalCase,
  stageIndex: number,
  studentResponse: string
): Promise<AIFeedbackResponse> {
  const currentStage = currentCase.stages[stageIndex];
  
  const systemInstruction = `
    Você é um Tutor especializado em Oftalmologia para alunos de graduação em Medicina.
    Sua tarefa é avaliar a resposta do aluno para a etapa atual de um caso clínico.
    
    REGRAS CRÍTICAS:
    1. Não revele o diagnóstico antes da etapa apropriada.
    2. Use apenas as informações fornecidas até esta etapa (${stageIndex + 1}).
    3. Seja didático, objetivo e encorajador.
    4. Aponte "Red Flags" (sinais de alerta/urgência) se aplicável.
    5. Atribua uma pontuação de 0 a 3 para a resposta.
    6. Se o aluno pedir a resposta, recuse educadamente e faça perguntas norteadoras.
    7. Linguagem em Português do Brasil.
    
    ESTRUTURA DO CASO ATÉ AGORA:
    ${currentCase.stages.slice(0, stageIndex + 1).map((s, i) => `Etapa ${i+1}: ${s.content}`).join('\n')}
    
    PERGUNTA DA ETAPA ATUAL: ${currentStage.question}
    RESPOSTA DO ALUNO: ${studentResponse}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Avalie a resposta do aluno.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING, description: "Feedback educativo detalhado" },
            score: { type: Type.NUMBER, description: "Pontuação de 0 a 3" },
            justification: { type: Type.STRING, description: "Breve justificativa da nota" }
          },
          required: ["feedback", "score", "justification"]
        }
      }
    });

    // Access the text property directly and trim the output string as per guidelines
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Error:", error);
    return {
      feedback: "Houve um erro ao processar sua resposta pela IA. Por favor, tente novamente.",
      score: 0,
      justification: "Erro técnico na integração com a IA."
    };
  }
}
