import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Dna, Zap, Bot, Share2, ArrowRight, Upload, Cpu, Eye, Clock, Server, Check } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/app");
    } catch (error) {
      console.error("Error en login:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-primary-500/30">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 lg:px-12 border-b border-white/5 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
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

      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="z-10 max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
            <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse"></span>
            Hackathon Impacthon 2026
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-tight">
            AlphaFold en tu navegador,<br/>sin abrir la terminal.
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Predice, dobla y analiza estructuras proteicas delegando el cómputo masivo al clúster del <b className="text-white">CESGA</b>. Limpiador FASTA inteligente, matrices PAE reactivas y un Copiloto IA integrado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 active:scale-95"
            >
              Comenzar gratis con Google
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / STACK ── */}
      <section className="border-y border-white/5 py-8 px-4">
        <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-8 font-medium">Potenciado por tecnología de clase mundial</p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 max-w-4xl mx-auto">
          {[
            { label: "CESGA FinisTerrae III", sub: "Cómputo HPC" },
            { label: "AlphaFold 2", sub: "Motor de predicción" },
            { label: "Google Gemini", sub: "IA conversacional" },
            { label: "n8n Orchestrator", sub: "Automatización AI" },
            { label: "Firebase", sub: "Auth + Cloud DB" },
          ].map((tech) => (
            <div key={tech.label} className="text-center">
              <p className="text-sm font-semibold text-slate-200">{tech.label}</p>
              <p className="text-xs text-slate-500">{tech.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">Tres pasos. Cero instalaciones.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Todo el ciclo de predicción estructural gestionado por LocalFold. El investigador solo aporta la ciencia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Línea conectora horizontal (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.6%)] right-[calc(16.6%)] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

            {[
              {
                step: "01",
                icon: <Upload className="w-6 h-6" />,
                title: "Sube tu FASTA",
                desc: "Pega la secuencia o arrastra el fichero. Nuestro motor la limpia y valida automáticamente antes de tocar el clúster.",
                color: "text-amber-400"
              },
              {
                step: "02",
                icon: <Cpu className="w-6 h-6" />,
                title: "El CESGA computa",
                desc: "LocalFold negocia con Slurm, reserva nodos GPU A100 y ejecuta AlphaFold 2 en el FinisTerrae III de forma transparente.",
                color: "text-primary-400"
              },
              {
                step: "03",
                icon: <Eye className="w-6 h-6" />,
                title: "Analiza los resultados",
                desc: "Visor 3D interactivo, heatmap PAE y el Bio-Copilot IA que traduce los datos técnicos a conclusiones biológicas accionables.",
                color: "text-emerald-400"
              }
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 ${item.color} relative z-10`}>
                  {item.icon}
                  <span className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-400" />}
              title="UX Zero-Friction"
              desc="Valida tu secuencia FASTA instantáneamente. Sin scripts, sin SSH. Pegar y doblar."
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
        </div>
      </section>

      {/* ── COMPARATIVA CESGA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">Computación local vs CESGA HPC</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Las GPUs A100 del FinisTerrae III no son un lujo, son una necesidad para la biología moderna. Con LocalFold son accesibles para todos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Laptop */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Server className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-slate-300">Portátil de laboratorio</span>
              </div>
              <ul className="space-y-4">
                {[
                  { text: "Hasta 3 semanas de cómputo por predicción", bad: true },
                  { text: "Requiere GPU NVIDIA + 3 TB en disco", bad: true },
                  { text: "Configuración Linux + Docker + 20 dependencias", bad: true },
                  { text: "Uso del 100% de CPU durante días", bad: true },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* CESGA */}
            <div className="bg-primary-950/30 border border-primary-800/40 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-xl">Recomendado</div>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-primary-400" />
                <span className="font-semibold text-primary-300">LocalFold + CESGA HPC</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Predicción completa en minutos, no semanas",
                  "Sin instalaciones. 100% desde el navegador",
                  "Nodos GPU A100 dedicados en FinisTerrae III",
                  "Deduplicación global: si alguien ya lo calculó, respuesta instantánea",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE / TESTIMONIAL ── */}
      <section className="py-16 px-4 border-y border-white/5">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-medium">Por qué lo construimos</p>
          <blockquote className="text-2xl lg:text-3xl font-bold text-white leading-relaxed">
            "El Premio Nobel de AlphaFold deberían poder aprovecharlo todos los investigadores. <span className="text-primary-400">No solo los que saben Linux.</span>"
          </blockquote>
          <p className="text-slate-400 text-sm">— Equipo LocalFold, Impacthon 2026</p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-extrabold text-white">¿Listo para plegar proteínas?</h2>
          <p className="text-slate-400">Accede con tu cuenta de Google. Sin tarjeta de crédito. Sin instalaciones. El CESGA hace la computación, tú haces la ciencia.</p>
          <button 
            onClick={handleLogin}
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 active:scale-95"
          >
            Comenzar gratis con Google
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-600">Proyecto desarrollado durante el Impacthon 2026 en colaboración con el CESGA.</p>
        </div>
      </section>

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
