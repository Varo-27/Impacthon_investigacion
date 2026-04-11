import { useState, useEffect, useRef, useMemo } from "react";
import { RefreshCw, CheckCircle2, Clock, XCircle, Share2, Check, Dna, GitBranch, Search, ChevronsUpDown, FolderOpen, Filter, X as CloseX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "../contexts/ToastContext";

const STATUS = {
  COMPLETED: { label: "Completed", Icon: CheckCircle2, iconClass: "text-purple-500 dark:text-purple-400", badge: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50" },
  RUNNING:   { label: "Running",   Icon: GitBranch,    iconClass: "text-green-600 dark:text-green-400",   badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50" },
  PENDING:   { label: "Queued",    Icon: Clock,        iconClass: "text-slate-400 dark:text-slate-500",   badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  FAILED:    { label: "Failed",    Icon: XCircle,      iconClass: "text-red-500 dark:text-red-400",       badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50" },
};

const FILTERS = [
  { key: "all",    label: "Todos" },
  { key: "open",   label: "En progreso" },
  { key: "closed", label: "Finalizados" },
];

const SORT_OPTIONS = [
  { key: "date_desc", label: "Más recientes" },
  { key: "date_asc",  label: "Más antiguos"  },
  { key: "name_asc",  label: "Nombre A–Z"    },
  { key: "name_desc", label: "Nombre Z–A"    },
  { key: "status",    label: "Estado"        },
];

const AUTO_REFRESH_MS = 30_000;

function notify(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/logo.png" });
  }
}

export default function JobsList() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [userId,     setUserId]     = useState(null);
  const [copiedId,   setCopiedId]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [sortKey,    setSortKey]    = useState("date_desc");
  const [sortOpen,   setSortOpen]   = useState(false);
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minLength, setMinLength] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [advancedSearch, setAdvancedSearch] = useState("");
  
  const CATEGORIES = ["enzyme", "transport", "signaling", "immune", "hormone", "reporter", "structural", "oncology", "dna-replication"];
  const TAGS = ["calcium", "human", "fluorescent"];

  /* projectId → name cache */
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
            notify("Predicción completada", `"${job.proteinName}" ya está lista en LocalFold.`);
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

      /* Resolve project names for jobs that have a projectId */
      const unknownIds = [...new Set(
        data.filter((j) => j.projectId && !projectNames[j.projectId]).map((j) => j.projectId)
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
      } catch (_) {}
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

  /* ── Derived list ── */
  const visible = useMemo(() => {
    let list = [...jobs];
    if (filter === "open")   list = list.filter((j) => j.status === "PENDING" || j.status === "RUNNING");
    if (filter === "closed") list = list.filter((j) => j.status === "COMPLETED" || j.status === "FAILED");
    
    // Advanced filters
    if (selectedProjects.length > 0) {
      list = list.filter((j) => selectedProjects.includes(j.projectId));
    }
    
    if (selectedCategories.length > 0) {
      list = list.filter((j) => j.category && selectedCategories.includes(j.category));
    }
    
    if (minLength || maxLength) {
      list = list.filter((j) => {
        const len = j.length || 0;
        const min = minLength ? parseInt(minLength) : 0;
        const max = maxLength ? parseInt(maxLength) : Infinity;
        return len >= min && len <= max;
      });
    }
    
    if (advancedSearch.trim()) {
      const term = advancedSearch.toLowerCase();
      list = list.filter((j) =>
        j.proteinName?.toLowerCase().includes(term) ||
        (j.organism && j.organism.toLowerCase().includes(term)) ||
        (j.tags && j.tags?.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) =>
        j.proteinName?.toLowerCase().includes(q) ||
        j.cesgaJobId?.toLowerCase().includes(q) ||
        (j.projectId && projectNames[j.projectId]?.toLowerCase().includes(q))
      );
    }
    const ORDER = { RUNNING: 0, PENDING: 1, FAILED: 2, COMPLETED: 3 };
    switch (sortKey) {
      case "date_asc":  list.sort((a, b) => a._ts - b._ts); break;
      case "name_asc":  list.sort((a, b) => (a.proteinName || "").localeCompare(b.proteinName || "")); break;
      case "name_desc": list.sort((a, b) => (b.proteinName || "").localeCompare(a.proteinName || "")); break;
      case "status":    list.sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9)); break;
      default:          list.sort((a, b) => b._ts - a._ts);
    }
    return list;
  }, [jobs, filter, search, sortKey, projectNames, selectedProjects, selectedCategories, minLength, maxLength, advancedSearch]);

  const counts = {
    all:    jobs.length,
    open:   jobs.filter((j) => j.status === "PENDING" || j.status === "RUNNING").length,
    closed: jobs.filter((j) => j.status === "COMPLETED" || j.status === "FAILED").length,
  };

  const currentSort = SORT_OPTIONS.find((o) => o.key === sortKey);

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Mis predicciones</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Sync con CESGA API (Shift+Click para demo)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
      <div className="flex flex-col gap-3 mb-3">
        {/* Search and filters row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, ID o proyecto…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              showAdvancedFilters
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Mostrar/ocultar filtros avanzados"
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
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

        {/* Status filters row */}
        <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-800 shrink-0 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-r last:border-r-0 border-slate-300 dark:border-slate-600 ${
                filter === f.key
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                filter === f.key
                  ? "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              }`}>{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Por proyecto */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">Por proyecto</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(projectNames).map(([id, name]) => (
                    <label key={id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects([...selectedProjects, id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(p => p !== id));
                          }
                        }}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categoría funcional */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">Categoría</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat));
                          }
                        }}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 capitalize">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Longitud de aminoácidos */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">Longitud (aa)</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Mín."
                    value={minLength}
                    onChange={(e) => setMinLength(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <input
                    type="number"
                    placeholder="Máx."
                    value={maxLength}
                    onChange={(e) => setMaxLength(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              {/* Búsqueda avanzada */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">Nombre/Organismo/Tag</label>
                <input
                  type="text"
                  placeholder="ej: human, calcium..."
                  value={advancedSearch}
                  onChange={(e) => setAdvancedSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Tags: {TAGS.join(", ")}</div>
              </div>
            </div>

            {/* Limpiar filtros */}
            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setSelectedProjects([]);
                  setSelectedCategories([]);
                  setMinLength("");
                  setMaxLength("");
                  setAdvancedSearch("");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-700 text-white transition-colors"
              >
                <CloseX className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main panel */}
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
        {!loading && visible.length > 0 && (
          <div className="hidden sm:grid grid-cols-[1fr_120px_140px_96px] items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Predicción</span><span>Estado</span><span>Fecha</span><span />
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
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
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {filter === "open" ? "No hay jobs activos." : filter === "closed" ? "Aún no se ha completado ninguna predicción." : "Envía tu primera secuencia FASTA para empezar."}
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
              const projName = job.projectId ? projectNames[job.projectId] : null;

              return (
                <li key={job.id} className="group sm:grid sm:grid-cols-[1fr_120px_140px_96px] items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">

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
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
                          {job.cesgaJobId?.substring(0, 22)}…
                        </p>
                        {/* Project badge */}
                        {projName && (
                          <button
                            onClick={() => navigate(`/app/projects/${job.projectId}`)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors shrink-0"
                          >
                            <FolderOpen className="w-2.5 h-2.5" />
                            {projName}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 sm:mt-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 truncate">
                    {job.relativeDate}
                  </span>

                  <div className="hidden sm:flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isCompleted && (
                      <button
                        onClick={() => handleShare(job.cesgaJobId)}
                        title="Copiar enlace"
                        className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                      >
                        {copiedId === job.cesgaJobId ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {isCompleted && (
                      <button
                        onClick={() => navigate(`/app?job=${job.cesgaJobId}`)}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Ver 3D
                      </button>
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
          {visible.length} de {jobs.length} predicción{jobs.length !== 1 ? "es" : ""} · auto-sync cada 30s
        </p>
      )}
    </div>
  );
}

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
