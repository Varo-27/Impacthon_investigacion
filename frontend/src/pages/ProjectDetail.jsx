import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import {
  collection, query, where, onSnapshot, doc,
  updateDoc, addDoc, deleteField, serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowLeft, RefreshCw, CheckCircle2, Clock, XCircle, GitBranch,
  Dna, Search, ChevronsUpDown, Check, Share2, Crown, Users,
  UserPlus, Plus, FolderMinus,
} from "lucide-react";
import { InviteModal } from "./Projects";

/* ── shared helpers ── */
const STATUS = {
  COMPLETED: { label: "Completed", Icon: CheckCircle2, iconClass: "text-purple-500 dark:text-purple-400", badge: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50" },
  RUNNING:   { label: "Running",   Icon: GitBranch,    iconClass: "text-green-600 dark:text-green-400",   badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50" },
  PENDING:   { label: "Queued",    Icon: Clock,        iconClass: "text-slate-400 dark:text-slate-500",   badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  FAILED:    { label: "Failed",    Icon: XCircle,      iconClass: "text-red-500 dark:text-red-400",       badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50" },
};

const SORT_OPTIONS = [
  { key: "date_desc", label: "Más recientes" },
  { key: "date_asc",  label: "Más antiguos"  },
  { key: "name_asc",  label: "Nombre A–Z"    },
  { key: "status",    label: "Estado"         },
];

function formatRelative(date) {
  if (!date) return "—";
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "ahora mismo";
  if (mins  < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days  < 30) return `hace ${days}d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function ProjectDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [user,      setUser]      = useState(null);
  const [project,   setProject]   = useState(null);
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);

  const [search,    setSearch]    = useState("");
  const [sortKey,   setSortKey]   = useState("date_desc");
  const [sortOpen,  setSortOpen]  = useState(false);
  const [copiedId,  setCopiedId]  = useState(null);
  const [refreshing,setRefreshing]= useState(false);
  const [showInvite,setShowInvite]= useState(false);

  /* Auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  /* Project doc — live listener so member changes reflect immediately */
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "projects", id), (snap) => {
      if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
      setProject({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [id]);

  /* Jobs for this project */
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "jobs"), where("projectId", "==", id));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data(), _ts: d.data().createdAt?.toMillis() || 0, relativeDate: formatRelative(d.data().createdAt?.toDate()) }))
        .sort((a, b) => b._ts - a._ts);
      setJobs(data);
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const refreshStatuses = async () => {
    setRefreshing(true);
    const pending = jobs.filter((j) => j.status !== "COMPLETED" && j.status !== "FAILED");
    for (const job of pending) {
      try {
        const resp = await fetch(`https://api-mock-cesga.onrender.com/jobs/${job.cesgaJobId}/status`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.status !== job.status) await updateDoc(doc(db, "jobs", job.id), { status: data.status });
        }
      } catch (_) {}
    }
    setRefreshing(false);
  };

  const handleRemoveFromProject = async (jobId) => {
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        projectId:   deleteField(),
        projectName: deleteField(),
        updatedAt:   serverTimestamp(),
      });
    } catch (e) {
      console.error("Error al quitar el job del proyecto:", e);
    }
  };

  const handleShare = (cesgaJobId) => {
    navigator.clipboard.writeText(`${window.location.origin}/app?job=${cesgaJobId}`);
    setCopiedId(cesgaJobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const visible = useMemo(() => {
    let list = [...jobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) => j.proteinName?.toLowerCase().includes(q) || j.cesgaJobId?.toLowerCase().includes(q));
    }
    const ORDER = { RUNNING: 0, PENDING: 1, FAILED: 2, COMPLETED: 3 };
    switch (sortKey) {
      case "date_asc":  list.sort((a, b) => a._ts - b._ts); break;
      case "name_asc":  list.sort((a, b) => (a.proteinName || "").localeCompare(b.proteinName || "")); break;
      case "status":    list.sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9)); break;
      default:          list.sort((a, b) => b._ts - a._ts);
    }
    return list;
  }, [jobs, search, sortKey]);

  const currentSort = SORT_OPTIONS.find((o) => o.key === sortKey);
  const isOwner = project?.members?.find((m) => m.uid === user?.uid)?.role === "owner";

  if (notFound) return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-slate-400">
      <p className="text-sm">Proyecto no encontrado.</p>
      <button onClick={() => navigate("/app/projects")} className="text-xs text-primary-600 hover:underline">← Volver a proyectos</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 w-full">

      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/app/projects")}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Proyectos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
            {project?.name ?? "Cargando…"}
          </h1>
          {project?.description && (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {isOwner && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invitar
            </button>
          )}
          <button
            onClick={() => navigate(`/app/submit?project=${id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva predicción
          </button>

        </div>
      </div>

      {/* Members row */}
      {project?.members && (
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center">
            {project.members.map((m, i) => (
              <div
                key={m.uid}
                title={`${m.displayName || m.email}${m.role === "owner" ? " (propietario)" : " (miembro)"}`}
                className="relative"
                style={{ marginLeft: i === 0 ? 0 : -6 }}
              >
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-800">
                  {(m.displayName || m.email)[0].toUpperCase()}
                </div>
                {m.role === "owner" && (
                  <Crown className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 drop-shadow-sm" />
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-400 leading-none">
            {project.members.length} miembro{project.members.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ID…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          onClick={refreshStatuses}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Sync
        </button>
        <div className="relative shrink-0">
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{currentSort?.label}</span>
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSortKey(opt.key); setSortOpen(false); }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors ${
                    sortKey === opt.key
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                  {sortKey === opt.key && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Jobs panel */}
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
        {!loading && visible.length > 0 && (
          <div className="hidden sm:grid grid-cols-[1fr_120px_140px_128px] items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Predicción</span><span>Estado</span><span>Fecha</span><span />
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
            <Dna className="w-9 h-9 text-slate-300 dark:text-slate-600" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {search ? "Sin resultados" : "Sin predicciones en este proyecto"}
              </p>
              {!search && (
                <p className="text-xs text-slate-400 mt-1">
                  Usa <strong>Nueva predicción</strong> para añadir la primera secuencia.
                </p>
              )}
            </div>
          </div>
        )}

        {!loading && visible.length > 0 && (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700/60">
            {visible.map((job) => {
              const cfg = STATUS[job.status] ?? STATUS.FAILED;
              const { Icon } = cfg;
              const isCompleted = job.status === "COMPLETED";
              return (
                <li key={job.id} className="group sm:grid sm:grid-cols-[1fr_120px_140px_128px] items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconClass}`} />
                    <div className="min-w-0">
                      <button
                        onClick={() => isCompleted && navigate(`/app?job=${job.cesgaJobId}`)}
                        disabled={!isCompleted}
                        className={`text-sm font-medium text-left leading-snug truncate max-w-full block transition-colors ${
                          isCompleted
                            ? "text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            : "text-slate-700 dark:text-slate-300 cursor-default"
                        }`}
                      >
                        {job.proteinName}
                      </button>
                      <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {job.cesgaJobId?.substring(0, 22)}…
                      </p>
                    </div>
                  </div>
                  <div className="mt-1.5 sm:mt-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 truncate">{job.relativeDate}</span>
                  <div className="hidden sm:flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRemoveFromProject(job.id)}
                      title="Quitar del proyecto"
                      className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <FolderMinus className="w-3.5 h-3.5" />
                    </button>
                    {isCompleted && (
                      <>
                        <button onClick={() => handleShare(job.cesgaJobId)} title="Copiar enlace" className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors">
                          {copiedId === job.cesgaJobId ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => navigate(`/app?job=${job.cesgaJobId}`)} className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          Ver 3D
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!loading && jobs.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-3">
          {visible.length} de {jobs.length} predicción{jobs.length !== 1 ? "es" : ""}
        </p>
      )}

      {showInvite && user && project && (
        <InviteModal project={project} user={user} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
