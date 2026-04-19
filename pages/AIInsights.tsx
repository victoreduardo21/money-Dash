
import React, { useState, useEffect, useRef } from 'react';
import { PersonalTransaction, Investment, CreditCard, CreditTransaction, User as UserType, AiConversation, AiMessage } from '../types';
import { aiService } from '../services/aiService';
import { api } from '../services/api';
import Markdown from 'react-markdown';
import { Sparkles, Send, User, Bot, RefreshCw, Trash2 } from 'lucide-react';

interface AIInsightsProps {
  transactions: PersonalTransaction[];
  investments: Investment[];
  creditCards: CreditCard[];
  creditTransactions: CreditTransaction[];
  currentUser: UserType | null;
  aiConversation: AiConversation | null;
  token: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ 
  transactions, 
  investments, 
  creditCards, 
  creditTransactions, 
  currentUser,
  aiConversation,
  token
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiConversation) {
      setMessages(aiConversation.messages);
    }
  }, [aiConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInitialAnalysis = async () => {
    if (aiConversation && aiConversation.messages.length > 0) return; // Don't re-analyze if history exists

    setIsLoading(true);
    try {
      const result = await aiService.generateFinancialInsights(
        transactions, 
        investments, 
        creditCards, 
        creditTransactions, 
        currentUser
      );
      const initialMessage: Message = { role: 'assistant', content: result };
      const updatedMessages = [initialMessage];
      setMessages(updatedMessages);
      
      // Save initial message to DB
      await api.saveAiConversation({
        messages: updatedMessages.map(m => ({ ...m, timestamp: new Date().toISOString() })),
        lastUpdate: new Date().toISOString()
      }, token);

    } catch (error) {
      console.error("Error fetching insights:", error);
      setMessages([{ role: 'assistant', content: "Erro ao carregar análise inicial. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length === 0 && (transactions.length > 0 || investments.length > 0 || creditCards.length > 0)) {
      handleInitialAnalysis();
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newUserMessage: Message = { role: 'user', content: userMessage };
    const currentMessages = [...messages, newUserMessage];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      const response = await aiService.askQuestion(
        userMessage, 
        transactions, 
        investments, 
        creditCards, 
        creditTransactions, 
        currentUser
      );
      const assistantMessage: Message = { role: 'assistant', content: response };
      const finalMessages = [...currentMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save all messages to DB
      await api.saveAiConversation({
        messages: finalMessages.map(m => ({ ...m, timestamp: new Date().toISOString() })),
        lastUpdate: new Date().toISOString()
      }, token);

    } catch (error) {
      console.error("Error asking question:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, tive um problema para processar sua pergunta." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    if (token) {
        await api.saveAiConversation({ messages: [], lastUpdate: new Date().toISOString() }, token);
    }
    handleInitialAnalysis();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chat com IA Financeira</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pergunte qualquer coisa sobre seus dados</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Limpar conversa"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 no-scrollbar">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bot className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Olá! Eu sou seu assistente Money Dashs.</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
              Posso analisar seus gastos, lucros e investimentos. Comece fazendo uma pergunta abaixo!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
              <button onClick={() => setInput("Qual foi meu maior gasto este mês?")} className="text-left p-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition-colors">
                "Qual foi meu maior gasto este mês?"
              </button>
              <button onClick={() => setInput("Meus investimentos estão rendendo bem?")} className="text-left p-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition-colors">
                "Meus investimentos estão rendendo bem?"
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {msg.role === 'user' ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
              }`}>
                <div className="markdown-body text-sm">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Bot className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo sobre suas finanças..."
          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 pr-16 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default AIInsights;
