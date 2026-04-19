
import { GoogleGenAI } from "@google/genai";
import { PersonalTransaction, Investment, CreditCard, CreditTransaction, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiService = {
  async generateFinancialInsights(
    transactions: PersonalTransaction[], 
    investments: Investment[], 
    creditCards: CreditCard[], 
    creditTransactions: CreditTransaction[],
    currentUser: User | null
  ) {
    const model = "gemini-3-flash-preview";
    
    const prompt = `
      Você é o "Guia de Negócios e Consultor Financeiro de Elite" do Money Dashs. 
      Sua missão é transformar a vida financeira do usuário, agindo não apenas como um analista de dados, mas como um mentor estratégico.
      
      DADOS DO USUÁRIO:
      - Nome: ${currentUser?.name || 'Usuário'}
      - Plano: ${currentUser?.plan || 'FREE'}
      - Limite de Cheque Especial: ${currentUser?.overdraftLimit || 0}
      
      DADOS FINANCEIROS:
      1. Transações Bancárias (Débito/Receita):
      ${JSON.stringify(transactions.map(t => ({ desc: t.description, valor: t.amount, tipo: t.type, data: t.date, cat: t.category })), null, 2)}
      
      2. Portfólio de Investimentos:
      ${JSON.stringify(investments.map(i => ({ nome: i.name, inicial: i.initialAmount, atual: i.currentValue, rendimento: i.yieldRate })), null, 2)}
      
      3. Cartões de Crédito:
      ${JSON.stringify(creditCards.map(c => ({ nome: c.name, limite: c.limit, moeda: c.currency })), null, 2)}
      
      4. Transações de Crédito/Cheque Especial:
      ${JSON.stringify(creditTransactions.map(ct => ({ desc: ct.description, valor: ct.amount, data: ct.date, parcelas: `${ct.installments}/${ct.totalInstallments}`, isOverdraft: ct.isOverdraft })), null, 2)}
      
      ESTRUTURA DA RESPOSTA (Markdown):
      # 🚀 Insight Estratégico Money Dashs
      
      ### 📊 Onde seu dinheiro está indo?
      (Analise padrões de gastos. Se houver uso de Cheque Especial, alerte sobre os riscos e juros. Identifique categorias "ralo" de dinheiro).
      
      ### 💰 Maximizando seus Lucros e Investimentos
      (Baseado no saldo restante e nos investimentos atuais, sugira como ele pode aumentar os aportes. Se o rendimento de um ativo estiver baixo, comente. Sugira uma estratégia de "Business Guide" para reinvestir lucros).
      
      ### 🎯 Plano de Ação Imediato
      (3 a 5 passos práticos para o usuário executar hoje para melhorar sua margem de investimentos).
      
      ### ⚠️ Alertas Críticos
      (Vencimento de faturas, uso excessivo de crédito ou falta de reserva de emergência).

      Seja motivador, mas extremamente preciso e analítico. Use termos como "ROI", "Margem de Investimento", "Patrimônio Ativo".
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text || "Não foi possível gerar insights no momento.";
    } catch (error) {
      console.error("Erro ao gerar insights com IA:", error);
      return "Ocorreu um erro ao processar sua análise financeira. Verifique a conexão e tente novamente.";
    }
  },

  async askQuestion(
    question: string, 
    transactions: PersonalTransaction[], 
    investments: Investment[],
    creditCards: CreditCard[],
    creditTransactions: CreditTransaction[],
    currentUser: User | null
  ) {
    const model = "gemini-3-flash-preview";
    
    const context = `
      Você é o "Guia de Negócios e Consultor Financeiro de Elite" do Money Dashs.
      Responda à pergunta do usuário considerando o contexto financeiro dele.

      PERGUNTA DO USUÁRIO: "${question}"

      CONTEXTO DO USUÁRIO:
      - Nome: ${currentUser?.name || "Usuário"}
      - Limite Cheque Especial: ${currentUser?.overdraftLimit || 0}
      - Plano: ${currentUser?.plan || 'FREE'}
      
      DADOS FINANCEIROS:
      - Transações: ${JSON.stringify(transactions.map(t => ({ d: t.description, v: t.amount, t: t.type })))}
      - Investimentos: ${JSON.stringify(investments.map(i => ({ n: i.name, v: i.currentValue })))}
      - Crédito: ${JSON.stringify(creditCards.map(c => ({ n: c.name, l: c.limit })))}
      - Transações de Crédito: ${JSON.stringify(creditTransactions.map(ct => ({ d: ct.description, v: ct.amount, o: ct.isOverdraft })))}
      
      Responda em Português (Brasil) usando Markdown.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: context,
      });
      return response.text || "Não consegui processar sua pergunta agora.";
    } catch (error) {
      console.error("Erro ao perguntar para IA:", error);
      return "Ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.";
    }
  }
};
