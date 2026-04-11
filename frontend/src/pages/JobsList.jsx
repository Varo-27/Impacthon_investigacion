import { useState, useEffect } from "react";
import { RefreshCw, Play, Clock, CheckCircle2, ChevronRight, AlertCircle, Share2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function JobsList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleShare = (cesgaJobId) => {
    const url = `${window.location.origin}/app?job=${cesgaJobId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(cesgaJobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Esperar a que Firebase Auth confirme el usuario (evita race condition)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      if (!user) setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Escuchar cambios en Firestore solo cuando tengamos userId confirmado
  useEffect(() => {
    if (!userId) return;

    // NOTA: Sin orderBy para evitar el índice compuesto (ordenamos en cliente)
    const q = query(
      collection(db, "jobs"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          date: d.data().createdAt?.toDate().toLocaleDateString() || "Reciente",
          _ts: d.data().createdAt?.toMillis() || 0
        }))
        // Ordenamos por fecha descendente en el cliente
        .sort((a, b) => b._ts - a._ts);

      setJobs(jobsData);
      setLoading(false);
      refreshCesgaStatuses(jobsData);
    });

    return () => unsubscribe();
  }, [userId]);

  const refreshCesgaStatuses = async (currentJobs) => {
    // Solo comprobamos los que sigan PENDING o RUNNING
    const pendingJobs = currentJobs.filter(j => j.status !== "COMPLETED");
    
    for (const job of pendingJobs) {
      try {
        const resp = await fetch(`https://api-mock-cesga.onrender.com/jobs/${job.cesgaJobId}/status`);
        if (resp.ok) {
          const data = await resp.json();
          // Si el estado ha cambiado en el CESGA, actualizamos nuestra nube en Google
          if (data.status !== job.status) {
            const jobRef = doc(db, "jobs", job.id);
            await updateDoc(jobRef, {
              status: data.status
            });
          }
        }
      } catch (e) {
        console.error("Error al sincronizar con CESGA para", job.cesgaJobId, e);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completado
          </span>
        );
      case "RUNNING":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 animate-pulse">
            <Play className="w-3.5 h-3.5" /> Ejecutando
          </span>
        );
      case "PENDING":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
            <Clock className="w-3.5 h-3.5" /> En Cola
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="w-3.5 h-3.5" /> Error
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 w-full">
      <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Monitor de HPC local
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Consulta en tiempo real el gestor de colas conectado a `api-mock-cesga`.
          </p>
        </div>
        <button 
          onClick={() => refreshCesgaStatuses(jobs)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4`} />
          Refrescar API
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">ID Trabajo (CESGA)</th>
                <th className="px-6 py-4">Proteína</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                  <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-slate-200">
                    {job.cesgaJobId.substring(0, 15)}...
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                    {job.proteinName}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(job.status)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {job.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botón Compartir */}
                      {job.status === "COMPLETED" && (
                        <button
                          onClick={() => handleShare(job.cesgaJobId)}
                          title="Copiar enlace para compartir"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300"
                        >
                          {copiedId === job.cesgaJobId
                            ? <Check className="w-4 h-4 text-emerald-500" />
                            : <Share2 className="w-4 h-4" />}
                        </button>
                      )}
                      {/* Botón Ver Resultados */}
                      <button
                        onClick={() => navigate(`/app?job=${job.cesgaJobId}`)}
                        disabled={job.status !== "COMPLETED"}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          job.status === "COMPLETED"
                            ? "bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                        }`}
                      >
                        Renderizar 3D
                        {job.status === "COMPLETED" && <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mb-4" />
            <p className="text-slate-500">Cargando tu historial desde la nube...</p>
          </div>
        )}

        {jobs.length === 0 && !loading && (
          <div className="text-center py-20 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">Tu historial está vacío</h3>
            <p className="text-slate-500 dark:text-slate-400">Tus trabajos enviados a la API de Google Cloud aparecerán aquí.</p>
            <button 
              onClick={() => navigate("/app/submit")}
              className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Nuevo Trabajo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
