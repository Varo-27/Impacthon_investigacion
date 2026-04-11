import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Share2, Layers, Zap, Info, Play, Camera, CheckCircle2, X, Maximize2 } from "lucide-react";
import "pdbe-molstar/build/pdbe-molstar-light.css";
import PAEHeatmap from "../components/PAEHeatmap";

export default function Viewer() {
  const viewerContainerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job");
  const [jobData, setJobData] = useState(null);
  const [activeTab, setActiveTab] = useState("view");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize PDBe Molstar Plugin

  useEffect(() => {
    let viewerInstance;
    let isCancelled = false;
    
    const fetchAndInitViewer = async () => {
      let customUrl = null;
      let data = {
        name: "Proteína de Demo",
        plddt: 92.4,
        pdbFileUrl: null
      };

      if (jobId) {
        try {
          const resp = await fetch(`https://api-mock-cesga.onrender.com/jobs/${jobId}/outputs`);
          if (resp.ok) {
            const out = await resp.json();
            data = {
              name: out.protein_metadata?.protein_name || jobId,
              plddt: out.protein_metadata?.plddt_average || 85.0,
              pdbFileUrl: out.structural_data?.pdb_file || null,
              biological: out.biological_data || null,
              uniprot: out.protein_metadata?.uniprot_id || null,
              organism: out.protein_metadata?.organism || null,
              paeMatrix: out.structural_data?.confidence?.pae_matrix || null
            };
            if (data.pdbFileUrl) {
              // The API returns the raw text content of the PDB, not a URL.
              // We convert it to a Blob and get an Object URL so Molstar can 'fetch' it.
              const blob = new Blob([data.pdbFileUrl], { type: 'text/plain' });
              customUrl = URL.createObjectURL(blob);
            }
          }
        } catch (e) {
          console.error("Error fetching job outputs", e);
        }
      }
      
      if (isCancelled) return;
      setJobData(data);

      if (typeof window !== "undefined" && viewerContainerRef.current) {
        try {
          await import("pdbe-molstar/build/pdbe-molstar-plugin");
          
          if (!window.PDBeMolstarPlugin) {
            throw new Error("PDBeMolstarPlugin not found on window object");
          }
          if (isCancelled) return;
          
          viewerInstance = new window.PDBeMolstarPlugin();
          viewerInstanceRef.current = viewerInstance;
          
          const options = {
            hideControls: true, 
            bgColor: { r: 255, g: 255, b: 255 }, 
            hideCanvasControls: ["expand", "selection", "animation", "controlToggle", "controlInfo"],
            visualStyle: "cartoon",
            // Keep AF specific parsing for the Blue->Red B-factor scale
            alphafoldView: true, 
          };

          if (customUrl) {
            options.customData = { url: customUrl, format: 'pdb' };
          } else {
            options.moleculeId = "1cbs"; // Example default molecule
          }

          viewerInstance.render(viewerContainerRef.current, options);
          
          setIsLoaded(true);
        } catch (err) {
          console.error("Failed to load Mol* viewer:", err);
        }
      }
    };

    fetchAndInitViewer();

    return () => {
      isCancelled = true;
      if (viewerInstance && viewerInstance.plugin) {
        try {
          viewerInstance.plugin.clear();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [jobId]);

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-slate-50 dark:bg-slate-900 viewer-container">
      {/* CSS Override to forcefully hide Molstar's AlphaFold Bloatware UI */}
      <style>{`
        /* Forcefully hide layout regions injected by alphafoldView */
        .viewer-container .msp-layout-region-left,
        .viewer-container .msp-layout-region-right,
        .viewer-container .msp-layout-region-bottom {
          display: none !important;
        }
        
        /* Hide the annoying corner toggle buttons that the AF mode forces */
        .viewer-container .msp-layout-toggle {
          display: none !important;
        }
        
        /* Keep viewport taking full space */
        .viewer-container .msp-layout-standard {
          grid-template-columns: 0fr 1fr 0fr !important;
          grid-template-rows: 0fr 1fr 0fr !important;
        }
      `}</style>
      
      {/* 3D Main Viewer Area */}
      <div className="flex-1 relative h-full flex flex-col">
        {/* Top Floating Header overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-xl shadow border border-slate-200/50 dark:border-slate-700/50 pointer-events-auto">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[200px]">{jobData?.name || "Cargando..."}</h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Alta Confianza (pLDDT: {jobData ? jobData.plddt.toFixed(1) : "..."})
              </span>
            </div>
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
        <div className="flex w-full border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button 
            className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'view' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-slate-50/50 dark:bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            onClick={() => setActiveTab('view')}
          >
            Vista 3D
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'details' ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-slate-50/50 dark:bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            onClick={() => setActiveTab('details')}
          >
            Info y Biología
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6 flex-1">
          {activeTab === 'view' && (
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                Leyenda de Colores (pLDDT)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                La estructura se colorea según la confianza de la predicción de AlphaFold para cada residuo.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{background: "#0053D6"}}></span>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Muy alta (&gt; 90)</span>
                    <p className="text-xs text-slate-400">Estructura casi segura</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{background: "#65CBF3"}}></span>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alta (70–90)</span>
                    <p className="text-xs text-slate-400">Generalmente correcta</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{background: "#FFDB13"}}></span>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Baja (50–70)</span>
                    <p className="text-xs text-slate-400">Tomar con cautela</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{background: "#FF7D45"}}></span>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Muy baja (&lt; 50)</span>
                    <p className="text-xs text-slate-400">Región probablemente desordenada</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs flex justify-between items-center">
                  Métricas Estructurales
                  <Zap className="w-4 h-4 text-amber-500" />
                </label>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">pLDDT Promedio</span>
                    <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{jobData ? jobData.plddt.toFixed(1) : "0.0"}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${jobData ? jobData.plddt : 0}%` }}></div>
                  </div>
                  <div className="pt-3 flex justify-between items-center border-t border-slate-200/50 dark:border-slate-700/50 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Mapizado de Error</span>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 object-scale-down rounded shadow-sm border border-slate-200 dark:border-slate-700"
                    >
                      <Maximize2 className="w-3 h-3" /> Ver Matriz PAE
                    </button>
                  </div>
                  
                  {jobData?.paeMatrix && (
                    <div className="w-full flex justify-center py-2 relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
                      <PAEHeatmap matrix={jobData.paeMatrix} className="w-[180px] h-[180px]" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/40 transition-all rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                         <Maximize2 className="text-white w-6 h-6 drop-shadow-md" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {jobData?.biological && (
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                    Datos Biológicos
                  </label>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="text-slate-500">Solubilidad:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {jobData.biological.solubility_score?.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2">
                      <span className="text-slate-500">Inestabilidad:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {jobData.biological.instability_index?.toFixed(1)}
                      </span>
                    </div>
                    {jobData.organism && (
                       <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 py-2">
                        <span className="text-slate-500">Organismo:</span>
                        <span className="font-medium italic text-slate-800 dark:text-slate-200">{jobData.organism}</span>
                      </div>
                    )}
                    {jobData.uniprot && (
                       <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500">UniProt:</span>
                        <span className="font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                          {jobData.uniprot}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button className="w-full py-2.5 flex items-center justify-center gap-2 bg-primary-600 text-white font-medium text-sm rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Descargar Archivos
          </button>
        </div>
      </div>

      {/* PAE Heatmap Modal Overlay */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-slate-700/50">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Matriz de Error PAE (Predicted Aligned Error)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Posiciones relativas y matriz interactiva generada simulando base termodinámica de modelo computacional.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center overflow-auto">
              <div className="w-full flex gap-6 mt-2 items-start justify-center">
                {/* PAE Map Visual */}
                <div className="shadow-lg border-2 border-white dark:border-slate-700 rounded bg-white p-2">
                  <PAEHeatmap matrix={jobData?.paeMatrix} className="w-[500px] h-[500px] max-w-full max-h-[60vh] object-contain" />
                </div>
                
                {/* Legend Panel */}
                <div className="w-48 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm">
                   <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">Leyenda</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                     El color indica la precisión en la distancia posicional entre el residuo Y frente al X.
                   </p>
                   <div className="space-y-2 text-xs">
                     <div className="flex items-center gap-2">
                       <span className="w-4 h-4 block rounded bg-[#0053D6]"></span> Error Mínimo (&lt;5Å)
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="w-4 h-4 block rounded bg-[#65CBF3]"></span> Confianza Media
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="w-4 h-4 block rounded bg-[#FFDB13]"></span> Confianza Baja
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="w-4 h-4 block rounded bg-[#FF7D45]"></span> Error Alto (&gt;30Å)
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
