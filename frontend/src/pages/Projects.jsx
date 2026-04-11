import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, arrayUnion, getDocs, or
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Plus, Users, Mail, Check, X, ChevronRight, Dna, Send,
  FolderOpen, Crown, UserPlus, Clock, Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── helpers ── */
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

/* ── Modal crear proyecto ── */
function CreateProjectModal({ onClose, onCreated, user }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const ref = await addDoc(collection(db, "projects"), {
        name: name.trim(),
        description: desc.trim(),
        ownerId: user.uid,
        members: [{ uid: user.uid, email: user.email, displayName: user.displayName || user.email, role: "owner" }],
        memberIds: [user.uid],
        createdAt: serverTimestamp(),
      });
      onCreated(ref.id);
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Nuevo proyecto colaborativo</h2>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {err && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800">{err}</p>}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Nombre del proyecto</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Estudio sobre ubiquitina"
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Descripción <span className="text-slate-400">(opcional)</span></label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Objetivo del proyecto, proteínas de interés..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || busy}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white transition-colors"
            >
              {busy ? "Creando…" : "Crear proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal invitar miembro ── */
export function InviteModal({ project, user, onClose }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) return;
    if (target === user.email.toLowerCase()) { setErr("No puedes invitarte a ti mismo."); return; }
    const already = project.members.some((m) => m.email.toLowerCase() === target);
    if (already) { setErr("Ese usuario ya es miembro del proyecto."); return; }

    setBusy(true);
    setErr(null);
    try {
      // Check for existing pending invitation
      const q = query(
        collection(db, "invitations"),
        where("projectId", "==", project.id),
        where("toEmail", "==", target),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      if (!snap.empty) { setErr("Ya hay una invitación pendiente para ese email."); setBusy(false); return; }

      await addDoc(collection(db, "invitations"), {
        projectId: project.id,
        projectName: project.name,
        fromUid: user.uid,
        fromEmail: user.email,
        fromDisplayName: user.displayName || user.email,
        toEmail: target,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setDone(true);
      setEmail("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Invitar miembro</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{project.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleInvite} className="p-5 space-y-3">
          {err && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800">{err}</p>}
          {done && <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-md border border-emerald-200 dark:border-emerald-800">Invitación enviada a <strong>{email || "ese usuario"}</strong>.</p>}

          <div className="relative">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setDone(false); setErr(null); }}
              placeholder="correo@ejemplo.com"
              className="w-full pl-3 pr-10 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!email.trim() || busy}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Members list */}
          <div className="pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Miembros actuales</p>
            <ul className="space-y-1.5">
              {project.members.map((m) => (
                <li key={m.uid} className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400">
                      {(m.displayName || m.email)[0].toUpperCase()}
                    </div>
                    {m.role === "owner" && (
                      <Crown className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 drop-shadow-sm" />
                    )}
                  </div>
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{m.displayName || m.email}</span>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function Projects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("projects");
  const [showCreate, setShowCreate] = useState(false);
  const [inviteFor, setInviteFor] = useState(null); // project object

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  /* Auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (!u) setLoading(false);
    });
    return () => unsub();
  }, []);

  /* Projects where user is a member */
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "projects"),
      or(
        where("memberIds", "array-contains", user.uid),
        where("ownerId", "==", user.uid),
        where("userId", "==", user.uid)
      )
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data(), _ts: d.data().createdAt?.toMillis() || 0 }))
        .sort((a, b) => b._ts - a._ts);
      setProjects(all);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  /* Pending invitations for this user's email */
  useEffect(() => {
    if (!user?.email) return;
    const q = query(
      collection(db, "invitations"),
      where("toEmail", "==", user.email.toLowerCase()),
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data(), _ts: d.data().createdAt?.toMillis() || 0 }))
        .sort((a, b) => b._ts - a._ts);
      setInvitations(all);
    });
    return () => unsub();
  }, [user]);

  const pendingCount = invitations.filter((i) => i.status === "pending").length;

  /* Accept invitation */
  const handleAccept = async (inv) => {
    try {
      // Add user to project members (both rich objects for UI and flat uid for queries)
      await updateDoc(doc(db, "projects", inv.projectId), {
        members: arrayUnion({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          role: "member",
        }),
        memberIds: arrayUnion(user.uid),
      });
      await updateDoc(doc(db, "invitations", inv.id), { status: "accepted" });
    } catch (e) {
      console.error(e);
    }
  };

  /* Decline invitation */
  const handleDecline = async (inv) => {
    try {
      await updateDoc(doc(db, "invitations", inv.id), { status: "declined" });
    } catch (e) {
      console.error(e);
    }
  };

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const timer = setInterval(updateNow, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  /* Filter projects */
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(p => {
        const userMember = p.members?.find(m => m.uid === user?.uid);
        if (roleFilter === "owner") {
          return p.ownerId === user?.uid;
        } else if (roleFilter === "member") {
          return userMember && userMember.role !== "owner";
        }
        return true;
      });
    }

    // Date filter
    if (dateFilter !== "all") {
      const timeframes = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
      };
      const timeframe = timeframes[dateFilter];
      filtered = filtered.filter(p => {
        const createdTime = p.createdAt?.toDate?.()?.getTime() || p._ts;
        return (now - createdTime) <= timeframe;
      });
    }

    return filtered;
  }, [projects, searchTerm, roleFilter, dateFilter, user, now]);

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 w-full">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Proyectos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo proyecto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-800 mb-4 w-fit">
        {[
          { key: "projects", label: "Mis proyectos", count: tab === "projects" ? filteredProjects.length : projects.length },
          { key: "inbox", label: "Buzón", count: pendingCount },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-r last:border-r-0 border-slate-300 dark:border-slate-600 ${tab === t.key
                ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${t.key === "inbox" && t.count > 0
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  : tab === t.key
                    ? "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Mis proyectos ── */}
      {tab === "projects" && (
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
          {/* Column header */}
          {!loading && filteredProjects.length > 0 && (
            <div className="hidden sm:grid grid-cols-[1fr_120px_120px_80px] items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Proyecto</span>
              <span>Miembros</span>
              <span>Creado</span>
              <span />
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Clock className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
              <FolderOpen className="w-9 h-9 text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Sin proyectos todavía</p>
                <p className="text-xs text-slate-400 mt-1">Crea uno o espera a ser invitado por un colega.</p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Crear primer proyecto
              </button>
            </div>
          )}

          {!loading && projects.length > 0 && filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
              <Search className="w-9 h-9 text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No se encontraron proyectos</p>
                <p className="text-xs text-slate-400 mt-1">Prueba ajustando los filtros de búsqueda.</p>
              </div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                  setDateFilter("all");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-600 hover:bg-slate-700 text-white transition-colors mt-1"
              >
                <X className="w-3.5 h-3.5" /> Limpiar filtros
              </button>
            </div>
          )}

          {!loading && filteredProjects.length > 0 && (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredProjects.map((p) => {
                const isOwner = p.ownerId === user?.uid;
                return (
                  <li
                    key={p.id}
                    className="group sm:grid sm:grid-cols-[1fr_120px_120px_80px] items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <button
                          onClick={() => navigate(`/app/projects/${p.id}`)}
                          className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left transition-colors"
                        >
                          {p.name}
                        </button>
                        {p.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.description}</p>
                        )}
                      </div>
                      {isOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Propietario" />}
                    </div>

                    <div className="hidden sm:flex items-center gap-1 mt-1 sm:mt-0">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{p.members?.length ?? 1}</span>
                    </div>

                    <span className="hidden sm:block text-xs text-slate-400 truncate">
                      {formatRelative(p.createdAt?.toDate?.())}
                    </span>

                    <div className="hidden sm:flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isOwner && (
                        <button
                          onClick={() => setInviteFor(p)}
                          title="Invitar miembro"
                          className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/app/projects/${p.id}`)}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Abrir
                        <ChevronRight className="w-3 h-3 inline ml-0.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Buzón de entrada ── */}
      {tab === "inbox" && (
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
          {invitations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
              <Mail className="w-9 h-9 text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Buzón vacío</p>
                <p className="text-xs text-slate-400 mt-1">Las invitaciones a proyectos aparecerán aquí.</p>
              </div>
            </div>
          )}

          {invitations.length > 0 && (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_140px_100px_120px] items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Invitación</span>
                <span>De</span>
                <span>Estado</span>
                <span />
              </div>
              <ul className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {invitations.map((inv) => {
                  const isPending = inv.status === "pending";
                  const isAccepted = inv.status === "accepted";
                  return (
                    <li key={inv.id} className="sm:grid sm:grid-cols-[1fr_140px_100px_120px] items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Dna className="w-4 h-4 text-primary-400 shrink-0" />
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{inv.projectName}</p>
                      </div>

                      <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
                        {inv.fromDisplayName || inv.fromEmail}
                      </span>

                      <div className="hidden sm:block">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${isPending ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                            : isAccepted ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                          }`}>
                          {isPending ? "Pendiente" : isAccepted ? "Aceptada" : "Rechazada"}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 mt-2 sm:mt-0">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleAccept(inv)}
                              title="Aceptar"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            >
                              <Check className="w-3 h-3" /> Aceptar
                            </button>
                            <button
                              onClick={() => handleDecline(inv)}
                              title="Rechazar"
                              className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && user && (
        <CreateProjectModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => { }}
        />
      )}
      {inviteFor && user && (
        <InviteModal
          project={inviteFor}
          user={user}
          onClose={() => setInviteFor(null)}
        />
      )}
    </div>
  );
}
