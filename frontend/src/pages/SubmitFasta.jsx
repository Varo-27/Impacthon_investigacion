import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, FlaskConical, Dna, ArrowRight, FolderOpen } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

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
  if (!header.startsWith(">")) return "Secuencia nueva";
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

export default function SubmitFasta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || null;
  const [projectName, setProjectName] = useState(null);
  const [fastaContent, setFastaContent] = useState("");
  const [customName, setCustomName] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fastaContent.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSubmitted(false);

    try {
      const cleanFasta = fastaContent.replace(/\\n/g, "\n");

      const response = await fetch("https://api-mock-cesga.onrender.com/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ fasta_sequence: cleanFasta, fasta_filename: "sequence.fasta" }),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = "Error desconocido al procesar la secuencia";
        if (data.detail) msg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        throw new Error(msg);
      }

      const lines = cleanFasta.split("\n");
      const autoName = lines[0].startsWith(">") ? parseFastaName(lines[0]) : "Secuencia nueva";
      const name = customName.trim() || autoName;

      if (auth.currentUser) {
        await addDoc(collection(db, "jobs"), {
          userId: auth.currentUser.uid,
          cesgaJobId: data.job_id,
          proteinName: name,
          status: data.status || "PENDING",
          createdAt: serverTimestamp(),
          fastaContent: cleanFasta,
          ...(projectId ? { projectId } : {}),
        });
      }

      setSubmitted(true);
      setFastaContent("");
      setActiveChip(null);
      setCustomName("");
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
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

  const lineCount = fastaContent ? fastaContent.split("\n").length : 0;
  const aaCount = fastaContent
    ? fastaContent.split("\n").filter((l) => !l.startsWith(">")).join("").replace(/\s/g, "").length
    : 0;

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
      {submitted && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Secuencia enviada. Ve a <button onClick={() => navigate(projectId ? `/app/projects/${projectId}` : "/app/jobs")} className="underline font-medium mx-1">{projectId ? "el proyecto" : "Mis trabajos"}</button> para seguir el progreso.
        </div>
      )}

      {/* Main panel */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">

          {/* Sample proteins */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 mb-2.5">
              <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Proteínas de ejemplo
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROTEIN_SAMPLES.map((protein) => (
                <button
                  key={protein.tag}
                  type="button"
                  onClick={() => handleChipClick(protein)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                    activeChip === protein.tag
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400"
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-60">{protein.tag}</span>
                  {protein.name}
                  {activeChip === protein.tag && <CheckCircle2 className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre personalizado */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Nombre</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={
                fastaContent
                  ? parseFastaName(fastaContent.split("\n")[0]) + " (autodetectado)"
                  : "Opcional — se extrae del header FASTA"
              }
              className="flex-1 text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
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
                  {aaCount} aa · {lineCount} líneas
                </span>
              </div>
            )}
          </div>

          {/* Footer bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">

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

            <button
              type="submit"
              disabled={isSubmitting || !fastaContent.trim()}
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
          </div>
        </div>
      </form>

      {/* Info footer */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
        La secuencia se enviará al clúster <strong className="text-slate-500 dark:text-slate-400">CESGA FinisTerrae III</strong> para predicción con AlphaFold 2. La API puede tardar 20–30 s en responder si estaba inactiva.
      </p>
    </div>
  );
}
