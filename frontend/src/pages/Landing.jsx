import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Dna, Zap, Bot, Share2, ArrowRight } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Tras el login exitoso, saltamos al dashboard o herramienta
      navigate("/app");
    } catch (error) {
      console.error("Error en login:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-primary-500/30">
      
      {/* Navbar simplificado */}
      <nav className="flex justify-between items-center p-6 lg:px-12 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Dna className="w-8 h-8 text-primary-500" />
          <span className="text-xl font-bold tracking-tight text-white">Local<span className="text-primary-500">Fold</span></span>
        </div>
        <button 
          onClick={handleLogin}
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Iniciar sesión
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 relative overflow-hidden">
        
        {/* Decoración de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="z-10 max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-4">
            <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse"></span>
            Hackathon Impacthon 2026
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-tight">
            AlphaFold en tu navegador,<br/>sin abrir la terminal.
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Predice, dobla y analiza estructuras proteicas delegando la computación masiva al clúster del <b>CESGA</b>. Limpiador FASTA inteligente, matrices PAE reactivas y un Copiloto IA integrado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 active:scale-95"
            >
              Comenzar gratis con Google
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 mb-16 z-10 w-full px-4">
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-amber-400" />}
            title="UX Zero-Friction"
            desc="Valida tu secuencia FASTA instantáneamente. Sin scripts, sin configuraciones SSH. Pegar y doblar."
          />
          <FeatureCard 
            icon={<Bot className="w-6 h-6 text-emerald-400" />}
            title="Protein Copilot IA"
            desc="Un asistente conversacional nativo lee las métricas (pLDDT, solubilidad) y te traduce la ciencia al lenguaje de laboratorio."
          />
          <FeatureCard 
            icon={<Share2 className="w-6 h-6 text-blue-400" />}
            title="Comparte tus hallazgos"
            desc="Arquitectura Link-Stateless. Pasa la URL a tu colega y verá la reconstrucción 3D y el Heatmap al instante."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl text-left hover:border-slate-700 transition-colors backdrop-blur-sm">
      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 border border-slate-700/50">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
