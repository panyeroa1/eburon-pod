
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, Bot, Loader2, Trash2 } from 'lucide-react';
import { createChat, sendMessageToChat } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import type { Chat } from '@google/genai';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const Chatbot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const initChat = async (currentUserId: string) => {
      setIsLoading(true);
      let knowledge = '';
      try {
        const response = await fetch('/knowledge_base.txt');
        if (response.ok) {
          knowledge = await response.text();
        }
      } catch (e) {
        console.error("Could not load knowledge base.", e);
      }

      const { data, error } = await supabase
        .from('chat_history')
        .select('sender, text')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: true });

      // Format history for Gemini API
      const formattedHistory = data?.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })) || [];
      
      setChat(createChat(knowledge, formattedHistory));

      if (error) {
        console.error("Error fetching chat history:", error.message);
        // Check for a specific "table not found" error from Supabase/Postgres
        if (error.message.includes("does not exist") || error.message.includes("Could not find the table")) {
            setMessages([{ 
                sender: 'bot', 
                text: "DATABASE SETUP INCOMPLETE:\n\nThe 'chat_history' table is missing from your Supabase database. Please execute the required SQL script provided in the documentation in your Supabase project's SQL Editor to create the necessary tables." 
            }]);
        } else {
            setMessages([{ sender: 'bot', text: `Hello! I couldn't load previous messages due to an error: ${error.message}` }]);
        }
      } else if (data && data.length > 0) {
        setMessages(data as Message[]);
      } else {
        setMessages([{ sender: 'bot', text: "Hello! This is EBURON. How can I help you today?" }]);
      }
      setIsLoading(false);
    };

    initChat(user.id);
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !chat || isLoading || !user) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const botResponseText = await sendMessageToChat(chat, currentInput);
      const botMessage: Message = { sender: 'bot', text: botResponseText };
      setMessages((prev) => [...prev, botMessage]);

      const { error } = await supabase.from('chat_history').insert([
        { user_id: user.id, sender: 'user', text: currentInput },
        { user_id: user.id, sender: 'bot', text: botResponseText },
      ]);
      if (error) {
          console.error("Failed to save message to Supabase:", error.message);
      }

    } catch (error) {
      const errorMessage: Message = { sender: 'bot', text: "Sorry, I couldn't get a response. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, chat, isLoading, user]);
  
  const handleClearHistory = async () => {
      if (!user) return;

      const { error } = await supabase.from('chat_history').delete().eq('user_id', user.id);
      if (error) {
          console.error("Failed to clear history:", error.message);
          alert("Could not clear history. Please try again.");
          return;
      }

      setMessages([{ sender: 'bot', text: "History cleared. How can I help you?" }]);
      
      let knowledge = '';
      try {
          const response = await fetch('/knowledge_base.txt');
           if (response.ok) {
              knowledge = await response.text();
          }
      } catch (e) {
          console.error("Could not load knowledge base.", e);
      }
      setChat(createChat(knowledge));
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Chatbot</h2>
            <button 
                onClick={handleClearHistory} 
                className="p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                aria-label="Clear chat history"
            >
                <Trash2 size={18} />
            </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'bot' && (
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-cyan-400" />
              </div>
            )}
            <div className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 rounded-br-none' : 'bg-slate-800 rounded-bl-none'}`}>
              <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
            </div>
             {msg.sender === 'user' && (
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="h-6 w-6 text-slate-300" />
              </div>
            )}
          </div>
        ))}
         {isLoading && messages.length > 0 && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl bg-slate-800 rounded-bl-none flex items-center">
                 <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="w-full bg-slate-800 border border-slate-700 rounded-full py-3 px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading || !chat}
          />
          <button
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 rounded-full h-9 w-9 flex items-center justify-center transition-colors disabled:bg-slate-600"
            disabled={isLoading || !input.trim() || !chat}
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
