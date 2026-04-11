import { useState, useMemo, useEffect } from "react";
import { X, Search, FolderOpen, Tag, Ruler } from "lucide-react";
import MultiSelectDropdown from "./MultiSelectDropdown";

/* Estilos para ocultar scrollbar */
const scrollBarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

const FUNCTIONAL_CATEGORIES = [
  "enzyme",
  "transport",
  "signaling",
  "immune",
  "hormone",
  "reporter",
  "structural",
  "oncology",
  "dna-replication",
];

export default function JobsFilterPanel({ 
  jobs,
  projects, 
  onFiltersChange,
  initialFilters = {}
}) {
  /* Inject CSS for hiding scrollbar */
  useEffect(() => {
    if (!document.getElementById("scrollbar-hide-styles")) {
      const style = document.createElement("style");
      style.id = "scrollbar-hide-styles";
      style.textContent = scrollBarHideStyle;
      document.head.appendChild(style);
    }
  }, []);
  
  /* Filter state */
  const [selectedProjects, setSelectedProjects] = useState(() => {
    const projects = initialFilters.projects || [];
    const includeNoProject = initialFilters.includeNoProject || false;
    return includeNoProject ? ["__no_project__", ...projects] : projects;
  });
  const [selectedCategories, setSelectedCategories] = useState(initialFilters.categories || []);
  const [maxLength, setMaxLength] = useState(initialFilters.maxLength || "");
  const [textSearch, setTextSearch] = useState(initialFilters.textSearch || "");
  
  /* Get all unique values */
  const availableProjects = useMemo(() => projects || [], [projects]);
  
  /* Notify parent of changes - called immediately when filter changes */
  const updateFilters = (newProjects, newCategories, newIncludeNoProject, newMaxLength, newTextSearch) => {
    onFiltersChange({
      projects: newProjects,
      categories: newCategories,
      includeNoProject: newIncludeNoProject,
      maxLength: newMaxLength ? parseInt(newMaxLength) : null,
      textSearch: newTextSearch,
    });
  };

  const resetFilters = () => {
    setSelectedProjects([]);
    setSelectedCategories([]);
    setMaxLength("");
    setTextSearch("");
    updateFilters([], [], false, "", "");
  };

  const hasActiveFilters = selectedProjects.length > 0 || selectedCategories.length > 0 || maxLength || textSearch;

  const projectOptions = useMemo(() => {
    // Array de IDs (no nombres, porque necesitamos IDs para el filtro)
    return [
      "__no_project__",
      ...availableProjects.map(p => p.id)
    ];
  }, [availableProjects]);

  const formatProjectLabel = (value) => {
    if (value === "__no_project__") return "Sin proyecto";
    const project = availableProjects.find(p => p.id === value);
    return project?.name || value;
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Fila 1: Filtros principales (3 columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Proyecto Multi-select */}
        <MultiSelectDropdown
          label="Proyecto"
          options={projectOptions}
          selectedValues={selectedProjects}
          onChange={(newProjects) => {
            setSelectedProjects(newProjects);
            // Separar "__no_project__" de los proyectos reales
            const hasNoProject = newProjects.includes("__no_project__");
            const regularProjects = newProjects.filter(p => p !== "__no_project__");
            updateFilters(regularProjects, selectedCategories, hasNoProject, maxLength, textSearch);
          }}
          placeholder="Seleccionar proyectos..."
          formatDisplay={formatProjectLabel}
        />

        {/* Categoría Multi-select */}
        <MultiSelectDropdown
          label="Categoría"
          options={FUNCTIONAL_CATEGORIES}
          selectedValues={selectedCategories}
          onChange={(newCategories) => {
            setSelectedCategories(newCategories);
            const hasNoProject = selectedProjects.includes("__no_project__");
            const regularProjects = selectedProjects.filter(p => p !== "__no_project__");
            updateFilters(regularProjects, newCategories, hasNoProject, maxLength, textSearch);
          }}
          placeholder="Seleccionar categorías..."
        />

        {/* Longitud Máxima */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Longitud Máxima (aa)
          </label>
          <input
            type="number"
            placeholder="Ej: 500"
            value={maxLength}
            onChange={(e) => {
              setMaxLength(e.target.value);
              const hasNoProject = selectedProjects.includes("__no_project__");
              const regularProjects = selectedProjects.filter(p => p !== "__no_project__");
              updateFilters(regularProjects, selectedCategories, hasNoProject, e.target.value, textSearch);
            }}
            min="0"
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Fila 2: Búsqueda + Limpiar */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        {/* Búsqueda por nombre/organismo/tag */}
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Nombre / Organismo / Tag
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="human, calcium, fluorescent..."
              value={textSearch}
              onChange={(e) => {
                setTextSearch(e.target.value);
                const hasNoProject = selectedProjects.includes("__no_project__");
                const regularProjects = selectedProjects.filter(p => p !== "__no_project__");
                updateFilters(regularProjects, selectedCategories, hasNoProject, maxLength, e.target.value);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Botón Limpiar */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out active:scale-[0.98]"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/50">
          {selectedProjects.map((proj) => (
            <div
              key={proj}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium border border-primary-200 dark:border-primary-800"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{formatProjectLabel(proj)}</span>
              <button
                onClick={() => {
                  const updated = selectedProjects.filter(p => p !== proj);
                  setSelectedProjects(updated);
                  const hasNoProject = updated.includes("__no_project__");
                  const regularProjects = updated.filter(p => p !== "__no_project__");
                  updateFilters(regularProjects, selectedCategories, hasNoProject, maxLength, textSearch);
                }}
                className="hover:text-primary-900 dark:hover:text-primary-200 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {selectedCategories.map((cat) => (
            <div
              key={cat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium border border-green-200 dark:border-green-800"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{cat}</span>
              <button
                onClick={() => {
                  const updated = selectedCategories.filter(c => c !== cat);
                  setSelectedCategories(updated);
                  const hasNoProject = selectedProjects.includes("__no_project__");
                  const regularProjects = selectedProjects.filter(p => p !== "__no_project__");
                  updateFilters(regularProjects, updated, hasNoProject, maxLength, textSearch);
                }}
                className="hover:text-green-900 dark:hover:text-green-300 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {maxLength && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800">
              <Ruler className="w-3.5 h-3.5" />
              <span>≤ {maxLength} aa</span>
              <button
                onClick={() => {
                  setMaxLength("");
                  const hasNoProject = selectedProjects.includes("__no_project__");
                  const regularProjects = selectedProjects.filter(p => p !== "__no_project__");
                  updateFilters(regularProjects, selectedCategories, hasNoProject, "", textSearch);
                }}
                className="hover:text-amber-900 dark:hover:text-amber-300 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {textSearch && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-800">
              <Search className="w-3.5 h-3.5" />
              <span>"{textSearch}"</span>
              <button
                onClick={() => {
                  setTextSearch("");
                  const hasNoProject = selectedProjects.includes("__no_project__");
                  const regularProjects = selectedProjects.filter(p => p !== "__no_project__");
                  updateFilters(regularProjects, selectedCategories, hasNoProject, maxLength, "");
                }}
                className="hover:text-purple-900 dark:hover:text-purple-300 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
