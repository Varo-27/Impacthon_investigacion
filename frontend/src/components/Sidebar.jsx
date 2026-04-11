import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Dna, LayoutDashboard, Sun, Moon, FolderOpen, Mail, LogOut, ChevronLeft, ChevronRight, BrainCircuit } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [pendingInvites, setPendingInvites] = useState(0);
  const [user, setUser] = useState(null);

  /* Auth + pending invitations */
  useEffect(() => {
    let unsubInvites = () => {};
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

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  const links = [
    { name: "Visor 3D",      path: "/app",               icon: <Activity className="w-5 h-5" /> },
    { name: "Nuevo Trabajo", path: "/app/submit",        icon: <Dna className="w-5 h-5" /> },
    { name: "Mis Trabajos",  path: "/app/jobs",          icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Proyectos",     path: "/app/projects",      icon: <FolderOpen className="w-5 h-5" />, badge: pendingInvites },
    { name: "Asistente IA",  path: "/app/assistant",     icon: <BrainCircuit className="w-5 h-5" /> },
  ];

  const initials = user?.displayName
    ? user.displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <aside
      className={`relative h-full flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 shrink-0 ${
        isOpen ? "w-56" : "w-14"
      }`}
    >
      {/* Logo + collapse toggle */}
      <div className={`flex items-center h-14 border-b border-slate-200 dark:border-slate-700 ${isOpen ? "px-4 justify-between" : "justify-center"}`}>
        {isOpen && (
          <span className="font-bold text-base text-primary-600 dark:text-primary-400 whitespace-nowrap tracking-tight">
            LocalFold
          </span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
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
              to={link.path}
              title={!isOpen ? link.name : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                isActive
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
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold">
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
          <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md ${isOpen ? "" : "justify-center"}`}>
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[11px] font-bold flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800">
              {initials}
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate leading-tight">
                  {user.displayName || user.email}
                </p>
                {user.displayName && (
                  <p className="text-[10px] text-slate-400 truncate leading-tight">{user.email}</p>
                )}
              </div>
            )}
            {isOpen && (
              <button
                onClick={handleSignOut}
                title="Cerrar sesión"
                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Sign out when collapsed */}
        {user && !isOpen && (
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="w-full flex items-center justify-center py-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </aside>
  );
}
