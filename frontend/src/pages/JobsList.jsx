import { useState, useEffect, useRef, useMemo } from "react";
import { RefreshCw, CheckCircle2, Clock, XCircle, Share2, Check, Dna, GitBranch, Search, FolderOpen, X, ArrowRightLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDoc, getDocs, deleteField, serverTimestamp, deleteDoc, or } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "../contexts/ToastContext"; import JobsFilterPanel from "../components/JobsFilterPanel";
const STATUS = {
  COMPLETED: { label: "Completed", Icon: CheckCircle2, iconClass: "text-purple-500 dark:text-purple-400", badge: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50" },
  RUNNING: { label: "Running", Icon: GitBranch, iconClass: "text-green-600 dark:text-green-400", badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50" },
  PENDING: { label: "Queued", Icon: Clock, iconClass: "text-slate-500 dark:text-slate-400 dark:text-slate-500", badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  FAILED: { label: "Failed", Icon: XCircle, iconClass: "text-red-500 dark:text-red-400", badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50" },
};


const AUTO_REFRESH_MS = 500; // 0.5 segundos

/* ── Modal eliminar job ── */
function DeleteJobModal({ job, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onConfirm(job.id);
      onClose();
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Eliminar predicción</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px]">{job.proteinName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all duration-200 ease-in-out active:scale-[0.98]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-300">¿Estás seguro?</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">Esta acción no se puede deshacer. Se eliminará permanentemente la predicción y todos sus datos.</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-all duration-200 ease-in-out active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-all duration-200 ease-in-out active:scale-[0.98]"
            >
              {busy ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal reasignar job entre proyectos ── */
function MoveJobModal({ job, userId, onClose }) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selected, setSelected] = useState(job.projectId ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      or(
        where("memberIds", "array-contains", userId),
        where("ownerId", "==", userId),
        where("userId", "==", userId)
      )
    );
    getDocs(q)
      .then((snap) => {
        setProjects(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
        setLoadingProjects(false);
      })
      .catch(() => setLoadingProjects(false));
  }, [userId]);

  const handleSave = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (selected === "") {
        await updateDoc(doc(db, "jobs", job.id), {
          projectId: deleteField(),
          projectName: deleteField(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const proj = projects.find((p) => p.id === selected);
        await updateDoc(doc(db, "jobs", job.id), {
          projectId: selected,
          projectName: proj?.name ?? "",
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  const currentLabel = job.projectName ?? (job.projectId ? "…" : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Reasignar predicción</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px]">{job.proteinName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all duration-200 ease-in-out active:scale-[0.98]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {err && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800">{err}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Proyecto destino</label>
            {loadingProjects ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Cargando proyectos…</p>
            ) : (
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
              >
                <option value="">Sin proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
          {currentLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proyecto actual: <span className="font-medium text-slate-600 dark:text-slate-300">{currentLabel}</span>
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 ease-in-out active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={busy || loadingProjects}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white transition-all duration-200 ease-in-out active:scale-[0.98]"
            >
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function notify(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/logo.png" });
  }
}

export default function JobsList() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [moveJob, setMoveJob] = useState(null); // job a reasignar
  const [deleteJob, setDeleteJob] = useState(null); // job a eliminar

  /* Nuevos estados para filtrado */
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    projects: [],
    categories: [],
    includeNoProject: false,
    maxLength: null,
    textSearch: "",
  });

  /* projectId → name cache (fallback para jobs creados antes del snapshot) */
  const [projectNames, setProjectNames] = useState({});

  /* Track previous statuses to detect transitions */
  const prevStatuses = useRef({});

  /* ── Pedir permiso de notificaciones al cargar ── */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ── Auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      if (!user) setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ── Firestore live listener ── */
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "jobs"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id, ...d.data(),
        _ts: d.data().createdAt?.toMillis() || 0,
        relativeDate: formatRelative(d.data().createdAt?.toDate()),
      })).sort((a, b) => b._ts - a._ts);

      /* Detect status transitions → toast + browser notification */
      data.forEach((job) => {
        const prev = prevStatuses.current[job.id];
        if (prev && prev !== job.status) {
          if (job.status === "COMPLETED") {
            addToast(`✓ "${job.proteinName}" ha completado la predicción.`, "success");
            notify("Predicción completada", `"${job.proteinName}" ya está lista en OmicaFold.`);
          } else if (job.status === "FAILED") {
            addToast(`"${job.proteinName}" falló en el clúster.`, "error");
            notify("Error en la predicción", `"${job.proteinName}" falló en CESGA.`);
          } else if (job.status === "RUNNING") {
            addToast(`"${job.proteinName}" está procesándose en CESGA.`, "info");
          }
        }
        prevStatuses.current[job.id] = job.status;
      });

      setJobs(data);
      setLoading(false);

      /* Resolve project names only for jobs that lack the projectName snapshot (legacy data) */
      const unknownIds = [...new Set(
        data.filter((j) => j.projectId && !j.projectName && !projectNames[j.projectId]).map((j) => j.projectId)
      )];
      unknownIds.forEach((pid) => {
        getDoc(doc(db, "projects", pid)).then((snap) => {
          if (snap.exists()) {
            setProjectNames((prev) => ({ ...prev, [pid]: snap.data().name }));
          }
        });
      });
    });
    return () => unsub();
  }, [userId, addToast, projectNames]);

  /* ── Cargar proyectos del usuario para el filtro ── */
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "projects"),
      or(
        where("memberIds", "array-contains", userId),
        where("ownerId", "==", userId),
        where("userId", "==", userId)
      )
    );
    getDocs(q)
      .then((snap) => {
        setProjects(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
      })
      .catch((e) => console.error("Error loading projects:", e));
  }, [userId]);

  /* ── Auto-refresh CESGA statuses every 30s ── */
  const refreshCesgaStatuses = async (currentJobs) => {
    const pending = currentJobs.filter((j) => j.status !== "COMPLETED" && j.status !== "FAILED");
    for (const job of pending) {
      try {
        const resp = await fetch(`https://api-mock-cesga.onrender.com/jobs/${job.cesgaJobId}/status`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.status !== job.status)
            await updateDoc(doc(db, "jobs", job.id), { status: data.status });
        }
      } catch (e) {
        console.error("Error refreshing job status:", e);
      }
    }
  };

  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => {
      setJobs((current) => { refreshCesgaStatuses(current); return current; });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [userId]);

  const handleRefresh = async (e) => {
    if (e.shiftKey || e.altKey) {
      if (!userId) return;
      try {
        await addDoc(collection(db, "jobs"), {
          userId, cesgaJobId: "job_demo_segura",
          proteinName: "Ubiquitina (Demo UI Pitch)",
          status: "COMPLETED", createdAt: new Date(),
        });
      } catch (err) { console.error(err); }
    } else {
      setRefreshing(true);
      await refreshCesgaStatuses(jobs);
      setRefreshing(false);
    }
  };

  const handleShare = (cesgaJobId) => {
    navigator.clipboard.writeText(`${window.location.origin}/app?job=${cesgaJobId}`);
    setCopiedId(cesgaJobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (jobId) => {
    try {
      const jobSnap = await getDoc(doc(db, "jobs", jobId));
      const jobName = jobSnap.data()?.proteinName || "Predicción";

      await deleteDoc(doc(db, "jobs", jobId));

      addToast(`✗ "${jobName}" ha sido eliminada.`, "success");
    } catch (e) {
      console.error("Error deleting job:", e);
      addToast("Error al eliminar la predicción", "error");
      throw e;
    }
  };

  /* ── Derived list with filtering ── */
  const visible = useMemo(() => {
    let list = [...jobs];

    /* Filtro de búsqueda original */
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) =>
        j.proteinName?.toLowerCase().includes(q) ||
        j.cesgaJobId?.toLowerCase().includes(q) ||
        (j.projectId && (j.projectName ?? projectNames[j.projectId])?.toLowerCase().includes(q))
      );
    }

    /* Filtro de proyecto (incluyendo sin proyecto) */
    if (filters.projects.length > 0 || filters.includeNoProject) {
      list = list.filter((j) => {
        if (filters.includeNoProject && !j.projectId) return true;
        if (filters.projects.includes(j.projectId)) return true;
        return false;
      });
    }

    /* Filtro de categoría funcional (múltiples) */
    if (filters.categories.length > 0) {
      list = list.filter((j) => filters.categories.includes(j.functionalCategory));
    }

    /* Filtro de longitud máxima de aa */
    if (filters.maxLength) {
      list = list.filter((j) => (j.aaLength ?? 0) <= filters.maxLength);
    }

    /* Filtro de búsqueda por nombre/organismo/tags */
    if (filters.textSearch.trim()) {
      const q = filters.textSearch.toLowerCase();
      list = list.filter((j) =>
        j.proteinName?.toLowerCase().includes(q) ||
        j.organism?.toLowerCase().includes(q) ||
        (j.tags && j.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    list.sort((a, b) => b._ts - a._ts);
    return list;
  }, [jobs, search, projectNames, filters]);

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mis predicciones</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Sync con CESGA API (Shift+Click para demo)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 ease-in-out active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button
            onClick={() => navigate("/app/submit")}
            className="px-3 py-1.5 text-sm font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            Nueva predicción
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 dark:text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ID o proyecto…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Panel */}
      <JobsFilterPanel
        jobs={jobs}
        projects={projects}
        onFiltersChange={setFilters}
        initialFilters={filters}
      />

      {/* Main panel */}
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
        {!loading && visible.length > 0 && (
          <div className="hidden sm:grid grid-cols-[1fr_120px_140px_96px] items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Predicción</span><span>Estado</span><span>Fecha</span><span />
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <Dna className="w-9 h-9 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {search ? "Sin resultados para esa búsqueda" : "No hay predicciones aquí"}
            </p>
            {!search && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Envía tu primera secuencia FASTA para empezar.
              </p>
            )}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700/60">
            {visible.map((job) => {
              const cfg = STATUS[job.status] ?? STATUS.FAILED;
              const { Icon } = cfg;
              const isCompleted = job.status === "COMPLETED";
              const projName = job.projectName ?? (job.projectId ? projectNames[job.projectId] : null);

              return (
                <li key={job.id} className="group sm:grid sm:grid-cols-[1fr_120px_140px_96px] items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">

                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconClass}`} />
                    <div className="min-w-0">
                      <button
                        onClick={() => isCompleted && navigate(`/app?job=${job.cesgaJobId}`)}
                        disabled={!isCompleted}
                        className={`text-sm font-medium text-left leading-snug truncate max-w-full block transition-colors ${isCompleted
                          ? "text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          : "text-slate-700 dark:text-slate-300 cursor-default"
                          }`}
                      >
                        {job.proteinName}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 dark:text-slate-500 truncate">
                          {job.cesgaJobId?.substring(0, 22)}…
                        </p>
                        {/* Project badge */}
                        {projName && (
                          <button
                            onClick={() => navigate(`/app/projects/${job.projectId}`)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors shrink-0"
                          >
                            <FolderOpen className="w-2.5 h-2.5" />
                            {projName}
                          </button>
                        )}
                      </div>

                      {/* Additional info row: category, organism, tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {/* Category badge */}
                        {job.functionalCategory && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            🏷️ {job.functionalCategory}
                          </span>
                        )}

                        {/* Organism badge */}
                        {job.organism && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            🧬 {job.organism.split(" ").slice(0, 2).join(" ")}
                          </span>
                        )}

                        {/* AA Length info */}
                        {job.aaLength && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                            ⚖️ {job.aaLength} aa
                          </span>
                        )}

                        {/* PDB ID if available */}
                        {job.pdbId && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            🔗 {job.pdbId}
                          </span>
                        )}

                        {/* Tags */}
                        {job.tags && job.tags.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {job.tags.slice(0, 2).join(", ")}{job.tags.length > 2 ? "..." : ""}
                          </span>
                        )}

                        {/* Molecular Weight if available */}
                        {job.molecularWeight != null && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                            ⚛️ {job.molecularWeight} kDa
                          </span>
                        )}

                        {/* pLDDT badge if available */}
                        {job.plddt != null && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${job.plddt >= 90 ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" :
                            job.plddt >= 70 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" :
                              "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                            }`}>
                            📊 pLDDT {job.plddt.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 sm:mt-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 truncate">
                    {job.relativeDate}
                  </span>

                  <div className="hidden sm:flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setMoveJob(job)}
                      title="Reasignar proyecto"
                      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                    {isCompleted && (
                      <button
                        onClick={() => handleShare(job.cesgaJobId)}
                        title="Copiar enlace"
                        className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        {copiedId === job.cesgaJobId ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {isCompleted && (
                      <button
                        onClick={() => navigate(`/app?job=${job.cesgaJobId}`)}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        Ver 3D
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteJob(job)}
                      title="Eliminar predicción"
                      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!loading && jobs.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
          {visible.length} de {jobs.length} predicción{jobs.length !== 1 ? "es" : ""} · auto-sync cada 30s
        </p>
      )}

      {moveJob && userId && (
        <MoveJobModal
          job={moveJob}
          userId={userId}
          onClose={() => setMoveJob(null)}
        />
      )}

      {deleteJob && (
        <DeleteJobModal
          job={deleteJob}
          onClose={() => setDeleteJob(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function formatRelative(date) {
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 30) return `hace ${days}d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
