import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Activity, Dna, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const links = [
    { name: "Visor 3D", path: "/app", icon: <Activity className="w-5 h-5" /> },
    { name: "Nuevo Trabajo", path: "/app/submit", icon: <Dna className="w-5 h-5" /> },
    { name: "Mis Trabajos", path: "/app/jobs", icon: <LayoutDashboard className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`relative h-full flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700 w-full overflow-hidden">
        {isOpen && (
          <span className="font-bold text-lg text-primary-600 dark:text-primary-400 whitespace-nowrap">
            LocalFold
          </span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          title={isOpen ? "Colapsar" : "Expandir"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden p-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer group ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 pointer-events-none"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              }`}
            >
              <div
                className={`${isActive ? "text-primary-600 dark:text-primary-400" : ""}`}
                title={!isOpen ? link.name : ""}
              >
                {link.icon}
              </div>
              {isOpen && (
                <span className="font-medium text-sm whitespace-nowrap">
                  {link.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          title="Cambiar tema"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {isOpen && <span className="text-sm font-medium">Modo {theme === 'light' ? 'Oscuro' : 'Claro'}</span>}
        </button>
      </div>
    </aside>
  );
}
