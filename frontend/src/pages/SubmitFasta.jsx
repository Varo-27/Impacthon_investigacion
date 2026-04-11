import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, FlaskConical, Dna, ArrowRight, FolderOpen, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { getJobOutputs } from "../lib/outputsCache";
import { searchProteins, getProteinDetails, findBestProteinMatch, extractProteinMetadata } from "../api/proteinsApi";

const PROTEIN_SAMPLES = [
  {
    name: "Ubiquitina",
    tag: "UBQ",
    fasta: `>sp|P0CG48|UBC_HUMAN Polyubiquitin-C OS=Homo sapiens
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG`
  },
  {
    name: "GFP",
    tag: "GFP",
    fasta: `>sp|P42212|GFP_AEQVI Green fluorescent protein OS=Aequorea victoria
MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK`
  },
  {
    name: "p53",
    tag: "P53",
    fasta: `>sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens
MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYPQGLNGTVNLFRNLNSSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAHATEESGDSRAHSSYLKTKKGQSTSRHKKLMFKTEGPDSD`
  },
  {
    name: "SOD1",
    tag: "SOD1",
    fasta: `>sp|P00441|SODC_HUMAN Superoxide dismutase [Cu-Zn] OS=Homo sapiens
MATKAVCVLKGDGPVQGIINFEQKESNGPVKVWGSIKGLTEGLHGFHVHEFGDNTAGCTSAGPHFNPLSRKHGGPKDEERHVGDLGNVTADKDGVADVSIEDSVISLSGDHCIIGRTLVVHEKADDLGKGGNEESTKTGNAGSRLACGVIGIAQ`
  },
  {
    name: "Insulina",
    tag: "INS",
    fasta: `>sp|P01308|INS_HUMAN Insulin OS=Homo sapiens
MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN`
  },
];

/** Extrae un nombre legible del header FASTA.
 *  - UniProt:  >sp|P00441|SODC_HUMAN Superoxide dismutase OS=Homo sapiens → "Superoxide dismutase"
 *  - NCBI:     >gi|12345|ref|NP_123.1| Protein name [Homo sapiens]       → "Protein name"
 *  - Simple:   >My protein                                                → "My protein"
 */
function parseFastaName(header) {
  if (!header.startsWith(">")) return "Proteína";
  const raw = header.slice(1).trim();

  // UniProt: >sp|ACC|ENTRY_NAME description OS=...
  const uniprotMatch = raw.match(/^(?:sp|tr|ref)\|[^|]+\|[^\s]+\s+(.+?)(?:\s+OS=.*)?$/);
  if (uniprotMatch) return uniprotMatch[1].trim();

  // NCBI gi: >gi|...|...|id| description [organism]
  const ncbiMatch = raw.match(/^(?:gi\|\d+\|[^|]*\|[^|]+\|)\s*(.+?)(?:\s+\[.+\])?$/);
  if (ncbiMatch) return ncbiMatch[1].trim();

  // Cualquier pipe: descartar todo hasta el último pipe y usar el resto
  if (raw.includes("|")) {
    const afterLastPipe = raw.split("|").pop().trim();
    const desc = afterLastPipe.split(/\s+OS=/)[0].trim();
    if (desc.length > 2) return desc.length > 60 ? desc.slice(0, 60) + "…" : desc;
  }

  // Header simple — usar como está
  return raw.length > 60 ? raw.slice(0, 60) + "…" : raw;
}


function enrichJobWhenCompleted(jobId, cesgaJobId, proteinName) {
  setTimeout(async () => {
    try {
      // Opción 1: Buscar en catálogo por nombre (si no se hizo antes)
      let proteinMatch = null;
      if (proteinName) {
        proteinMatch = await findBestProteinMatch(proteinName, null);
      }

      // Opción 2: Enriquecer con datos de outputs de API
      const outputs = await getJobOutputs(cesgaJobId);
      
      let updateData = {
        updatedAt: serverTimestamp(),
        organism: outputs?.organism || proteinMatch?.organism || null,
        uniprotId: outputs?.uniprot || proteinMatch?.uniprot_id || null,
        plddt: outputs?.plddt ?? null,
      };

      // Si encontramos la proteína en el catálogo, agregar más información
      if (proteinMatch) {
        updateData.proteinId = proteinMatch.protein_id || null;
        updateData.pdbId = proteinMatch.pdb_id || null;
        updateData.category = proteinMatch.category || null;
        
        // Si tiene ID, obtener detalles completos
        if (proteinMatch.protein_id) {
          const fullDetails = await getProteinDetails(proteinMatch.protein_id);
          if (fullDetails) {
            const metadata = extractProteinMetadata(fullDetails);
            updateData = { ...updateData, ...metadata };
          }
        }
      }

      // Si tenemos outputs con identified_protein, obtener detalles por ID
      if (outputs?.identified_protein) {
        const proteinDetails = await getProteinDetails(outputs.identified_protein);
        if (proteinDetails) {
          const metadata = extractProteinMetadata(proteinDetails);
          updateData = { ...updateData, ...metadata };
        }
      }

      await updateDoc(doc(db, "jobs", jobId), updateData);
    } catch (e) {
      console.error("Error enriqueciendo job:", e);
    }
  }, 2000);
}

export default function SubmitFasta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || null;
  const [projectName, setProjectName] = useState(null);
  const [fastaContent, setFastaContent] = useState("");
  const [customName, setCustomName] = useState("");
  const [sequenceWarnings, setSequenceWarnings] = useState([]);
  const [parsedSequences, setParsedSequences] = useState([]);
  const [multiSubmitSuccess, setMultiSubmitSuccess] = useState(0);

  /* Nuevos campos para filtrado */

  /* Load project name if coming from a project */
  useEffect(() => {
    if (!projectId) return;
    getDoc(doc(db, "projects", projectId)).then((snap) => {
      if (snap.exists()) setProjectName(snap.data().name);
    });
  }, [projectId]);
  const [activeChip, setActiveChip] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [resourcePreset, setResourcePreset] = useState("Alta");
  const [customResources, setCustomResources] = useState({ cpu: "", gpu: "", memory: "", runtime: "" });

  const CUSTOM_LIMITS = {
    cpu:     { min: 1,  max: 64,    unit: "cores",   label: "CPU" },
    gpu:     { min: 0,  max: 4,     unit: "GPUs",    label: "GPU" },
    memory:  { min: 0,  max: 256,   unit: "GB",      label: "Memoria" },
    runtime: { min: 60, max: 86400, unit: "s",       label: "Max runtime" },
  };

  const customResourceWarnings = (() => {
    if (resourcePreset !== "Personalizado") return [];
    const warns = [];
    for (const [key, { min, max, unit, label }] of Object.entries(CUSTOM_LIMITS)) {
      const val = parseFloat(customResources[key]);
      if (customResources[key] === "" || isNaN(val)) continue;
      if (val < min) warns.push({ key, type: "error", msg: `${label}: el mínimo permitido por la API es ${min} ${unit}. Valor actual: ${val}.` });
      else if (val > max) warns.push({ key, type: "error", msg: `${label}: el máximo permitido por la API es ${max} ${unit}. Valor actual: ${val}.` });
    }
    return warns;
  })();
  
  const [jobStatus, setJobStatus] = useState(null);
  const [jobOutputs, setJobOutputs] = useState(null);
  const [jobAccounting, setJobAccounting] = useState(null);

  const PRESET_RESOURCES = {
    Alta: { cpu: 16, gpu: 80, mem: 64, runtime: 7200, res: "Alta", note: "Mayor fiabilidad = mayor precisión estructural, pero requiere más tiempo de cómputo y recursos de GPU." },
    Intermedia: { cpu: 8, gpu: 40, mem: 32, runtime: 3600, res: "Media", note: "Equilibrio ideal entre velocidad de procesamiento y precisión de la estructura final." },
    Baja: { cpu: 4, gpu: 16, mem: 16, runtime: 1200, res: "Baja", note: "Resultados más rápidos, pero la resolución 3D será menor y los datos pueden ser difusos." },
  };

  const handleChipClick = (protein) => {
    if (activeChip === protein.tag) {
      setFastaContent("");
      setCustomName("");
      setActiveChip(null);
    } else {
      setFastaContent(protein.fasta);
      setCustomName(protein.name);
      setActiveChip(protein.tag);
    }
  };

  const handleTextareaChange = (e) => {
    setFastaContent(e.target.value);
    setActiveChip(null);
  };

  useEffect(() => {
    if (!fastaContent.trim()) {
      setSequenceWarnings([]);
      setParsedSequences([]);
      return;
    }

    let raw = fastaContent.replace(/\r\n/g, "\n");
    let sequencesParts = raw.split(/(?=>)/).filter(p => p.trim());
    if (sequencesParts.length > 0 && !sequencesParts[0].startsWith(">")) {
      sequencesParts = raw.split(/>/).filter(p => p.trim());
    }

    let hasHeader = raw.trim().startsWith(">");
    let warns = [];
    let parsedArray = [];
    let globalInvalidChars = new Set();
    let hasDna = false;

    if (!hasHeader && sequencesParts.length > 0) {
      warns.push({ type: "generic", msg: "No se ha detectado cabecera FASTA. Se asignará el nombre genérico 'Proteína'. Se recomienda añadir un Nombre personalizado." });
    }

    sequencesParts.forEach((part, index) => {
      let header = "";
      let body = "";

      if (index === 0 && !hasHeader) {
        header = ">Proteína";
        body = part;
      } else {
        let lines = part.split("\n");
        header = lines[0].startsWith(">") ? lines[0] : ">" + lines[0];
        body = lines.slice(1).join("\n");
      }

      let cleanBody = body.replace(/[\d\s]+/g, "").toUpperCase();
      let formattedBody = cleanBody.match(/.{1,80}/g)?.join("\n") || cleanBody;
      let finalCode = `${header}\n${formattedBody}`;
      
      const invalidChars = cleanBody.match(/[*\-XBZU]/g);
      if (invalidChars) invalidChars.forEach(c => globalInvalidChars.add(c));

      const atgcMatch = cleanBody.match(/[ATGC]/g);
      if (atgcMatch && cleanBody.length > 0 && atgcMatch.length / cleanBody.length > 0.8) {
        hasDna = true;
      }

      parsedArray.push({
        name: parseFastaName(header),
        cleanFasta: finalCode,
        aaCount: cleanBody.length,
        lines: finalCode.split("\n")
      });
    });

    if (globalInvalidChars.size > 0) {
      warns.push({ type: "invalid", msg: `⚠ Se han detectado caracteres no estándar (${Array.from(globalInvalidChars).join(" ")}). Es posible que la predicción sea menos precisa.` });
    }
    if (hasDna) {
      warns.push({ type: "dna", msg: "Parece que has pegado una secuencia de ADN. Esta herramienta acepta secuencias de aminoácidos (proteínas). ¿Quieres traducirla primero?" });
    }

    setSequenceWarnings(warns);
    setParsedSequences(parsedArray);
  }, [fastaContent]);

  useEffect(() => {
    let intervalId;
    if (jobStatus && (jobStatus.status === "PENDING" || jobStatus.status === "RUNNING")) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`https://api-mock-cesga.onrender.com/jobs/${jobStatus.id}/status`);
          const data = await res.json();
          setJobStatus(prev => ({ ...prev, status: data.status, error: data.error_message }));
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [jobStatus]);

  useEffect(() => {
    if (jobStatus?.status === "COMPLETED") {
      navigate(`/app?job=${jobStatus.id}`);
    }
  }, [jobStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fastaContent.trim() || parsedSequences.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSubmitted(false);
    setMultiSubmitSuccess(0);
    setJobStatus(null);
    setJobOutputs(null);
    setJobAccounting(null);

    try {
      let gpus, cpus, memory_gb, max_runtime_seconds;
      if (resourcePreset === 'Personalizado') {
         gpus = 1;
         cpus = parseInt(customResources.cpu) || 8;
         memory_gb = parseFloat(customResources.memory) || 32.0;
         max_runtime_seconds = parseInt(customResources.runtime) || 3600;
      } else {
         gpus = 1;
         cpus = parseInt(PRESET_RESOURCES[resourcePreset].cpu);
         memory_gb = parseFloat(PRESET_RESOURCES[resourcePreset].mem);
         max_runtime_seconds = parseInt(PRESET_RESOURCES[resourcePreset].runtime);
      }

      let submittedJobs = [];

      for (let i = 0; i < parsedSequences.length; i++) {
        const seq = parsedSequences[i];
        const assignedFileName = (parsedSequences.length === 1 && customName.trim() ? customName.trim() : seq.name) + ".fasta";

        // Opción 1: Intentar buscar la proteína en el catálogo por nombre
        let catalogProtein = null;
        let enrichmentData = {};
        
        if (parsedSequences.length === 1 && customName.trim()) {
          // Si el usuario dio un nombre = usar ese
          catalogProtein = await findBestProteinMatch(customName.trim(), seq.aaCount);
        } else {
          // Si no, usar el nombre parseado del FASTA
          catalogProtein = await findBestProteinMatch(seq.name, seq.aaCount);
        }

        // Si encontramos una coincidencia, preparar datos de enriquecimiento
        if (catalogProtein) {
          enrichmentData = {
            proteinId: catalogProtein.protein_id || null,
            uniprot: catalogProtein.uniprot_id || null,
            pdbId: catalogProtein.pdb_id || null,
            category: catalogProtein.category || null,
            organism: catalogProtein.organism || null,
            molecularWeight: catalogProtein.molecular_weight_kda || null,
          };
        }

        const response = await fetch("https://api-mock-cesga.onrender.com/jobs/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({ 
            fasta_sequence: seq.cleanFasta, 
            fasta_filename: assignedFileName,
            gpus, cpus, memory_gb, max_runtime_seconds
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          let msg = `Error desconocido al procesar la secuencia ${seq.name}`;
          if (data.detail) msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
          throw new Error(msg);
        }

        const fallbackName = seq.lines[0].startsWith(">") ? parseFastaName(seq.lines[0]) : "Proteína";
        const assignedName = parsedSequences.length === 1 && customName.trim() ? customName.trim() : fallbackName;

        if (auth.currentUser) {
          const jobRef = await addDoc(collection(db, "jobs"), {
            userId: auth.currentUser.uid,
            cesgaJobId: data.job_id,
            proteinName: assignedName,
            status: data.status || "PENDING",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            fastaContent: seq.cleanFasta,
            aaLength: seq.aaCount,
            ...(projectId ? { projectId, ...(projectName ? { projectName } : {}) } : {}),
            // Datos enriquecidos del catálogo
            ...enrichmentData,
          });
          
          /* Enriquecer automáticamente cuando se completa */
          enrichJobWhenCompleted(jobRef.id, data.job_id, assignedName);
        }
        
        submittedJobs.push(data);
      }

      setSubmitted(true);
      
      if (parsedSequences.length === 1) {
         setJobStatus({ id: submittedJobs[0].job_id, status: submittedJobs[0].status || "PENDING" });
         setIsSubmitting(false);
      } else {
         setMultiSubmitSuccess(parsedSequences.length);
         setTimeout(() => {
            navigate(projectId ? `/app/projects/${projectId}` : "/app/jobs");
         }, 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFastaContent(ev.target.result);
      reader.readAsText(file);
      setActiveChip(null);
    }
  };

  const lineCount = parsedSequences.reduce((acc, seq) => acc + seq.lines.length, 0);
  const aaCount = parsedSequences.reduce((acc, seq) => acc + seq.aaCount, 0);

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 w-full">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Nueva predicción</h1>
          {projectName && (
            <div className="flex items-center gap-1.5 mt-1">
              <FolderOpen className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{projectName}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate(projectId ? `/app/projects/${projectId}` : "/app/jobs")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {projectId ? "← Proyecto" : "Mis trabajos"}
          {!projectId && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Success banner */}
      {submitted && parsedSequences.length === 1 && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Secuencia enviada. Ve a <button onClick={() => navigate(projectId ? `/app/projects/${projectId}` : "/app/jobs")} className="underline font-medium mx-1">{projectId ? "el proyecto" : "Mis trabajos"}</button> para seguir el progreso.
        </div>
      )}
      {submitted && multiSubmitSuccess > 1 && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          ¡{multiSubmitSuccess} secuencias enviadas al clúster! Redirigiendo a tu bandeja de trabajos...
        </div>
      )}

      {/* Main panel */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">



          {/* Recursos de cómputo */}
          <div className="px-4 py-5 bg-white dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700/50">
            <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-[0.08em] uppercase mb-3">
              Recursos de cómputo
            </h3>

            {/* Preset Selector */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {['Alta', 'Intermedia', 'Baja', 'Personalizado'].map((preset) => {
                const isSelected = resourcePreset === preset;
                let label = preset;
                if (preset === 'Alta') label = 'Alta fiabilidad';
                if (preset === 'Baja') label = 'Baja fiabilidad';

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setResourcePreset(preset)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ease-in-out border outline-none ${
                      isSelected
                        ? "border-[#2dd4bf] text-[#2dd4bf] bg-[rgba(45,212,191,0.07)]"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-transparent"
                    }`}
                  >
                    {label}
                    {preset === 'Alta' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold ${
                        isSelected ? "bg-[#2dd4bf]/20 text-[#2dd4bf]" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}>
                        Recomendado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Preset Info / Custom Form */}
            {resourcePreset !== 'Personalizado' ? (
              <div>
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-[10px] py-[14px] px-[18px] flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
                  {[
                    { label: "CPU", value: `${PRESET_RESOURCES[resourcePreset].cpu} cores` },
                    { label: "GPU (GB)", value: `${PRESET_RESOURCES[resourcePreset].gpu} GB` },
                    { label: "Memoria", value: `${PRESET_RESOURCES[resourcePreset].mem} GB` },
                    { label: "Max runtime", value: `${PRESET_RESOURCES[resourcePreset].runtime} s` },
                    { label: "Resolución 3D", value: PRESET_RESOURCES[resourcePreset].res }
                  ].map((field, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">{field.label}</span>
                      <span className="text-[14px] font-medium text-slate-700 dark:text-slate-200">{field.value}</span>
                    </div>
                  ))}
                </div>
                {PRESET_RESOURCES[resourcePreset].note && (
                  <p className="mt-2 text-[12px] text-[#4b5872]">
                    {PRESET_RESOURCES[resourcePreset].note}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-[10px] p-4">
                <div className="grid grid-cols-2 lg:flex lg:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">CPU (cores)</label>
                    <input
                      type="number"
                      placeholder="1–64"
                      value={customResources.cpu}
                      onChange={(e) => setCustomResources({ ...customResources, cpu: e.target.value })}
                      className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-600 focus:border-[#3b82f6] rounded-[6px] px-3 py-1.5 text-sm outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#4b5563] transition-colors duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">GPU (GB)</label>
                    <input
                      type="number"
                      placeholder="0–4"
                      value={customResources.gpu}
                      onChange={(e) => setCustomResources({ ...customResources, gpu: e.target.value })}
                      className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-600 focus:border-[#3b82f6] rounded-[6px] px-3 py-1.5 text-sm outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#4b5563] transition-colors duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Memoria (GB)</label>
                    <input
                      type="number"
                      placeholder="0–256"
                      value={customResources.memory}
                      onChange={(e) => setCustomResources({ ...customResources, memory: e.target.value })}
                      className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-600 focus:border-[#3b82f6] rounded-[6px] px-3 py-1.5 text-sm outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#4b5563] transition-colors duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Max runtime (s)</label>
                    <input
                      type="number"
                      placeholder="60–86400"
                      value={customResources.runtime}
                      onChange={(e) => setCustomResources({ ...customResources, runtime: e.target.value })}
                      className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-600 focus:border-[#3b82f6] rounded-[6px] px-3 py-1.5 text-sm outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#4b5563] transition-colors duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                {customResourceWarnings.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {customResourceWarnings.map((w, i) => (
                      <div key={i} className="flex gap-2 items-start text-xs p-2.5 rounded-md border bg-red-500/10 border-red-500/30 text-red-500">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" />
                        <p className="leading-snug">{w.msg}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>



          {/* FASTA textarea */}
          <div className="relative">
            <textarea
              value={fastaContent}
              onChange={handleTextareaChange}
              placeholder={">sp|P02769|ALBU_BOVIN Serum albumin OS=Bos taurus\nMKWVTFISLLLLFSSAYSRGVFRR..."}
              rows={12}
              className="w-full px-4 py-3 font-mono text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/40 border-none"
            />
            {fastaContent && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
                  {parsedSequences.length > 1 ? `${parsedSequences.length} secuencias · ` : ""}{aaCount} aa · {lineCount} líneas
                </span>
              </div>
            )}
          </div>

          {sequenceWarnings.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40/50 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-2">
              {sequenceWarnings.map((w, i) => (
                <div key={i} className="flex gap-2 items-start text-xs p-2.5 rounded-md border bg-amber-500/10 border-amber-500/30 text-amber-500">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" />
                  <p className="leading-snug">{w.msg}</p>
                </div>
              ))}
            </div>
          )}

          {/* Footer bar or Job Status */}
          {jobStatus ? (
            <div className="flex flex-col p-5 border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/40">
              {/* Status Indicator */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-[10px] p-4 flex flex-col items-center justify-center">
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2 ${
                  jobStatus.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' :
                  jobStatus.status === 'RUNNING' ? 'bg-blue-500/20 text-blue-400' :
                  jobStatus.status === 'COMPLETED' ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]' :
                  jobStatus.status === 'FAILED' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'
                }`}>
                  {jobStatus.status === 'RUNNING' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                  {jobStatus.status}
                </div>
                <div className="mt-2 text-[11px] text-[#64748b] font-mono tracking-widest">
                  ID: {jobStatus.id}
                </div>
              </div>

              {/* FAILED Alert */}
              {jobStatus.status === 'FAILED' && jobStatus.error && (
                <div className="mt-4 flex flex-col gap-1.5 px-4 py-3 rounded-[10px] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-slate-800/40 text-red-700 dark:text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <strong>Error de ejecución</strong>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{jobStatus.error}</p>
                </div>
              )}

              {/* COMPLETED Summary Info */}
              {jobStatus.status === 'COMPLETED' && jobOutputs && jobAccounting && (
                <div className="mt-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-[10px] p-5">
                  {/* Metadata Row */}
                  {jobOutputs.protein_metadata && (
                    <div className="mb-5 pb-4 border-b border-slate-200 dark:border-slate-700/50 text-[12px] text-[#64748b] flex flex-wrap gap-x-5 gap-y-2">
                      {jobOutputs.protein_metadata.name && <span><strong className="text-slate-600 dark:text-slate-300 font-medium">Nombre:</strong> {jobOutputs.protein_metadata.name}</span>}
                      {jobOutputs.protein_metadata.uniprot_id && <span><strong className="text-slate-600 dark:text-slate-300 font-medium">UniProt ID:</strong> {jobOutputs.protein_metadata.uniprot_id}</span>}
                      {jobOutputs.protein_metadata.pdb_id && <span><strong className="text-slate-600 dark:text-slate-300 font-medium">PDB ID:</strong> {jobOutputs.protein_metadata.pdb_id}</span>}
                      {jobOutputs.protein_metadata.organism && <span><strong className="text-slate-600 dark:text-slate-300 font-medium">Organismo:</strong> {jobOutputs.protein_metadata.organism}</span>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Estructura Group */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-[#64748b] tracking-[0.08em] uppercase mb-3">Estructura</h4>
                      <div className="flex flex-col gap-2.5">
                         {(() => {
                           const plddt = jobOutputs.structural_data?.confidence?.plddt_mean
                             ?? jobOutputs.structural_data?.confidence?.plddt_average
                             ?? jobOutputs.metrics?.plddt_mean
                             ?? null;
                           const fractions = jobOutputs.structural_data?.confidence ?? jobOutputs.metrics ?? null;
                           return plddt != null ? (
                             <>
                               <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 px-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-[6px]">
                                 <span className="text-xs text-slate-800 dark:text-slate-200">pLDDT medio</span>
                                 <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                    plddt > 90 ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]' :
                                    plddt >= 70 ? 'bg-blue-500/20 text-blue-400' :
                                    plddt >= 50 ? 'bg-amber-500/20 text-amber-500' :
                                    'bg-red-500/20 text-red-500'
                                 }`}>
                                   {plddt.toFixed(1)}
                                 </span>
                               </div>
                               {fractions && (fractions.fraction_plddt_above_90 != null || fractions.fraction_plddt_70_to_90 != null) && (
                                 <div className="bg-slate-50 dark:bg-slate-900/40 px-3 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-[6px] flex flex-col gap-2">
                                   <span className="text-xs text-slate-800 dark:text-slate-200">Fracción de residuos</span>
                                   <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase font-medium tracking-wider">
                                     <span className="text-[#2dd4bf]">Muy Alta: {((fractions.fraction_plddt_above_90 ?? 0) * 100).toFixed(0)}%</span>
                                     <span className="text-blue-400">Alta: {((fractions.fraction_plddt_70_to_90 ?? 0) * 100).toFixed(0)}%</span>
                                     <span className="text-amber-500">Media: {((fractions.fraction_plddt_50_to_70 ?? 0) * 100).toFixed(0)}%</span>
                                     <span className="text-red-500">Baja: {((fractions.fraction_plddt_below_50 ?? 0) * 100).toFixed(0)}%</span>
                                   </div>
                                 </div>
                               )}
                             </>
                           ) : null;
                         })()}
                         {jobOutputs.derived_insights && (
                           <>
                             <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 px-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-[6px]">
                               <span className="text-xs text-slate-800 dark:text-slate-200">Solubilidad score</span>
                               <span className="text-xs text-slate-600 dark:text-slate-300">{jobOutputs.derived_insights.solubility_score?.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 px-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-[6px]">
                               <span className="text-xs text-slate-800 dark:text-slate-200">Estado estabilidad</span>
                               <span className="text-xs text-slate-600 dark:text-slate-300 capitalize">{jobOutputs.derived_insights.stability_status}</span>
                             </div>
                           </>
                         )}
                      </div>
                    </div>

                    {/* Contabilidad HPC Group */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-[#64748b] tracking-[0.08em] uppercase mb-3">Contabilidad HPC</h4>
                      <div className="flex flex-col gap-2.5">
                         <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 px-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-[6px]">
                           <span className="text-xs text-slate-800 dark:text-slate-200">CPU Hours</span>
                           <span className="text-xs text-slate-600 dark:text-slate-300">{jobAccounting.cpu_hours?.toFixed(2)} h</span>
                         </div>
                         <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 px-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-[6px]">
                           <span className="text-xs text-slate-800 dark:text-slate-200">GPU Hours</span>
                           <span className="text-xs text-slate-600 dark:text-slate-300">{jobAccounting.gpu_hours?.toFixed(2)} h</span>
                         </div>
                         <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 px-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-[6px]">
                           <span className="text-xs text-slate-800 dark:text-slate-200">Wall Time</span>
                           <span className="text-xs text-slate-600 dark:text-slate-300">{jobAccounting.wall_time_seconds} s</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".txt,.fasta,.fa"
                  onChange={handleFileUpload}
                  id="file-upload"
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Cargar .fasta
                </label>

                <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                  Formatos aceptados: .fasta, .fa, .txt
                </span>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="submit"
                  disabled={isSubmitting || !fastaContent.trim() || customResourceWarnings.length > 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <Dna className="w-3.5 h-3.5" />
                      Ejecutar AlphaFold
                    </>
                  )}
                </button>
                {isSubmitting && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    La API puede tardar hasta 30 s en responder si llevaba inactiva.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Info footer */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
        La secuencia se enviará al clúster <strong className="text-slate-500 dark:text-slate-400">CESGA FinisTerrae III</strong> para predicción con AlphaFold 2. La API puede tardar 20–30 s en responder si estaba inactiva.
      </p>

      {/* Flotante de Pruebas */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 p-3 bg-amber-50 dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-600 rounded-lg shadow-xl max-w-[200px] text-xs opacity-70 hover:opacity-100 transition-opacity">
        <div className="text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <FlaskConical className="w-3 h-3" />
          Debug: Ejemplos
        </div>
        <p className="text-[9px] text-slate-500 leading-tight mb-1">Uso exclusivo pruebas locales. Ignorar en PROD.</p>
        {PROTEIN_SAMPLES.map((protein) => (
          <button
            key={protein.tag}
            type="button"
            onClick={() => handleChipClick(protein)}
            className="text-left px-2 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 font-medium truncate"
          >
            {protein.name}
          </button>
        ))}
      </div>
    </div>
  );
}
