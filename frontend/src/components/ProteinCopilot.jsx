import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Sparkles, Copy, Check } from "lucide-react";
import { proteiaApi } from "../api/proteiaApi";
import ReactMarkdown from "react-markdown";

/* Streams `fullText` into `onChunk(partial)` then calls `onDone`.
   Speed: ~8 chars/frame at 60 fps ≈ 480 chars/s — feels natural. */
function streamText(fullText, onChunk, onDone) {
  let i = 0;
  let raf;
  const CHARS_PER_FRAME = 2;

  const tick = () => {
    if (i >= fullText.length) { onDone(); return; }
    i = Math.min(i + CHARS_PER_FRAME, fullText.length);
    onChunk(fullText.slice(0, i));
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="self-start flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover/msg:opacity-100"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function ProteinCopilot({ jobId, proteinName, statusData, onSummaryReady }) {
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [isWaiting,  setIsWaiting]  = useState(false);  // waiting for API
  const [isStreaming,setIsStreaming] = useState(false);  // animating text
  const [enrichedData, setEnrichedData] = useState(statusData); // datos completos
  const scrollRef  = useRef(null);
  const cancelStream = useRef(null);

  // Cargar datos completos cuando se monta o cambia jobId
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    (async () => {
      try {
        console.log("ProteinCopilot: cargando datos completos del CESGA para", jobId);
        const response = await fetch(`https://api-mock-cesga.onrender.com/jobs/${jobId}/outputs`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const cesga = await response.json();
        
        if (!cancelled) {
          const full = {
            name: cesga.protein_metadata?.protein_name || statusData?.name,
            plddt: cesga.structural_data?.confidence?.plddt_mean || statusData?.plddt,
            organism: cesga.protein_metadata?.organism || statusData?.organism,
            uniprot: cesga.protein_metadata?.uniprot_id || statusData?.uniprot,
            biological: cesga.biological_data || statusData?.biological,
            pdbFileUrl: cesga.structural_data?.pdb_file || statusData?.pdbFileUrl,
            paeMatrix: cesga.structural_data?.confidence?.pae_matrix || statusData?.paeMatrix,
            plddtHistogram: cesga.structural_data?.confidence?.plddt_histogram || statusData?.plddtHistogram,
          };
          console.log("✅ ProteinCopilot: datos COMPLETOS cargados", full);
          setEnrichedData(full);
        }
      } catch (err) {
        console.error("❌ ProteinCopilot: error cargando datos:", err);
        console.log("⚠️  usando statusData de fallback:", statusData);
        setEnrichedData(statusData);
      }
    })();

    return () => { cancelled = true; };
  }, [jobId]); // Solo jobId como dependencia

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(scrollToBottom, [messages, isWaiting]);

  /* Start streaming a full text into the last message slot */
  const startStream = useCallback((fullText, extraProps = {}) => {
    // Push an empty placeholder
    setMessages(prev => [...prev, { role: "ai", text: "", streaming: true, ...extraProps }]);
    setIsStreaming(true);

    cancelStream.current = streamText(
      fullText,
      (partial) => {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], text: partial };
          return next;
        });
        scrollToBottom();
      },
      () => {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], streaming: false };
          return next;
        });
        setIsStreaming(false);
        cancelStream.current = null;
      }
    );
  }, [scrollToBottom]);

  /* Cleanup on unmount */
  useEffect(() => () => cancelStream.current?.(), []);

  /* Initial summary */
  useEffect(() => {
    if (!jobId || !enrichedData) return;
    let cancelled = false;

    (async () => {
      setIsWaiting(true);
      console.log("ProteinCopilot: generando resumen con enrichedData:", enrichedData);
      const summary = await proteiaApi.getInitialSummary(jobId, proteinName, enrichedData);
      if (cancelled) return;
      setIsWaiting(false);
      if (onSummaryReady) onSummaryReady(summary);
      startStream(summary, { isSummary: true });
    })();

    return () => { cancelled = true; };
  }, [jobId, enrichedData, proteinName]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isWaiting || isStreaming) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);

    setIsWaiting(true);
    console.log("📤 ProteinCopilot enviando mensaje con enrichedData:", enrichedData);
    const aiResponse = await proteiaApi.sendChatMessage(jobId, userMsg, messages, enrichedData || statusData);
    setIsWaiting(false);
    startStream(aiResponse);
  };

  const busy = isWaiting || isStreaming;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">

      {/* Header */}
      <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold dark:text-white">ProteIA</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Asistente de análisis estructural</p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-primary-400 animate-pulse" />
      </div>

      {/* Messages - Only this scrolls */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600"
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

              <div className="group/msg flex flex-col gap-1">
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
                      <ReactMarkdown>{msg.streaming ? msg.text + "▍" : msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}
                </div>
                {msg.role === "ai" && !msg.streaming && (
                  <CopyButton text={msg.text} />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Waiting for API (before stream starts) */}
        {isWaiting && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-500" />
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input - Fixed at bottom */}
      <form onSubmit={handleSend} className="shrink-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntar sobre esta proteína..."
            disabled={busy}
            className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white disabled:opacity-60 transition-opacity"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="absolute right-2 top-1.5 p-1.5 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
