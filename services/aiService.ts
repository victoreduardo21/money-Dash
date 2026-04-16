
import { GoogleGenAI } from "@google/genai";
import { PersonalTransaction, Investment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiService = {
  async generateFinancialInsights(transactions: PersonalTransaction[], investments: Investment[]) {
    const model = "gemini-3-flash-preview";
    
    const prompt = `
      Você é um consultor financeiro especialista. Analise os dados financeiros abaixo e forneça insights detalhados.
      
      Dados de Transações:
      ${JSON.stringify(transactions.map(t => ({ desc: t.description, valor: t.amount, tipo: t.type, data: t.date, cat: t.category })), null, 2)}
      
      Dados de Investimentos:
      ${JSON.stringify(investments.map(i => ({ nome: i.name, inicial: i.initialAmount, atual: i.currentValue, rendimento: i.yieldRate })), null, 2)}
      
      Por favor, forneça uma análise em Português (Brasil) cobrindo:
      1. Onde estão os maiores gastos (categorias e descrições específicas).
      2. Onde há bom lucro ou economia.
      3. Análise da carteira de investimentos (desempenho e sugestões).
      4. Recomendações práticas para melhorar a saúde financeira.
      
      Use Markdown para formatar a resposta. Seja direto, profissional e encorajador.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });
      return response.text || "Não foi possível gerar insights no momento.";
    } catch (error) {
      console.error("Erro ao gerar insights com IA:", error);
      return "Ocorreu um erro ao processar sua análise financeira. Verifique se sua chave de API está configurada corretamente.";
    }
  },

  async askQuestion(question: string, transactions: PersonalTransaction[], investments: Investment[]) {
    const model = "gemini-3-flash-preview";
    
    const context = `
      Você é um consultor financeiro pessoal de elite. O usuário fará uma pergunta sobre as finanças dele.
      Use os dados abaixo como contexto para responder, mas foque na pergunta específica.
      
      REGRAS DE ANÁLISE:
      1. Custo de Vida (Gastos Reais): São despesas que NÃO são investimentos (ex: alimentação, aluguel, lazer).
      2. Aportes / Investimentos: São transferências para investimentos (categorias como 'Aporte', 'Investimento', etc). NÃO chame isso de "gasto" ou "despesa" no sentido de perda de dinheiro; chame de "patrimônio construído" ou "investimento".
      3. Saldo em Conta: É o dinheiro disponível (Receitas - Todas as Saídas).
      4. Receita: Dinheiro que entra (Salário, etc).
      
      Dados de Transações:
      ${JSON.stringify(transactions.map(t => ({ desc: t.description, valor: t.amount, tipo: t.type, data: t.date, cat: t.category })), null, 2)}
      
      Dados de Investimentos:
      ${JSON.stringify(investments.map(i => ({ nome: i.name, inicial: i.initialAmount, atual: i.currentValue, rendimento: i.yieldRate })), null, 2)}
      
      Pergunta do Usuário: "${question}"
      
      Responda em Português (Brasil) de forma clara, prestativa e baseada nos dados fornecidos. 
      Se a pergunta não tiver relação com as finanças ou se os dados não forem suficientes para responder com precisão, informe isso educadamente.
      Use Markdown para formatar a resposta.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: context }] }],
      });
      return response.text || "Não consegui processar sua pergunta agora.";
    } catch (error) {
      console.error("Erro ao perguntar para IA:", error);
      return "Ocorreu um erro ao processar sua pergunta. Tente novamente.";
    }
  }
};
