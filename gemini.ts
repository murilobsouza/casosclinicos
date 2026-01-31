
import { GoogleGenAI, Type } from "@google/genai";
import { CaseStage, ClinicalCase } from "./types";

export interface AIFeedbackResponse {
  feedback: string;
  score: number;
  justification: string;
}

/**
 * Limpa a string de resposta da IA para garantir que seja um JSON válido.
 * Remove blocos de código markdown se presentes.
 */
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  // Remove blocos de código markdown (```json ... ``` ou ``` ... ```)
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
    console.error("ERRO CRÍTICO: Chave de API (process.env.API_KEY) não encontrada.");
    return {
      feedback: "Configuração ausente: A chave de API não foi detectada no ambiente.",
      score: 0,
      justification: "Erro de configuração do sistema."
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const currentStage = currentCase.stages[stageIndex];
  
  const systemInstruction = `
    Você é um Tutor especializado em Oftalmologia para alunos de graduação em Medicina.
    Sua tarefa é avaliar a resposta do aluno para a etapa atual de um caso clínico.
    
    REGRAS CRÍTICAS:
    1. Não revele o diagnóstico antes da etapa apropriada.
    2. Use apenas as informações fornecidas até esta etapa (${stageIndex + 1}).
    3. Seja didático, objetivo e encorajador.
    4. Aponte "Red Flags" (sinais de alerta/urgência) se aplicável.
    5. Atribua uma pontuação de 0 a 3 para a resposta (0: Insuficiente, 1: Regular, 2: Bom, 3: Excelente).
    6. Se o aluno pedir a resposta ou tentar burlar, recuse educadamente e faça perguntas norteadoras.
    7. Linguagem: Português do Brasil, tom profissional e acadêmico.
    
    ESTRUTURA DO CASO ATÉ AGORA:
    ${currentCase.stages.slice(0, stageIndex + 1).map((s, i) => `Etapa ${i+1}: ${s.content}`).join('\n')}
    
    PERGUNTA DA ETAPA ATUAL: ${currentStage.question}
    RESPOSTA DO ALUNO: ${studentResponse}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: "Avalie tecnicamente a resposta do estudante de medicina fornecida no contexto." }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }, // Desabilita o modo de pensamento para garantir saída JSON direta e rápida
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING, description: "Feedback educativo detalhado e clínico" },
            score: { type: Type.NUMBER, description: "Pontuação de 0 a 3 baseada na precisão técnica" },
            justification: { type: Type.STRING, description: "Breve justificativa pedagógica para a nota" }
          },
          required: ["feedback", "score", "justification"]
        }
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("A IA retornou uma resposta vazia.");

    const jsonStr = cleanJsonString(rawText);
    return JSON.parse(jsonStr);

  } catch (error: any) {
    // Log detalhado para depuração no console do navegador do usuário
    console.group("Erro na Integração Gemini");
    console.error("Mensagem:", error.message);
    console.error("Detalhes:", error);
    console.groupEnd();

    let userMessage = "Houve um erro ao processar sua resposta pela IA. ";
    
    if (error.message?.includes("429")) {
      userMessage += "Limite de requisições atingido (Quota exceeded).";
    } else if (error.message?.includes("403") || error.message?.includes("API_KEY_INVALID")) {
      userMessage += "Chave de API inválida ou sem permissão.";
    } else {
      userMessage += "Por favor, tente novamente em instantes.";
    }

    return {
      feedback: userMessage,
      score: 0,
      justification: "Falha na comunicação com o provedor de IA."
    };
  }
}

