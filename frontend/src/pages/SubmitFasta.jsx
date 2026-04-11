import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertTriangle, FlaskConical } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const PROTEIN_SAMPLES = [
  {
    name: "Ubiquitina",
    tag: "UBQ",
    color: "amber",
    fasta: `>sp|P0CG48|UBC_HUMAN Polyubiquitin-C OS=Homo sapiens
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG`
  },
  {
    name: "GFP",
    tag: "GFP",
    color: "emerald",
    fasta: `>sp|P42212|GFP_AEQVI Green fluorescent protein OS=Aequorea victoria
MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTLTYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITLGMDELYK`
  },
  {
    name: "p53",
    tag: "P53",
    color: "red",
    fasta: `>sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens
MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYPQGLNGTVNLFRNLNSSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAHATEESGDSRAHSSYLKTKKGQSTSRHKKLMFKTEGPDSD`
  },
  {
    name: "SOD1",
    tag: "SOD1",
    color: "blue",
    fasta: `>sp|P00441|SODC_HUMAN Superoxide dismutase [Cu-Zn] OS=Homo sapiens
MATKAVCVLKGDGPVQGIINFEQKESNGPVKVWGSIKGLTEGLHGFHVHEFGDNTAGCTSAGPHFNPLSRKHGGPKDEERHVGDLGNVTADKDGVADVSIEDSVISLSGDHCIIGRTLVVHEKADDLGKGGNEESTKTGNAGSRLACGVIGIAQ`
  },
  {
    name: "Insulina",
    tag: "INS",
    color: "purple",
    fasta: `>sp|P01308|INS_HUMAN Insulin OS=Homo sapiens
MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN`
  },
];

const CHIP_COLORS = {
  amber:   "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-900/40",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/40",
  red:     "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50 dark:hover:bg-red-900/40",
  blue:    "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-900/40",
  purple:  "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50 dark:hover:bg-purple-900/40",
};

const CHIP_ACTIVE_COLORS = {
  amber:   "ring-2 ring-amber-400 dark:ring-amber-500",
  emerald: "ring-2 ring-emerald-400 dark:ring-emerald-500",
  red:     "ring-2 ring-red-400 dark:ring-red-500",
  blue:    "ring-2 ring-blue-400 dark:ring-blue-500",
  purple:  "ring-2 ring-purple-400 dark:ring-purple-500",
};

export default function SubmitFasta() {
  const [fastaContent, setFastaContent] = useState("");
  const [activeChip, setActiveChip] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChipClick = (protein) => {
    if (activeChip === protein.tag) {
      setFastaContent("");
      setActiveChip(null);
    } else {
      setFastaContent(protein.fasta);
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
      // Formatear proactivamente por si el usuario inserta " \n " literalmente en vez de un salto real
      const cleanFasta = fastaContent.replace(/\\n/g, '\n');

      // Consumiendo la API Real de Mock del entorno
      const response = await fetch("https://api-mock-cesga.onrender.com/jobs/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          fasta_sequence: cleanFasta,
          fasta_filename: "sequence.fasta"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = "Error desconocido al procesar la secuencia";
        if (data.detail) {
          errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
        }
        throw new Error(errorMsg);
      }

      // Extraer nombre del FASTA si lo tiene (>nombre...)
      const lines = cleanFasta.split('\n');
      let name = "Secuencia Nueva";
      if (lines[0].startsWith('>')) {
        name = lines[0].substring(1, 30) + (lines[0].length > 30 ? "..." : "");
      }

      // GUARDAR EN FIRESTORE (Google Cloud)
      // Vinculamos el trabajo al ID único del usuario logueado
      if (auth.currentUser) {
        await addDoc(collection(db, "jobs"), {
          userId: auth.currentUser.uid,
          cesgaJobId: data.job_id,
          proteinName: name,
          status: data.status || "PENDING",
          createdAt: serverTimestamp(),
          fastaContent: cleanFasta // Guardamos la secuencia por seguridad/historial
        });
        console.log("Trabajo guardado en Firestore con éxito ✅");
      } else {
        console.warn("No hay usuario autenticado. El trabajo se ha enviado pero no se verá en tu historial.");
      }

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      setFastaContent("");

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
      reader.onload = (rev) => {
        setFastaContent(rev.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Nueva Predicción de Estructura
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Introduce tu secuencia de aminoácidos en formato FASTA. Pasará al CESGA 
          para la predicción 3D con nodos de inferencia.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium text-sm">Error en la API: {errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Proteínas de ejemplo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-slate-400" />
              Proteínas de ejemplo
            </label>
            <div className="flex flex-wrap gap-2">
              {PROTEIN_SAMPLES.map((protein) => (
                <button
                  key={protein.tag}
                  type="button"
                  onClick={() => handleChipClick(protein)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${CHIP_COLORS[protein.color]} ${activeChip === protein.tag ? CHIP_ACTIVE_COLORS[protein.color] : ""}`}
                >
                  <span className="font-mono text-[10px] font-bold opacity-60">{protein.tag}</span>
                  {protein.name}
                  {activeChip === protein.tag && <CheckCircle className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Haz clic en una proteína para rellenar la secuencia automáticamente. Vuelve a hacer clic para limpiar.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Secuencia FASTA
            </label>
            <div className="relative">
              <textarea
                value={fastaContent}
                onChange={handleTextareaChange}
                placeholder=">sp|P02769|ALBU_BOVIN Serum albumin OS=Bos taurus OX=9913\nMKWVTFISLLLLFSSAYSRGVFRR..."
                className="w-full h-64 p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-slate-200 resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-2">
            <div className="relative flex-1 w-full sm:w-auto">
              <input
                type="file"
                accept=".txt,.fasta,.fa"
                onChange={handleFileUpload}
                id="file-upload"
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400 cursor-pointer transition-colors"
              >
                <UploadCloud className="w-5 h-5" />
                Cargar fichero .fasta
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !fastaContent.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Conectando API...
                </>
              ) : submitted ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  ¡Enviado!
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Ejecutar AlphaFold
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300 rounded-xl text-sm leading-relaxed">
        <strong>Conectado a la API Simuladora:</strong> Una vez envíes la secuencia, ve a la pestaña <strong>Mis Trabajos</strong> para consultar en tiempo real su estado en la cola del clúster (PENDING, RUNNING...). Nota: La API puede tardar 20-30s en despertar si estaba dormida.
      </div>
    </div>
  );
}
