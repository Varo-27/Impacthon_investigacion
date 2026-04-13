import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, deleteUser, reauthenticateWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { FlaskConical, Stethoscope, Pill, GraduationCap, Check, Info, AlertTriangle, Trash2, Save, RefreshCw, LogOut } from "lucide-react";

const PROFILES = [
  { id: "researcher", icon: <FlaskConical className="w-5 h-5" />, label: "Investigador",  desc: "Biología molecular, bioquímica, genómica",  color: "border-primary-500 bg-primary-500/10", check: "bg-primary-500" },
  { id: "clinical",   icon: <Stethoscope className="w-5 h-5" />, label: "Clínico",        desc: "Aplicación médica, diagnóstico, terapia",  color: "border-emerald-500 bg-emerald-500/10", check: "bg-emerald-500" },
  { id: "drug",       icon: <Pill className="w-5 h-5" />,        label: "Drug Discovery", desc: "Targets, ADMET, candidatos farmacológicos", color: "border-amber-500 bg-amber-500/10",     check: "bg-amber-500" },
  { id: "student",    icon: <GraduationCap className="w-5 h-5" />, label: "Estudiante",   desc: "Aprendiendo y explorando",                  color: "border-violet-500 bg-violet-500/10",   check: "bg-violet-500" },
];

const GOALS = [
  { id: "understand", label: "Entender qué está pasando biológicamente" },
  { id: "binding",    label: "Encontrar sitios de unión o dianas terapéuticas" },
  { id: "validate",   label: "Validar mis resultados experimentales" },
];

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Profile state
  const [type,         setType]         = useState(null);
  const [goal,         setGoal]         = useState(null);
  const [personalNote, setPersonalNote] = useState("");
  const [showInfo,     setShowInfo]     = useState(false);
  const [saved,        setSaved]        = useState(false);

  // Delete account state
  const [deletePhase,  setDeletePhase]  = useState("idle"); // idle | confirm | deleting | error
  const [deleteError,  setDeleteError]  = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return unsub;
  }, []);

  // Load saved profile on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("omicafold_profile");
      if (raw) {
        const { type: t, goal: g, personalNote: n } = JSON.parse(raw);
        if (t) setType(t);
        if (g) setGoal(g);
        if (n) setPersonalNote(n);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSaveProfile = () => {
    const profile = { type, goal, personalNote: personalNote.trim() };
    localStorage.setItem("omicafold_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletePhase("deleting");
    setDeleteError("");
    try {
      // Borrar jobs del usuario en Firestore
      const jobsQ = query(collection(db, "jobs"), where("userId", "==", user.uid));
      const snap = await getDocs(jobsQ);
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "jobs", d.id))));

      // Eliminar cuenta Firebase Auth
      await deleteUser(user);
      localStorage.clear();
      navigate("/");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        // Re-autenticar y reintentar
        try {
          await reauthenticateWithPopup(user, new GoogleAuthProvider());
          await deleteUser(user);
          localStorage.clear();
          navigate("/");
        } catch (reAuthErr) {
          setDeleteError("No se pudo verificar tu identidad. Intenta cerrar sesión y volver a entrar.");
          setDeletePhase("error");
        }
      } else {
        setDeleteError(err.message || "Error desconocido.");
        setDeletePhase("error");
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 w-full space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Ajustes</h1>

      {/* ── PERFIL DE USO ── */}
      <Section title="Perfil de uso">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Micafold adapta sus respuestas según estos datos. Cámbialo cuando cambien tus necesidades.
        </p>

        {/* Tipo de usuario */}
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">¿Cuál es tu perfil?</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {PROFILES.map((p) => {
            const active = type === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setType(p.id)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 ${
                  active ? `${p.color} border-opacity-100` : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {active && (
                  <span className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${p.check}`}>
                    <Check className="w-2 h-2 text-white" />
                  </span>
                )}
                <span className={active ? "text-current" : "text-slate-400 dark:text-slate-500"}>{p.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{p.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug hidden sm:block">{p.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Objetivo */}
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">¿Qué buscas principalmente?</p>
        <div className="flex flex-col gap-1.5 mb-5">
          {GOALS.map((g) => {
            const active = goal === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 ${
                  active ? "border-primary-500 bg-primary-500/10" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-primary-500 bg-primary-500" : "border-slate-400 dark:border-slate-600"}`}>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-sm ${active ? "text-slate-900 dark:text-white font-medium" : "text-slate-600 dark:text-slate-300"}`}>{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* Nota personal */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Contexto personalizado</p>
            <div className="relative">
              <button onMouseEnter={() => setShowInfo(true)} onMouseLeave={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Info className="w-3.5 h-3.5" />
              </button>
              {showInfo && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-60 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 leading-relaxed shadow-xl z-10">
                  Micafold tendrá en cuenta este texto en cada análisis para adaptar las respuestas a tu contexto específico de investigación.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 -mt-1" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 ml-auto">{personalNote.length}/300</span>
          </div>
          <textarea
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value.slice(0, 300))}
            placeholder="Ej: Estudio proteínas relacionadas con ELA en modelos murinos..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 resize-none transition-colors"
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={!type || !goal}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-200 active:scale-[0.98]"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </Section>

      {/* ── CUENTA ── */}
      <Section title="Cuenta">
        {user && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-bold flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800">
                {user.displayName?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user.displayName || "—"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        )}

        {/* Zona de peligro */}
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/50">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Zona de peligro</p>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Eliminar cuenta</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Se eliminarán permanentemente tu cuenta y todos tus jobs. Esta acción no se puede deshacer.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-200 dark:border-red-800">
                {deleteError}
              </p>
            )}

            {deletePhase === "idle" && (
              <button
                onClick={() => setDeletePhase("confirm")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar mi cuenta
              </button>
            )}

            {deletePhase === "confirm" && (
              <div className="flex items-center gap-2">
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex-1">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">¿Seguro? Se borrarán tu cuenta y todos tus datos.</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={handleDeleteAccount}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setDeletePhase("idle")}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {deletePhase === "deleting" && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Eliminando cuenta…
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
