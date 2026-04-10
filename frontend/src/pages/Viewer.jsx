import { useState, useRef, useEffect } from "react";
import { Download, Share2, Layers, Zap, Info, Play, Camera, CheckCircle2 } from "lucide-react";
import "pdbe-molstar/build/pdbe-molstar-light.css";

export default function Viewer() {
  const viewerContainerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize PDBe Molstar Plugin
  useEffect(() => {
    let viewerInstance;
    
    const initViewer = async () => {
      if (typeof window !== "undefined" && viewerContainerRef.current) {
        try {
          // Import dynamic to avoid SSR issues if they exist
          const { PDBeMolstarPlugin } = await import("pdbe-molstar/build/pdbe-molstar-plugin");
          
          viewerInstance = new PDBeMolstarPlugin();
          viewerInstanceRef.current = viewerInstance;
          
          const options = {
            moleculeId: "1cbs", // Example default molecule
            hideControls: true, // We will build our custom simplified controls (Refactoring UI for target audience)
            bgColor: { r: 255, g: 255, b: 255 }, // Will adjust via CSS if dark mode
            hideCanvasControls: ["expand", "selection", "animation"],
            visualStyle: "cartoon",
          };

          viewerInstance.render(viewerContainerRef.current, options);
          setIsLoaded(true);
        } catch (err) {
          console.error("Failed to load Mol* viewer:", err);
        }
      }
    };

    initViewer();

    return () => {
      // Cleanup if possible
      if (viewerInstance && viewerInstance.plugin) {
        try {
          viewerInstance.plugin.clear();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  const handleScreenshot = () => {
    if (viewerInstanceRef.current) {
      // Logic for screenshot using Mol* API, for now basic mockup action
      alert("Tomando captura de la estructura actual...");
    }
  };

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-slate-50 dark:bg-slate-900">
      
      {/* 3D Main Viewer Area */}
      <div className="flex-1 relative h-full flex flex-col">
        {/* Top Floating Header overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-xl shadow border border-slate-200/50 dark:border-slate-700/50 pointer-events-auto">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Ubiquitina (J-001)</h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Alta Confianza (pLDDT: 92.4)
              </span>
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <button onClick={handleScreenshot} className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all focus:ring-2 focus:ring-primary-500 outline-none">
              <Camera className="w-4 h-4" />
            </button>
            <button className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The actual Mol* Canvas Container */}
        <div 
          className={`w-full h-full ${!isLoaded ? "animate-pulse bg-slate-200 dark:bg-slate-800" : ""}`} 
          ref={viewerContainerRef}
        ></div>
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center text-slate-400">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-primary-500 rounded-full animate-spin mb-4" />
              <p className="font-medium">Cargando motor Mol*...</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Settings / Details */}
      <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-full flex flex-col shadow-xl z-20 transition-transform overflow-y-auto">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" /> Opciones de Visualización
          </h3>
          <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Manipula cómo ves el pliegue 3D</p>
        </div>

        <div className="p-5 flex flex-col gap-6 flex-1">
          {/* Opciones Simplificadas de Representación */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
              Representación
            </label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 cursor-pointer">
              <option value="cartoon">Cintas (Cartoon) - Recomendado</option>
              <option value="surface">Superficie molecular</option>
              <option value="ball-and-stick">Bolas y varillas</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs flex justify-between">
              Coloreado <Info className="w-4 h-4 text-slate-400" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 px-3 border-2 border-primary-500 bg-primary-50 text-primary-700 font-medium text-sm rounded-lg dark:bg-primary-900/30 dark:text-primary-300">
                pLDDT (Calidad)
              </button>
              <button className="py-2 px-3 border border-slate-200 bg-white text-slate-600 font-medium text-sm rounded-lg hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600">
                Cadenas
              </button>
            </div>
          </div>
          
          <hr className="border-slate-100 dark:border-slate-700 my-2" />

          {/* PAE y Métricas Simuladas */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs flex justify-between items-center">
              Métricas Estructurales
              <Zap className="w-4 h-4 text-amber-500" />
            </label>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">pLDDT Promedio</span>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">92.4</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '92.4%' }}></div>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Matriz PAE</span>
                <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">Ver Heatmap 2D</button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button className="w-full py-2.5 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary-600 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Descargar PDB
          </button>
        </div>
      </div>

    </div>
  );
}
