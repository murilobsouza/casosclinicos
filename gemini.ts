
import OpenAI from "openai";
import { ClinicalCase } from "./types";

export interface AIFeedbackResponse {
  feedback: string;
  score: number;
  justification: string;
}

/**
 * Função de acesso seguro às chaves, lidando com diferentes ambientes de injeção.
 */
const getSafeApiKey = (): string => {
  try {
    // Tenta pegar do process.env injetado ou do window.process definido no html
    const env = (window as any).process?.env || {};
    return env.OPENAI_API_KEY || env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const getClient = () => {
  const apiKey = getSafeApiKey();
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
};

export async function validateApiKey(): Promise<{success: boolean, message: string, technicalError?: string}> {
  const apiKey = getSafeApiKey();
  
  if (!apiKey || apiKey.trim() === "" || apiKey.length < 10) {
    return { 
      success: false, 
      message: "Chave OpenAI não detectada.",
      technicalError: "Configure 'API_KEY' ou 'OPENAI_API_KEY' nas variáveis de ambiente."
    };
  }
  
  try {
    const openai = getClient();
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1
    });
    return { success: true, message: "ChatGPT Online" };
  } catch (error: any) {
    console.error("Erro OpenAI:", error);
    return { 
      success: false, 
      message: "Falha na conexão com a OpenAI.",
      technicalError: error.message || "Erro de rede ou chave inválida."
    };
  }
}

export async function getClinicalFeedback(
  currentCase: ClinicalCase,
  stageIndex: number,
  studentResponse: string
): Promise<AIFeedbackResponse> {
  const openai = getClient();
  const currentStage = currentCase.stages[stageIndex];
  
  const systemPrompt = `Você é um experiente professor de oftalmologia. 
  Avalie a resposta do aluno de medicina para o caso: ${currentCase.title}.
  
  Regras de Avaliação:
  1. Forneça feedback construtivo em Markdown.
  2. Atribua um score de 0 a 3 baseado na precisão técnica.
  3. A resposta DEVE ser um objeto JSON com os campos: feedback, score, justification.
  4. Seja rigoroso com a terminologia médica oftalmológica.`;

  const userPrompt = `
  Contexto do Caso: ${currentStage.content}
  Pergunta Feita: ${currentStage.question}
  Resposta do Aluno: ${studentResponse}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Resposta vazia da IA.");
    
    return JSON.parse(content) as AIFeedbackResponse;
  } catch (error: any) {
    console.error("Erro no ChatGPT:", error);
    throw new Error(error.message || "Erro ao processar feedback pela OpenAI.");
  }
}
