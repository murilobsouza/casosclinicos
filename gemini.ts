
import OpenAI from "openai";
import { ClinicalCase } from "./types";

export interface AIFeedbackResponse {
  feedback: string;
  score: number;
  justification: string;
}

// Inicializa o cliente OpenAI
// Nota: Em um ambiente real de produção, você não deve expor a chave no frontend.
// Estamos usando dangerouslyAllowBrowser porque este é um protótipo educacional.
const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
};

export async function validateApiKey(): Promise<{success: boolean, message: string, technicalError?: string}> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === "" || apiKey.length < 10) {
    return { 
      success: false, 
      message: "Chave OpenAI não encontrada no ambiente.",
      technicalError: "Variável OPENAI_API_KEY ou API_KEY não configurada."
    };
  }
  
  try {
    const openai = getClient();
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "p" }],
      max_tokens: 1
    });
    return { success: true, message: "ChatGPT Online" };
  } catch (error: any) {
    console.error("Erro de validação OpenAI:", error);
    return { 
      success: false, 
      message: "Falha na conexão com a OpenAI.",
      technicalError: error.message || "Erro desconhecido na API."
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
