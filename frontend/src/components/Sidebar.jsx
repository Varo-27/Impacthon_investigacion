import { useState, useEffect } from "react";
import logoUrl from "../assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Dna, LayoutDashboard, Sun, Moon, FolderOpen, Mail, ChevronLeft, ChevronRight, BrainCircuit, HelpCircle, Settings, Beaker } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useTutorial } from "../contexts/TutorialContext";
import { DASHBOARD_STEPS, SUBMIT_STEPS, VIEWER_STEPS, CHAT_STEPS } from "../lib/tutorials";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { startTour } = useTutorial();
  const [pendingInvites, setPendingInvites] = useState(0);
  const [user, setUser] = useState(null);

  /* Auth + pending invitations */
  useEffect(() => {
    let unsubInvites = () => { };
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      unsubInvites();
      if (!u?.email) { setPendingInvites(0); return; }
      const q = query(
        collection(db, "invitations"),
        where("toEmail", "==", u.email.toLowerCase()),
        where("status", "==", "pending")
      );
      unsubInvites = onSnapshot(q, (snap) => setPendingInvites(snap.size));
    });
    return () => { unsubAuth(); unsubInvites(); };
  }, []);



  const links = [
    { name: "Visor 3D", path: "/app", icon: <Activity className="w-5 h-5" />, id: "viewer-link" },
    { name: "Nuevo Trabajo", path: "/app/submit", icon: <Dna className="w-5 h-5" />, id: "btn-new-job" },
    { name: "Mis Trabajos", path: "/app/jobs", icon: <LayoutDashboard className="w-5 h-5" />, id: "jobs-link" },
    { name: "Proyectos", path: "/app/projects", icon: <FolderOpen className="w-5 h-5" />, badge: pendingInvites, id: "projects-list" },
    { name: "ProteIA", path: "/app/assistant", icon: <BrainCircuit className="w-5 h-5" />, id: "assistant-link" },
    { name: "Labs", path: "/app/labs", icon: <Beaker className="w-5 h-5" />, id: "labs-link" },
  ];

  const initials = user?.displayName
    ? user.displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  // Lanzar el tour adecuado según la página actual
  const handleStartTutorial = () => {
    if (location.pathname.includes("/submit")) return startTour(SUBMIT_STEPS);
    if (location.pathname.includes("/assistant")) return startTour(CHAT_STEPS);
    if (location.pathname.includes("/app?job=") || location.search.includes("job=")) return startTour(VIEWER_STEPS);
    startTour(DASHBOARD_STEPS);
  };

  return (
    <aside
      id="sidebar-nav"
      className={`relative h-full flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 shrink-0 ${isOpen ? "w-56" : "w-14"
        }`}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-slate-200 dark:border-slate-700">
        {isOpen && (
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-base text-primary-600 dark:text-primary-400 whitespace-nowrap tracking-tight hover:text-primary-500 dark:hover:text-primary-300 transition-all duration-200 ease-in-out active:scale-[0.98]"
            title="Ir a la página de inicio"
          >
            <img src={logoUrl} className="w-6 h-6 object-contain" alt="Micafold" />
            Micafold
          </Link>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors ${!isOpen ? "mx-auto" : ""}`}
          title={isOpen ? "Colapsar" : "Expandir"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-2 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              id={link.id}
              to={link.path}
              title={!isOpen ? link.name : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${isActive
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 pointer-events-none"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
            >
              <div className={`relative shrink-0 ${isActive ? "text-primary-600 dark:text-primary-400" : ""}`}>
                {link.icon}
                {!isOpen && link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary-600 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </div>

              {isOpen && (
                <>
                  <span className="text-sm font-medium whitespace-nowrap flex-1">{link.name}</span>
                  {link.badge > 0 && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                      <Mail className="w-2.5 h-2.5" />
                      {link.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-2 border-t border-slate-200 dark:border-slate-700 space-y-1">

        {/* Tutorial wizard toggle */}
        <button
          onClick={handleStartTutorial}
          title={isOpen ? undefined : "Tutorial de esta pantalla"}
          className={`w-full flex items-center justify-start gap-2.5 px-2.5 py-2 rounded-md text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors mb-1 ${!isOpen ? "justify-center" : ""}`}
        >
          <HelpCircle className="w-[18px] h-[18px] shrink-0" />
          {isOpen && <span className="text-sm font-medium">Tutorial guiado</span>}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isOpen ? undefined : `Modo ${theme === "light" ? "oscuro" : "claro"}`}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors ${!isOpen ? "justify-center" : ""}`}
        >
          {theme === "light" ? <Moon className="w-4.5 h-4.5 w-[18px] h-[18px] shrink-0" /> : <Sun className="w-[18px] h-[18px] shrink-0" />}
          {isOpen && <span className="text-sm font-medium">Modo {theme === "light" ? "oscuro" : "claro"}</span>}
        </button>

        {/* User row */}
        {user && (
          <div className={`flex items-center gap-2 px-2.5 py-2 rounded-md ${!isOpen ? "justify-center" : ""}`}>
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800">
              {initials}
            </div>

            {isOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate leading-tight">
                  {user.displayName || user.email}
                </p>
                {user.displayName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight">{user.email}</p>
                )}
              </div>
            )}

            {/* Ajustes */}
            <Link
              to="/app/settings"
              title="Ajustes"
              className={`p-1 rounded shrink-0 transition-all duration-200 ease-in-out active:scale-[0.98] ${location.pathname === "/app/settings"
                  ? "text-primary-500 dark:text-primary-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>


          </div>
        )}

        {/* Ajustes cuando colapsado */}
        {user && !isOpen && (
          <Link
            to="/app/settings"
            title="Ajustes"
            className={`w-full flex items-center justify-center py-1.5 rounded-md transition-all duration-200 ease-in-out active:scale-[0.98] ${location.pathname === "/app/settings"
                ? "text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              }`}
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        )}
      </div>
    </aside>
  );
}
