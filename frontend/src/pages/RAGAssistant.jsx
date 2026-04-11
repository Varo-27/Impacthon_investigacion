import { useState, useRef, useCallback, useEffect } from "react";
import {
  Send, Bot, User, BrainCircuit, BookOpen, Dna, FlaskConical,
  Microscope, X, FolderOpen, CheckCircle2, GitBranch, Clock, XCircle, AtSign,
  Copy, Check,
} from "lucide-react";
import { ragApi } from "../api/ragApi";
import { getJobOutputs } from "../lib/outputsCache";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  { icon: <Dna className="w-4 h-4" />,         text: "¿Qué es el pLDDT y cómo interpreto su valor?" },
  { icon: <FlaskConical className="w-4 h-4" />, text: "¿Cómo afecta la solubilidad al uso experimental de una proteína?" },
  { icon: <BookOpen className="w-4 h-4" />,     text: "Explícame qué es AlphaFold y cómo predice estructuras." },
  { icon: <Microscope className="w-4 h-4" />,   text: "¿Qué indica un índice de inestabilidad alto en una proteína?" },
];

const STATUS_ICON = {
  COMPLETED: <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />,
  RUNNING:   <GitBranch    className="w-3.5 h-3.5 text-green-500"  />,
  PENDING:   <Clock        className="w-3.5 h-3.5 text-slate-400"  />,
  FAILED:    <XCircle      className="w-3.5 h-3.5 text-red-500"    />,
};

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

export default function RAGAssistant() {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [isWaiting,   setIsWaiting]   = useState(false);
  const [isStreaming, setIsStreaming]  = useState(false);

  /* @ mention state */
  const [atQuery,     setAtQuery]     = useState(null); // string after @, null = closed
  const [references,  setReferences]  = useState([]);   // selected context items
  const [allItems,    setAllItems]    = useState([]);   // jobs + projects for dropdown
  const dropdownRef  = useRef(null);

  const scrollRef    = useRef(null);
  const cancelStream = useRef(null);
  const inputRef     = useRef(null);
  const sessionId    = useRef(`rag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  /* Load user's jobs and projects for @ lookup */
  useEffect(() => {
    let unsubJobs = () => {}, unsubProjects = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      unsubJobs = onSnapshot(
        query(collection(db, "jobs"), where("userId", "==", user.uid)),
        (snap) => {
          const jobs = snap.docs.map((d) => ({
            id: d.id,
            kind: "job",
            label: d.data().proteinName || d.data().cesgaJobId,
            status: d.data().status,
            data: {
              type: "job",
              jobId: d.data().cesgaJobId,
              proteinName: d.data().proteinName,
              status: d.data().status,
              plddt: d.data().plddt ?? null,
              organism: d.data().organism ?? null,
              biological: d.data().biological ?? null,
            },
          }));
          setAllItems((prev) => [
            ...prev.filter((i) => i.kind !== "job"),
            ...jobs,
          ]);
        }
      );
      unsubProjects = onSnapshot(
        collection(db, "projects"),
        (snap) => {
          const projects = snap.docs
            .filter((d) => d.data().members?.some((m) => m.uid === user.uid))
            .map((d) => ({
              id: d.id,
              kind: "project",
              label: d.data().name,
              data: {
                type: "project",
                projectId: d.id,
                name: d.data().name,
                description: d.data().description ?? null,
                memberCount: d.data().members?.length ?? 1,
              },
            }));
          setAllItems((prev) => [
            ...prev.filter((i) => i.kind !== "project"),
            ...projects,
          ]);
        }
      );
    });
    return () => { unsubAuth(); unsubJobs(); unsubProjects(); };
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(scrollToBottom, [messages, isWaiting]);
  useEffect(() => () => cancelStream.current?.(), []);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (atQuery === null) return;
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && e.target !== inputRef.current)
        setAtQuery(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [atQuery]);

  /* Detect @ in textarea */
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    setAtQuery(match ? match[1] : null);
  };

  /* Select item from dropdown */
  const selectReference = async (item) => {
    setInput((prev) => prev.replace(/@\w*$/, ""));
    setAtQuery(null);
    if (references.find((r) => r.id === item.id)) {
      inputRef.current?.focus();
      return;
    }

    // Para jobs: enriquecer con outputs del CESGA (usa cache compartido con el Visor)
    if (item.kind === "job" && item.data.jobId) {
      try {
        const outputs = await getJobOutputs(item.data.jobId);
        item = {
          ...item,
          data: {
            ...item.data,
            plddt:          outputs.plddt      ?? item.data.plddt,
            organism:       outputs.organism   ?? item.data.organism,
            biological:     outputs.biological ?? item.data.biological,
            uniprot:        outputs.uniprot    ?? null,
            plddtHistogram: outputs.plddtHistogram ?? null,
          },
        };
      } catch {
        // Si falla, se usa la data de Firestore igualmente
      }
    }

    setReferences((prev) => [...prev, item]);
    inputRef.current?.focus();
  };

  const removeReference = (id) => setReferences((prev) => prev.filter((r) => r.id !== id));

  const filteredItems = atQuery === null ? [] : allItems.filter((i) =>
    i.label.toLowerCase().includes(atQuery.toLowerCase())
  );

  const startStream = useCallback((fullText) => {
    setMessages((prev) => [...prev, { role: "ai", text: "", streaming: true }]);
    setIsStreaming(true);
    cancelStream.current = streamText(
      fullText,
      (partial) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], text: partial };
          return next;
        });
        scrollToBottom();
      },
      () => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], streaming: false };
          return next;
        });
        setIsStreaming(false);
        cancelStream.current = null;
      }
    );
  }, [scrollToBottom]);

  const handleSend = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || isWaiting || isStreaming) return;
    setInput("");
    setAtQuery(null);
    const ctx = references.map((r) => r.data);
    setReferences([]);

    // Show refs as chips in the user message bubble
    const updated = [...messages, { role: "user", text: msg, refs: ctx }];
    setMessages(updated);
    setIsWaiting(true);
    const reply = await ragApi.sendMessage(msg, updated, sessionId.current, ctx);
    setIsWaiting(false);
    startStream(reply);
    inputRef.current?.focus();
  };

  const busy = isWaiting || isStreaming;
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white">ProteIA</h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Especializado en biología estructural · usa <strong className="font-semibold">@</strong> para referenciar tus predicciones o proyectos
          </p>
        </div>
      </div>

      {/* Messages / Empty state */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-5
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-slate-200
          dark:[&::-webkit-scrollbar-thumb]:bg-slate-700
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4 pb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center">
              <BrainCircuit className="w-8 h-8 text-primary-400 dark:text-primary-500" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">¿En qué puedo ayudarte?</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                Soy un asistente especializado en biología estructural. Escribe <strong className="text-slate-500 dark:text-slate-400">@</strong> para adjuntar el contexto de una predicción o proyecto.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSend(s.text)}
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left text-xs text-slate-600 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <span className="text-primary-400 dark:text-primary-500 mt-0.5 shrink-0">{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${
                msg.role === "ai"
                  ? "bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-900/30 dark:border-primary-800"
                  : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700"
              }`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="group/msg flex flex-col gap-1">
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "ai"
                  ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:text-slate-200"
                  : "bg-primary-600 text-white shadow-md shadow-primary-500/10"
              }`}>
                {/* Context chips on user messages */}
                {msg.refs?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {msg.refs.map((r, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-medium">
                        {r.type === "job" ? <Dna className="w-2.5 h-2.5" /> : <FolderOpen className="w-2.5 h-2.5" />}
                        {r.proteinName || r.name}
                      </span>
                    ))}
                  </div>
                )}
                {msg.role === "ai" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:my-2">
                    <ReactMarkdown>{msg.streaming ? msg.text + "▍" : msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
              </div>
              {msg.role === "ai" && !msg.streaming && (
                <CopyButton text={msg.text} />
              )}
              </div>
            </div>
          </div>
        ))}

        {isWaiting && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-500" />
              </div>
              <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto relative">

          {/* @ dropdown */}
          {atQuery !== null && filteredItems.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-30 max-h-56 overflow-y-auto"
            >
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                <AtSign className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Referenciar contexto</span>
              </div>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onMouseDown={(e) => { e.preventDefault(); selectReference(item); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-700">
                    {item.kind === "job"
                      ? (STATUS_ICON[item.status] ?? <Dna className="w-3.5 h-3.5 text-slate-400" />)
                      : <FolderOpen className="w-3.5 h-3.5 text-primary-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.kind === "job" ? `Predicción · ${item.status}` : "Proyecto colaborativo"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Reference pills */}
          {references.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {references.map((r) => (
                <span
                  key={r.id}
                  className="flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-[11px] font-medium text-primary-700 dark:text-primary-300"
                >
                  {r.kind === "job" ? <Dna className="w-3 h-3" /> : <FolderOpen className="w-3 h-3" />}
                  {r.label}
                  <button
                    onClick={() => removeReference(r.id)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input row */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setAtQuery(null); return; }
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Pregunta sobre estructuras, proteínas… o escribe @ para adjuntar contexto"
              rows={1}
              className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed py-1"
              style={{ maxHeight: "160px", overflowY: "auto" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="shrink-0 w-8 h-8 flex items-center justify-center bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2">
            Enter para enviar · Shift+Enter para nueva línea · @ para referenciar contexto
          </p>
        </div>
      </div>
    </div>
  );
}
