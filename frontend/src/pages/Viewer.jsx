import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, X, Maximize2, FileText, Loader2, Dna, ArrowRight, FlaskConical, AlertTriangle, RefreshCw } from "lucide-react";
import { copilotApi } from "../api/copilotApi";
import "pdbe-molstar/build/pdbe-molstar-light.css";
import PAEHeatmap from "../components/PAEHeatmap";
import ProteinCopilot from "../components/ProteinCopilot";

export default function Viewer() {
  const viewerContainerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job");
  const [jobData, setJobData] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingLogs, setDownloadingLogs] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [waitingForAi, setWaitingForAi] = useState(false);
  const paeReportRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(300);
  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const isDragging = useRef(false);

  const handleResizeStart = (e) => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev) => {
      if (!isDragging.current) return;
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const vw = window.innerWidth;
      const newWidth = Math.min(520, Math.max(220, vw - clientX));
      setPanelWidth(newWidth);
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
  };

  const downloadFile = (content, filename, mimeType = "text/plain") => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdb = () => {
    if (!jobData?.pdbFileUrl) return;
    const safeName = (jobData.name || jobId || "protein").replace(/[^a-z0-9]/gi, "_");
    downloadFile(jobData.pdbFileUrl, `${safeName}.pdb`);
  };

  const handleDownloadJson = () => {
    if (!jobData) return;
    const safeName = (jobData.name || jobId || "protein").replace(/[^a-z0-9]/gi, "_");
    const metrics = {
      job_id: jobId,
      protein_name: jobData.name,
      uniprot_id: jobData.uniprot,
      organism: jobData.organism,
      plddt_mean: jobData.plddt,
      plddt_histogram: jobData.plddtHistogram,
      pae_matrix: jobData.paeMatrix,
      biological_data: jobData.biological,
      exported_at: new Date().toISOString(),
    };
    downloadFile(JSON.stringify(metrics, null, 2), `${safeName}_metrics.json`, "application/json");
  };

  // Pre-carga del resumen IA en cuanto llegan los datos del job (no esperar al clic)
  useEffect(() => {
    if (!jobId || !jobData || aiSummary) return;
    copilotApi.getInitialSummary(jobId, jobData.name, jobData).then(setAiSummary);
  }, [jobId, jobData]);

  const handleDownloadReport = async () => {
    // Esperar resumen IA si aún no ha llegado
    let summary = aiSummary;
    if (!summary) {
      setWaitingForAi(true);
      try {
        summary = await copilotApi.getInitialSummary(jobId, jobData.name, jobData);
        setAiSummary(summary);
      } finally {
        setWaitingForAi(false);
      }
    }

    // Capturar PAE como base64 antes de abrir la ventana
    let paeDataUrl = null;
    if (paeReportRef.current) {
      try { paeDataUrl = paeReportRef.current.toDataURL("image/png"); } catch (_) {}
    }

    // Intentar capturar la molécula (WebGL — puede salir en blanco si el driver no preserva el buffer)
    let molDataUrl = null;
    const molCanvas = viewerContainerRef.current?.querySelector("canvas");
    if (molCanvas) {
      try {
        const d = molCanvas.toDataURL("image/png");
        if (d && d.length > 200 && d !== "data:,") molDataUrl = d;
      } catch (_) {}
    }

    const plddt = jobData?.plddt ?? 0;
    const plddtConf = plddt >= 90 ? "MUY ALTA ✦" : plddt >= 70 ? "ALTA" : plddt >= 50 ? "BAJA" : "MUY BAJA";
    const plddtColor = plddt >= 90 ? "#059669" : plddt >= 70 ? "#0284c7" : plddt >= 50 ? "#d97706" : "#dc2626";
    const plddtDesc = plddt >= 90
      ? "La forma global es muy fiable. Adecuada para estudios de docking y diseño racional."
      : plddt >= 70
      ? "Predicción utilizable para análisis estructural. Las regiones con pLDDT &lt; 70 deben interpretarse con cautela."
      : "Confianza baja. Úsala únicamente como referencia orientativa.";

    const bio = jobData?.biological;
    const solScore = bio?.solubility_score;
    const instIdx = bio?.instability_index;
    const solLabel = solScore == null ? null
      : solScore >= 70 ? "Alta — apta para uso en laboratorio"
      : solScore >= 40 ? "Media — puede requerir optimización"
      : "Baja — dificultades esperadas en expresión";
    const stabLabel = instIdx == null ? null : instIdx < 40 ? "Estable (II &lt; 40)" : "Inestable (II ≥ 40)";

    const summaryRaw = summary || "El análisis IA no está disponible.";
    // Markdown básico → HTML
    const summaryHtml = summaryRaw
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^###\s+(.+)$/gm, "<h4>$1</h4>")
      .replace(/^##\s+(.+)$/gm, "<h3>$1</h3>")
      .replace(/^#\s+(.+)$/gm, "<h3>$1</h3>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    const metaParts = [
      jobData?.uniprot ? `<span>UniProt: <strong>${jobData.uniprot}</strong></span>` : null,
      jobData?.organism ? `<span><em>${jobData.organism}</em></span>` : null,
      jobId ? `<span>Job ID: <code>${jobId}</code></span>` : null,
      `<span>${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</span>`,
    ].filter(Boolean).join('<span class="sep">·</span>');

    const imagesHtml = (molDataUrl || paeDataUrl) ? `
      <div class="images-row">
        ${molDataUrl ? `<figure>
          <img src="${molDataUrl}" alt="Estructura 3D"/>
          <figcaption>Estructura 3D — coloreado por pLDDT</figcaption>
        </figure>` : ""}
        ${paeDataUrl ? `<figure>
          <img src="${paeDataUrl}" class="pixelated" alt="PAE Matrix"/>
          <figcaption>Matriz PAE — Error de Alineación Predicho</figcaption>
        </figure>` : ""}
      </div>` : "";

    const bioHtml = (solScore != null || instIdx != null) ? `
      <section>
        <h2>Propiedades Biológicas</h2>
        <div class="bio-grid">
          ${solScore != null ? `
          <div class="bio-card">
            <div class="bio-label">Solubilidad</div>
            <div class="bio-value">${solScore.toFixed(1)}<span class="bio-unit">/100</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${solScore}%;background:${solScore>=70?"#059669":solScore>=40?"#d97706":"#dc2626"}"></div></div>
            <div class="bio-desc">${solLabel}</div>
          </div>` : ""}
          ${instIdx != null ? `
          <div class="bio-card">
            <div class="bio-label">Índice de Inestabilidad</div>
            <div class="bio-value" style="color:${instIdx<40?"#059669":"#dc2626"}">${instIdx.toFixed(1)}</div>
            <div class="bio-badge" style="background:${instIdx<40?"#d1fae5":"#fee2e2"};color:${instIdx<40?"#065f46":"#991b1b"}">${stabLabel}</div>
          </div>` : ""}
        </div>
      </section>` : "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>LocalFold — ${jobData?.name || "Informe"}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  @media print {
    html, body { width: 210mm; }
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1e293b; background: #fff; font-size: 10pt; line-height: 1.5; }

  /* PRINT BUTTON */
  .print-bar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 20px; display: flex; gap: 10px; align-items: center; }
  .print-bar button { padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
  .btn-print { background: #2563eb; color: white; }
  .btn-close { background: #e2e8f0; color: #475569; }

  /* HEADER */
  .header { background: #2563eb; color: white; padding: 18px 30px 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header-brand { font-size: 18pt; font-weight: 800; letter-spacing: -0.5px; }
  .header-brand span { opacity: 0.7; font-weight: 400; font-size: 10pt; display: block; margin-top: 2px; }
  .header-date { font-size: 9pt; opacity: 0.75; text-align: right; }

  /* PROTEIN TITLE */
  .protein-header { padding: 20px 30px 0; }
  .protein-name { font-size: 22pt; font-weight: 800; color: #0f172a; line-height: 1.1; }
  .protein-meta { display: flex; flex-wrap: wrap; gap: 6px 0; align-items: center; margin-top: 6px; font-size: 9pt; color: #64748b; }
  .protein-meta .sep { margin: 0 8px; opacity: 0.4; }
  .protein-meta code { background: #f1f5f9; border-radius: 4px; padding: 1px 5px; font-size: 8pt; color: #334155; }
  .divider { height: 1px; background: #e2e8f0; margin: 16px 30px; }

  /* IMAGES */
  .images-row { display: flex; gap: 16px; padding: 0 30px; margin-bottom: 16px; justify-content: center; }
  .images-row figure { flex: 1; max-width: 48%; text-align: center; }
  .images-row img { width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; display: block; }
  .images-row img.pixelated { image-rendering: pixelated; }
  .images-row figcaption { font-size: 8pt; color: #94a3b8; margin-top: 5px; }

  /* SECTIONS */
  section { padding: 0 30px; margin-bottom: 18px; }
  h2 { font-size: 11pt; font-weight: 700; color: #0f172a; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; }
  h3, h4 { font-size: 10.5pt; font-weight: 700; color: #1e293b; margin: 8px 0 4px; }

  /* PLDDT */
  .plddt-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .plddt-score { font-size: 28pt; font-weight: 800; line-height: 1; }
  .plddt-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 9pt; font-weight: 700; color: white; }
  .plddt-desc { font-size: 9pt; color: #475569; margin-top: 4px; }
  .plddt-bar-track { height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-top: 8px; }
  .plddt-bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #3b82f6 70%, #1d4ed8 100%); }

  /* BIO GRID */
  .bio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .bio-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
  .bio-label { font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 4px; }
  .bio-value { font-size: 20pt; font-weight: 800; color: #0f172a; line-height: 1; }
  .bio-unit { font-size: 11pt; color: #94a3b8; font-weight: 400; }
  .progress-bar { height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin: 8px 0 4px; }
  .progress-fill { height: 100%; border-radius: 99px; }
  .bio-badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 8.5pt; font-weight: 600; margin-top: 8px; }
  .bio-desc { font-size: 8pt; color: #64748b; margin-top: 4px; }

  /* AI SUMMARY */
  .ai-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 0 10px 10px 0; padding: 14px 16px; font-size: 9.5pt; color: #334155; line-height: 1.65; }
  .ai-summary p { margin-bottom: 8px; }
  .ai-summary h3, .ai-summary h4 { color: #1e3a8a; margin-bottom: 4px; }

  /* FOOTER */
  .footer { margin-top: 24px; padding: 12px 30px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-size: 9pt; font-weight: 700; color: #2563eb; }
  .footer-note { font-size: 7.5pt; color: #94a3b8; max-width: 380px; text-align: right; }
</style>
</head>
<body>

<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">⬇ Imprimir / Guardar PDF</button>
  <button class="btn-close" onclick="window.close()">Cerrar</button>
  <span style="font-size:12px;color:#64748b;margin-left:8px">En el diálogo de impresión selecciona <strong>Guardar como PDF</strong></span>
</div>

<div class="header">
  <div class="header-brand">🧬 LocalFold<span>Informe de Predicción Estructural</span></div>
  <div class="header-date">Impacthon 2026 · CESGA FinisTerrae III<br>${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</div>
</div>

<div class="protein-header">
  <div class="protein-name">${jobData?.name || "Proteína"}</div>
  <div class="protein-meta">${metaParts}</div>
</div>
<div class="divider"></div>

${imagesHtml}

<section>
  <h2>Confianza Estructural — pLDDT</h2>
  <div class="plddt-row">
    <div class="plddt-score" style="color:${plddtColor}">${plddt.toFixed(1)}</div>
    <div>
      <div class="plddt-badge" style="background:${plddtColor}">${plddtConf}</div>
      <div class="plddt-desc">${plddtDesc}</div>
    </div>
  </div>
  <div class="plddt-bar-track"><div class="plddt-bar-fill" style="width:${plddt}%"></div></div>
</section>

${bioHtml}

<section>
  <h2>Análisis IA — Proteia (Gemini 1.5 Pro via n8n)</h2>
  <div class="ai-summary"><p>${summaryHtml}</p></div>
</section>

<div class="footer">
  <div class="footer-brand">🧬 LocalFold</div>
  <div class="footer-note">Los resultados son predicciones computacionales generadas por AlphaFold 2. No constituyen diagnóstico clínico ni asesoramiento médico.</div>
</div>

</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) { alert("Permite las ventanas emergentes para generar el informe."); return; }
    win.document.write(html);
    win.document.close();
  };

  const handleDownloadLogs = async () => {
    if (!jobId) return;
    setDownloadingLogs(true);
    try {
      // Status for timing info, outputs for actual logs
      const [statusResp, outputsResp] = await Promise.all([
        fetch(`https://api-mock-cesga.onrender.com/jobs/${jobId}/status`),
        fetch(`https://api-mock-cesga.onrender.com/jobs/${jobId}/outputs`),
      ]);
      const status = await statusResp.json();
      const outputs = outputsResp.ok ? await outputsResp.json() : null;

      const logLines = [
        `Job ID:    ${jobId}`,
        `Status:    ${status.status}`,
        `Started:   ${status.started_at || "—"}`,
        `Completed: ${status.completed_at || "—"}`,
        `CPUs:      ${status.cpus ?? "—"}   GPUs: ${status.gpus ?? "—"}   RAM: ${status.memory_gb ?? "—"} GB`,
        "",
        outputs?.logs || "(no logs available)",
      ];
      const safeName = (jobData?.name || jobId).replace(/[^a-z0-9]/gi, "_");
      downloadFile(logLines.join("\n"), `${safeName}_logs.txt`);
    } catch {
      downloadFile(`Job ID: ${jobId}\n(error fetching logs)`, `job_${jobId}_logs.txt`);
    } finally {
      setDownloadingLogs(false);
    }
  };

  // Initialize PDBe Molstar Plugin

  useEffect(() => {
    let viewerInstance;
    let isCancelled = false;

    const fetchAndInitViewer = async () => {
      if (!jobId) return;
      setFetchError(false);

      let customUrl = null;
      let data = {};

      if (jobId === "job_demo_segura") {
          // Demo Segura inyectada: No hay latencia ni fallos de red
          data = {
            name: "Ubiquitina (Demo UI Pitch)",
            plddt: 94.2,
            pdbFileUrl: null, // Usa el 1cbs embebido
            biological: {
              solubility_score: 88.5,
              solubility_prediction: "SOLUBLE",
              instability_index: 28.4,
              stability_status: "STABLE",
              toxicity_alerts: [],
              allergenicity_alerts: []
            },
            uniprot: "P0CG48",
            organism: "Homo sapiens",
            paeMatrix: null,
            plddtHistogram: [0, 0, 5, 95]
          };
        } else {
          try {
            const resp = await fetch(`https://api-mock-cesga.onrender.com/jobs/${jobId}/outputs`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const out = await resp.json();
            data = {
              name: out.protein_metadata?.protein_name || jobId,
              plddt: out.structural_data?.confidence?.plddt_mean
                  ?? out.structural_data?.confidence?.plddt_average
                  ?? out.protein_metadata?.plddt_average
                  ?? 85.0,
              pdbFileUrl: out.structural_data?.pdb_file || null,
              biological: out.biological_data || null,
              uniprot: out.protein_metadata?.uniprot_id || null,
              organism: out.protein_metadata?.organism || null,
              paeMatrix: out.structural_data?.confidence?.pae_matrix || null,
              plddtHistogram: out.structural_data?.confidence?.plddt_histogram || null,
            };
            if (data.pdbFileUrl) {
              // The API returns the raw text content of the PDB, not a URL.
              // We convert it to a Blob and get an Object URL so Molstar can 'fetch' it.
              const blob = new Blob([data.pdbFileUrl], { type: 'text/plain' });
              customUrl = URL.createObjectURL(blob);
            }
          } catch (e) {
            console.error("Error fetching job outputs", e);
            if (!isCancelled) setFetchError(true);
            return;
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
  }, [jobId, retryKey]);

  /* pLDDT helpers — computed before any early return so hooks aren't skipped */
  const plddt = jobData?.plddt ?? 0;
  const plddtConf  = plddt >= 90 ? "Muy alta" : plddt >= 70 ? "Alta" : plddt >= 50 ? "Baja" : "Muy baja";
  const plddtColor = plddt >= 90 ? "text-blue-600 dark:text-blue-400" : plddt >= 70 ? "text-sky-500 dark:text-sky-400" : plddt >= 50 ? "text-amber-500" : "text-orange-500";
  const plddtBg    = plddt >= 90 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : plddt >= 70 ? "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800" : plddt >= 50 ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
  const solScore   = jobData?.biological?.solubility_score;
  const instIdx    = jobData?.biological?.instability_index;

  /* ── Empty state: no job selected ── */
  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 dark:bg-slate-900 gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <Dna className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Ninguna predicción seleccionada</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
            Abre un trabajo completado desde <strong className="text-slate-500 dark:text-slate-400">Mis Trabajos</strong> o envía una nueva secuencia para visualizarla en 3D.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="/app/jobs"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            Mis trabajos
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <a
            href="/app/submit"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Nueva predicción
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-slate-100 dark:bg-slate-950 viewer-container">
      {/* Hide Molstar side panels, keep only the canvas */}
      <style>{`
        .viewer-container .msp-layout-region-left,
        .viewer-container .msp-layout-region-right,
        .viewer-container .msp-layout-region-bottom,
        .viewer-container .msp-layout-toggle { display: none !important; }
        .viewer-container .msp-layout-standard {
          grid-template-columns: 0fr 1fr 0fr !important;
          grid-template-rows: 0fr 1fr 0fr !important;
        }
      `}</style>

      {/* ── 3D Canvas ── */}
      <div className="flex-1 relative h-full">
        <div
          className={`w-full h-full ${!isLoaded ? "animate-pulse bg-slate-200 dark:bg-slate-800" : ""}`}
          ref={viewerContainerRef}
        />

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Cargando estructura…</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Panel ── */}
      <div
        className="relative border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col z-20 shrink-0"
        style={{ width: panelWidth }}
      >
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-30 group"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-1 rounded-full bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Error state */}
        {fetchError && (
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Error al cargar los datos</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                No se pudo conectar con la API de CESGA. Comprueba tu conexión o inténtalo de nuevo.
              </p>
            </div>
            <button
              onClick={() => { setFetchError(false); setJobData(null); setIsLoaded(false); setRetryKey(k => k + 1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {/* Protein header */}
        {!fetchError && <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug truncate">
            {jobData?.name || "Cargando…"}
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
            {jobData?.organism && (
              <span className="text-[11px] italic text-slate-400 dark:text-slate-500 truncate">{jobData.organism}</span>
            )}
            {jobData?.uniprot && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {jobData.uniprot}
              </span>
            )}
          </div>
        </div>}

        {/* Tabs */}
        {!fetchError && <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
          {[["details", "Estructura"], ["copilot", "Proteia"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === key
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>}

        {/* Tab content */}
        {!fetchError && <div className="flex-1 overflow-y-auto">

          {activeTab === "details" && (
            <div className="p-4 space-y-4">

              {/* pLDDT score */}
              <div className={`rounded-lg border p-3 ${plddtBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">pLDDT</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${plddtBg} ${plddtColor}`}>
                    {plddtConf}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-bold tabular-nums leading-none ${plddtColor}`}>
                    {plddt.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 mb-0.5">/ 100</span>
                </div>
                <div className="mt-2.5 h-1.5 w-full rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${plddt}%`,
                      background: "linear-gradient(90deg,#FF7D45 0%,#FFDB13 35%,#65CBF3 65%,#0053D6 100%)"
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  {[["#FF7D45","< 50"],["#FFDB13","50"],["#65CBF3","70"],["#0053D6","90+"]].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono">{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biological stats */}
              {(solScore != null || instIdx != null) && (
                <div className="grid grid-cols-2 gap-2">
                  {solScore != null && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Solubilidad</p>
                      <p className={`text-xl font-bold tabular-nums ${solScore >= 70 ? "text-emerald-600 dark:text-emerald-400" : solScore >= 40 ? "text-amber-500" : "text-red-500"}`}>
                        {solScore.toFixed(0)}
                        <span className="text-xs font-normal text-slate-400 ml-0.5">/100</span>
                      </p>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${solScore}%`,
                            background: solScore >= 70 ? "#10b981" : solScore >= 40 ? "#f59e0b" : "#ef4444"
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {instIdx != null && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Inestabilidad</p>
                      <p className={`text-xl font-bold tabular-nums ${instIdx < 40 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        {instIdx.toFixed(1)}
                      </p>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded mt-1.5 inline-block ${instIdx < 40 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
                        {instIdx < 40 ? "Estable" : "Inestable"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* PAE Heatmap */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Matriz PAE</span>
                  {jobData?.paeMatrix && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <Maximize2 className="w-3 h-3" /> Ampliar
                    </button>
                  )}
                </div>
                {jobData?.paeMatrix ? (
                  <div
                    className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <PAEHeatmap ref={paeReportRef} matrix={jobData.paeMatrix} className="w-full h-[200px]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 h-20 flex items-center justify-center">
                    <span className="text-[11px] text-slate-400">No disponible para este job</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === "copilot" && (
            <div className="h-full" style={{ minHeight: "400px" }}>
              <ProteinCopilot
                jobId={jobId}
                proteinName={jobData?.name}
                statusData={jobData}
                onSummaryReady={setAiSummary}
              />
            </div>
          )}
        </div>}

        {/* Downloads footer */}
        {!fetchError && <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-3 space-y-2 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={handleDownloadReport}
            disabled={!jobData || waitingForAi}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {waitingForAi
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Esperando análisis IA…</>
              : <><FileText className="w-3.5 h-3.5" /> {aiSummary ? "Generar informe PDF ✓" : "Generar informe PDF"}</>}
          </button>

          <div className="flex gap-1.5">
            {[
              { label: "PDB",  onClick: handleDownloadPdb,  disabled: !jobData?.pdbFileUrl },
              { label: "JSON", onClick: handleDownloadJson, disabled: !jobData },
              { label: downloadingLogs ? "…" : "Logs", onClick: handleDownloadLogs, disabled: !jobId || downloadingLogs },
            ].map(({ label, onClick, disabled }) => (
              <button
                key={label}
                onClick={onClick}
                disabled={disabled}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>}

      </div>{/* end right panel */}

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
