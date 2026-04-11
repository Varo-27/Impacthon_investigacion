import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { copilotApi } from "../api/copilotApi";
import ReactMarkdown from "react-markdown";

export default function ProteinCopilot({ jobId, proteinName, statusData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Carga del resumen inicial
  useEffect(() => {
    async function loadSummary() {
      setIsTyping(true);
      const summary = await copilotApi.getInitialSummary(jobId, proteinName, statusData);
      setMessages([
        { 
          role: "ai", 
          text: summary, 
          isSummary: true 
        }
      ]);
      setIsTyping(false);
    }
    if (jobId) loadSummary();
  }, [jobId]);

  // Auto-scroll al final del chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    
    setIsTyping(true);
    const aiResponse = await copilotApi.sendChatMessage(jobId, userMsg, messages, statusData);
    setMessages(prev => [...prev, { role: "ai", text: aiResponse }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header del Copilot */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold dark:text-white">Protein Copilot</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Gemini 1.5 Pro via n8n</p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-primary-400 animate-pulse" />
      </div>

      {/* Área de Mensajes */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                msg.role === "ai" 
                  ? "bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-900/30 dark:border-primary-800" 
                  : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700"
              }`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "ai"
                  ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 shadow-sm"
                  : "bg-primary-600 text-white shadow-md shadow-primary-500/10"
              }`}>
                {msg.isSummary && (
                  <span className="inline-block px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase mb-2">
                    Resumen Automático
                  </span>
                )}
                {msg.role === "ai" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:my-2">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary-500 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntar sobre esta proteína..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1.5 p-1.5 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
