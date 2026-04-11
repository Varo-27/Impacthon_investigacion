import { useState, useRef, useCallback, useEffect } from "react";
import {
  Send, Bot, User, BrainCircuit, BookOpen, Dna, FlaskConical,
  Microscope, X, FolderOpen, CheckCircle2, GitBranch, Clock, XCircle, AtSign,
  Copy, Check, Plus, RotateCcw, Layers, ChevronRight, ChevronLeft
} from "lucide-react";
import { ragApi } from "../api/ragApi";
import { getJobOutputs } from "../lib/outputsCache";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ReactMarkdown from "react-markdown";

/* ─── Storage keys ─── */
const STORAGE_MESSAGES_KEY = "rag_messages";
const STORAGE_SESSION_KEY = "rag_session_id";
/**
 * Bridges the gap between receiving the API reply and the first
 * React + sessionStorage render cycle. Written synchronously as
 * soon as the reply arrives, cleared when streaming completes.
 */
const STORAGE_PENDING_REPLY_KEY = "rag_pending_reply";

/**
 * Module-level promise: survives component unmount.
 * If the user navigates away while waiting for the API, this promise
 * is still in-flight. On remount we subscribe to it again.
 */
let _pendingPromise = null;

/* ─── Suggestions ─── */
const SUGGESTIONS = [
  { icon: <Dna className="w-4 h-4" />, text: "¿Qué es el pLDDT y cómo interpreto su valor?" },
  { icon: <FlaskConical className="w-4 h-4" />, text: "¿Cómo afecta la solubilidad al uso experimental de una proteína?" },
  { icon: <BookOpen className="w-4 h-4" />, text: "Explícame qué es AlphaFold y cómo predice estructuras." },
  { icon: <Microscope className="w-4 h-4" />, text: "¿Qué indica un índice de inestabilidad alto en una proteína?" },
];

/* ─── Status icons ─── */
const STATUS_ICON = {
  COMPLETED: <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />,
  RUNNING: <GitBranch className="w-3.5 h-3.5 text-green-500" />,
  PENDING: <Clock className="w-3.5 h-3.5 text-slate-400" />,
  FAILED: <XCircle className="w-3.5 h-3.5 text-red-500" />,
};

/* ─── Helpers ─── */
function getOrCreateSessionId() {
  let id = sessionStorage.getItem(STORAGE_SESSION_KEY);
  if (!id) {
    id = `rag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(STORAGE_SESSION_KEY, id);
  }
  return id;
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

/* ─── CopyButton ─── */
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

/* ─── Context Panel (+ button) ─── */
function ContextPanel({ allItems, references, onToggle, onClose }) {
  const [view, setView] = useState("main"); // "main" | "jobs-folders" | "jobs-list" | "projects-list"
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const jobs = allItems.filter((i) => i.kind === "job");
  const projects = allItems.filter((i) => i.kind === "project");
  const isSelected = (id) => references.some((r) => r.id === id);

  const unassignedJobs = jobs.filter((j) => !j.projectId);

  const jobFolders = projects.map((p) => {
    const projectJobs = jobs.filter((j) => j.projectId === p.id);
    return { ...p, jobCount: projectJobs.length };
  });

  const getHeaderTitle = () => {
    if (view === "jobs-folders") return "Seleccionar origen";
    if (view === "jobs-list") {
      if (selectedProjectId === "unassigned") return "Sin proyecto asignado";
      const p = projects.find((p) => p.id === selectedProjectId);
      return p ? p.label : "Predicciones";
    }
    if (view === "projects-list") return "Seleccionar proyecto completo";
    return "Añadir contexto al mensaje";
  };

  const renderContent = () => {
    switch (view) {
      case "main":
        return (
          <>
            <button
              onMouseDown={(e) => { e.preventDefault(); setView("jobs-folders"); }}
              className="w-full flex items-center justify-between px-3 py-3 outline-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Dna className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Predicciones individuales
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Añade trabajos específicos como contexto
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700" />
            <button
              onMouseDown={(e) => { e.preventDefault(); setView("projects-list"); }}
              className="w-full flex items-center justify-between px-3 py-3 outline-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Proyectos completos
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Añade un proyecto entero y sus trabajos
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </>
        );

      case "jobs-folders":
        return (
          <>
            {jobFolders.map((folder) => (
              <button
                key={folder.id}
                onMouseDown={(e) => { e.preventDefault(); setSelectedProjectId(folder.id); setView("jobs-list"); }}
                className="w-full flex items-center justify-between px-4 py-3 outline-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b last:border-b-0 border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderOpen className="w-4 h-4 text-primary-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{folder.label}</span>
                    <span className="text-[10px] text-slate-400">{folder.jobCount} predicciones</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
            {jobFolders.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-700" />}
            <button
              onMouseDown={(e) => { e.preventDefault(); setSelectedProjectId("unassigned"); setView("jobs-list"); }}
              className="w-full flex items-center justify-between px-4 py-3 outline-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">Sin proyecto asignado</span>
                  <span className="text-[10px] text-slate-400">{unassignedJobs.length} predicciones</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </>
        );

      case "jobs-list": {
        const list = selectedProjectId === "unassigned"
          ? unassignedJobs
          : jobs.filter((j) => j.projectId === selectedProjectId);

        if (list.length === 0) {
          return <p className="px-3 py-5 text-sm text-slate-400 text-center">No hay predicciones en esta carpeta.</p>;
        }

        return list.map((item) => (
          <button
            key={item.id}
            onMouseDown={(e) => { e.preventDefault(); onToggle(item); }}
            className="w-full flex items-center gap-3 px-3 py-2 outline-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected(item.id) ? "bg-primary-600 border-primary-600" : "border-slate-300 dark:border-slate-600"
              }`}>
              {isSelected(item.id) && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="shrink-0">{STATUS_ICON[item.status] ?? <Dna className="w-3.5 h-3.5 text-slate-400" />}</span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.label}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{item.status}</span>
            </div>
          </button>
        ));
      }

      case "projects-list":
        if (projects.length === 0) {
          return <p className="px-3 py-5 text-sm text-slate-400 text-center">No hay proyectos.</p>;
        }
        return projects.map((item) => (
          <button
            key={item.id}
            onMouseDown={(e) => { e.preventDefault(); onToggle(item); }}
            className="w-full flex items-center gap-3 px-3 py-2 outline-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected(item.id)
              ? "bg-primary-600 border-primary-600"
              : "border-slate-300 dark:border-slate-600"
              }`}>
              {isSelected(item.id) && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FolderOpen className="w-3.5 h-3.5 text-primary-400 shrink-0" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.label}</span>
              <span className="text-[10px] text-slate-400 shrink-0">proyecto</span>
            </div>
          </button>
        ));

      default: return null;
    }
  };

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden max-h-[320px] flex flex-col">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-800/80">
        <div className="flex items-center gap-2">
          {view !== "main" ? (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                if (view === "jobs-list") setView("jobs-folders");
                else setView("main");
              }}
              className="p-1 -ml-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <Layers className="w-4 h-4 ml-1 text-primary-500" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {getHeaderTitle()}
          </span>
        </div>
        <button
          onMouseDown={(e) => { e.preventDefault(); onClose(); }}
          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {renderContent()}
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function RAGAssistant() {

  /* Persist messages across navigation */
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_MESSAGES_KEY) || "[]");
    } catch { return []; }
  });

  const [input, setInput] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  /* @ mention */
  const [atQuery, setAtQuery] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  /* References / context */
  const [references, setReferences] = useState([]);
  const [allItems, setAllItems] = useState([]);

  /* Context panel (+ button) */
  const [showContextPanel, setShowContextPanel] = useState(false);

  const dropdownRef = useRef(null);
  const scrollRef = useRef(null);
  const cancelStream = useRef(null);
  const inputRef = useRef(null);
  const sessionId = useRef(getOrCreateSessionId());

  /* ── Sync messages → sessionStorage ── */
  useEffect(() => {
    const toSave = messages.map((m) => ({
      ...m,
      // If mid-stream, save the full API text (not the partial animated slice)
      // so navigating away never stores a truncated response.
      text: m.streaming && m.fullText ? m.fullText : m.text,
      streaming: false,
      fullText: undefined,
    }));
    sessionStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(toSave));
  }, [messages]);

  /* ── Load user's jobs + projects (real-time) ── */
  useEffect(() => {
    let unsubJobs = () => { }, unsubProjects = () => { };
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
            projectId: d.data().projectId || null,
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
          setAllItems((prev) => [...prev.filter((i) => i.kind !== "job"), ...jobs]);
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
          setAllItems((prev) => [...prev.filter((i) => i.kind !== "project"), ...projects]);
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

  /* ── Auto-resize textarea ── */
  const autoResize = useCallback(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, []);

  /* ── Input change with @ detection + auto-resize ── */
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    autoResize();
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    setAtQuery(match ? match[1] : null);
    setActiveIndex(-1);
  };

  /* ── Enrich a reference item with external data, then add it ── */
  const selectReference = async (item) => {
    setAtQuery(null);

    if (references.find((r) => r.id === item.id)) {
      inputRef.current?.focus();
      return;
    }

    // Optimistic update: instantly add to UI
    setReferences((prev) => [...prev, item]);
    inputRef.current?.focus();

    let enrichedItem = { ...item };

    // Jobs: enrich with CESGA outputs (shared cache with Viewer)
    if (item.kind === "job" && item.data.jobId) {
      try {
        const outputs = await getJobOutputs(item.data.jobId);
        enrichedItem = {
          ...item,
          data: {
            ...item.data,
            plddt: outputs.plddt ?? item.data.plddt,
            organism: outputs.organism ?? item.data.organism,
            biological: outputs.biological ?? item.data.biological,
            uniprot: outputs.uniprot ?? null,
            plddtHistogram: outputs.plddtHistogram ?? null,
          },
        };
      } catch { /* use Firestore data */ }
    }

    // Projects: enrich with their jobs from Firestore
    if (item.kind === "project") {
      try {
        const jobsSnap = await getDocs(
          query(collection(db, "jobs"), where("projectId", "==", item.id))
        );
        const projectJobs = jobsSnap.docs.map((d) => ({
          jobId: d.data().cesgaJobId,
          proteinName: d.data().proteinName,
          status: d.data().status,
          plddt: d.data().plddt ?? null,
          organism: d.data().organism ?? null,
        }));
        enrichedItem = { ...item, data: { ...item.data, jobs: projectJobs } };
      } catch { /* project with no jobs is fine */ }
    }

    // Update in background
    setReferences((prev) => prev.map((r) => (r.id === item.id ? enrichedItem : r)));
  };

  /* Toggle for the + panel (add if absent, remove if present) */
  const toggleReference = async (item) => {
    if (references.find((r) => r.id === item.id)) {
      setReferences((prev) => prev.filter((r) => r.id !== item.id));
    } else {
      await selectReference(item);
    }
  };

  const removeReference = (id) =>
    setReferences((prev) => prev.filter((r) => r.id !== id));

  const filteredItems = atQuery === null
    ? []
    : allItems.filter((i) => i.label.toLowerCase().includes(atQuery.toLowerCase())).slice(0, 8);

  /* ── Streaming ── */
  const startStream = useCallback((fullText) => {
    // Store fullText in the message so sessionStorage always has the complete text,
    // even if the component is unmounted mid-animation.
    setMessages((prev) => [...prev, { role: "ai", text: "", fullText, streaming: true }]);
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
          next[next.length - 1] = { ...next[next.length - 1], streaming: false, fullText: undefined };
          return next;
        });
        setIsStreaming(false);
        cancelStream.current = null;
        // Stream finished cleanly — no longer need the safety-net key
        sessionStorage.removeItem(STORAGE_PENDING_REPLY_KEY);
      }
    );
  }, [scrollToBottom]);

  /* ── Re-subscribe to in-flight request on mount ── */
  useEffect(() => {
    // Case A: fetch still running — re-attach to the pending promise
    if (_pendingPromise) {
      setIsWaiting(true);
      _pendingPromise.then((reply) => {
        _pendingPromise = null;
        // Save synchronously before touching React state
        sessionStorage.setItem(STORAGE_PENDING_REPLY_KEY, reply);
        setIsWaiting(false);
        startStream(reply);
      });
      return;
    }

    // Case B: fetch resolved but React state update never fired (the gap)
    const savedReply = sessionStorage.getItem(STORAGE_PENDING_REPLY_KEY);
    if (savedReply) {
      const savedMsgs = JSON.parse(sessionStorage.getItem(STORAGE_MESSAGES_KEY) || "[]");
      const last = savedMsgs[savedMsgs.length - 1];
      // Only replay if the AI message was not yet committed to sessionStorage
      if (!last || last.role === "user") {
        startStream(savedReply);
      } else {
        // Already saved correctly, just clean up
        sessionStorage.removeItem(STORAGE_PENDING_REPLY_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Send message ── */
  const handleSend = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || isWaiting || isStreaming) return;

    setInput("");
    setAtQuery(null);
    setShowContextPanel(false);
    if (inputRef.current) inputRef.current.style.height = "auto";

    const ctx = references.map((r) => r.data);
    setReferences([]);

    const updated = [...messages, { role: "user", text: msg, refs: ctx }];
    setMessages(updated);
    setIsWaiting(true);

    // Keep the promise in module scope so it survives component unmount
    _pendingPromise = ragApi.sendMessage(msg, updated, sessionId.current, ctx);
    const reply = await _pendingPromise;
    _pendingPromise = null;

    // Write reply synchronously BEFORE touching React state.
    // This bridges the gap if the component unmounts between here and
    // the first useEffect([messages]) render cycle.
    sessionStorage.setItem(STORAGE_PENDING_REPLY_KEY, reply);

    setIsWaiting(false);
    startStream(reply);
    inputRef.current?.focus();
  };

  /* ── New conversation ── */
  const handleNewConversation = () => {
    cancelStream.current?.();
    _pendingPromise = null;
    setMessages([]);
    setReferences([]);
    setInput("");
    setAtQuery(null);
    setShowContextPanel(false);
    sessionStorage.removeItem(STORAGE_MESSAGES_KEY);
    sessionStorage.removeItem(STORAGE_PENDING_REPLY_KEY);
    const newId = `rag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(STORAGE_SESSION_KEY, newId);
    sessionId.current = newId;
    if (inputRef.current) inputRef.current.style.height = "auto";
  };


  /* ── Keyboard navigation ── */
  const handleKeyDown = (e) => {
    // @ dropdown navigation
    if (atQuery !== null && filteredItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filteredItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? filteredItems.length - 1 : i - 1));
        return;
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        selectReference(filteredItems[activeIndex]);
        setInput((prev) => prev.replace(/@\w*$/, ""));
        return;
      }
    }
    if (e.key === "Escape") { setAtQuery(null); setShowContextPanel(false); return; }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const busy = isWaiting || isStreaming;
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white">ProteIA</h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Especializado en biología estructural · usa{" "}
            <strong className="font-semibold">@</strong> o{" "}
            <strong className="font-semibold">+</strong> para adjuntar contexto
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleNewConversation}
            title="Nueva conversación"
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Nueva conversación
          </button>
        )}
      </div>

      {/* ── Messages / Empty state ── */}
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
                Soy un asistente especializado en biología estructural. Escribe{" "}
                <strong className="text-slate-500 dark:text-slate-400">@</strong> o usa el botón{" "}
                <strong className="text-slate-500 dark:text-slate-400">+</strong> para adjuntar el contexto de una predicción o proyecto.
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
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${msg.role === "ai"
                ? "bg-primary-50 border-primary-100 text-primary-600 dark:bg-primary-900/30 dark:border-primary-800"
                : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700"
                }`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="group/msg flex flex-col gap-1">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "ai"
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

      {/* ── Input area ── */}
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
              {filteredItems.map((item, idx) => (
                <button
                  key={item.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectReference(item);
                    setInput((prev) => prev.replace(/@\w*$/, ""));
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left ${idx === activeIndex
                    ? "bg-primary-50 dark:bg-primary-900/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
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

          {/* Context panel (+ button) */}
          {showContextPanel && (
            <ContextPanel
              allItems={allItems}
              references={references}
              onToggle={toggleReference}
              onClose={() => setShowContextPanel(false)}
            />
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
            className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500"
          >
            {/* + Context button */}
            <button
              type="button"
              onClick={() => { setShowContextPanel((v) => !v); setAtQuery(null); }}
              title="Añadir contexto"
              className={`shrink-0 mb-1 w-7 h-7 flex items-center justify-center rounded-lg transition-colors relative ${showContextPanel || references.length > 0
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 border border-slate-200 dark:border-slate-600"
                }`}
            >
              <Plus className="w-4 h-4" />
              {references.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-600 border-2 border-white dark:border-slate-800 text-[9px] font-bold text-white flex items-center justify-center leading-none">
                  {references.length}
                </span>
              )}
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre estructuras, proteínas… o escribe @ para adjuntar contexto"
              rows={1}
              className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed py-1"
              style={{ maxHeight: "160px", overflowY: "auto" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="shrink-0 mb-1 w-8 h-8 flex items-center justify-center bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2">
            Enter para enviar · Shift+Enter para nueva línea · @ o + para añadir contexto
          </p>
        </div>
      </div>
    </div>
  );
}
