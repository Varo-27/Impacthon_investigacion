import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  Dna, Zap, Bot, Share2, ArrowRight, Upload, Cpu, Eye,
  Server, Check, Users, BrainCircuit, FolderOpen, Bell,
  FlaskConical, AtSign, Shield, BarChart3,
} from "lucide-react";
import logoUrl from "../assets/logo.png";

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <nav className={`flex justify-between items-center p-6 lg:px-12 fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-950/80 backdrop-blur-md border-b border-white/5" : "bg-transparent"}`}>
        <div className="flex items-center gap-2">
          <img src={logoUrl} className="w-8 h-8 object-contain" alt="LocalFold" />
          <span className="text-xl font-bold tracking-tight text-white">Local<span className="text-primary-500">Fold</span></span>
        </div>
        <button
          onClick={handleLogin}
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Iniciar sesión →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-40 pb-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary-600/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="z-10 max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
            <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            Impacthon 2026 · CESGA FinisTerrae III
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-tight">
            AlphaFold en tu navegador,<br />sin abrir la terminal.
          </h1>

          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Predice estructuras proteicas delegando el cómputo masivo al clúster del <strong className="text-white">CESGA</strong>. Analiza resultados con IA especializada y colabora con tu equipo en tiempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(99,102,241,0.6)] transition-all hover:scale-105 active:scale-95"
            >
              Empezar con Google
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ── */}
      <section className="border-y border-white/5 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500×", label: "más rápido que cómputo local", color: "text-primary-400" },
            { value: "< 1 min", label: "de configuración para empezar", color: "text-emerald-400" },
            { value: "0", label: "instalaciones requeridas", color: "text-amber-400" },
            { value: "A100", label: "GPUs del FinisTerrae III", color: "text-rose-400" },
          ].map((m) => (
            <div key={m.label}>
              <p className={`text-3xl lg:text-4xl font-extrabold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STACK ── */}
      <section className="py-8 px-4">
        <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-6 font-medium">Potenciado por</p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 max-w-4xl mx-auto">
          {[
            { label: "CESGA FinisTerrae III", sub: "HPC" },
            { label: "AlphaFold 2", sub: "Predicción" },
            { label: "Google Gemini 1.5 Pro", sub: "IA conversacional" },
            { label: "n8n", sub: "Orquestación AI" },
            { label: "Firebase", sub: "Auth + DB" },
            { label: "pdbe-molstar", sub: "Visor 3D" },
          ].map((t) => (
            <div key={t.label} className="text-center">
              <p className="text-sm font-semibold text-slate-300">{t.label}</p>
              <p className="text-[11px] text-slate-600">{t.sub}</p>
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
            <div className="hidden md:block absolute top-10 left-[calc(16.6%)] right-[calc(16.6%)] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            {[
              {
                step: "01", icon: <Upload className="w-6 h-6" />, color: "text-amber-400",
                title: "Sube tu FASTA",
                desc: "Pega la secuencia o arrastra el fichero. El nombre se detecta automáticamente del header UniProt. Sin scripts, sin SSH.",
              },
              {
                step: "02", icon: <Cpu className="w-6 h-6" />, color: "text-primary-400",
                title: "El CESGA computa",
                desc: "LocalFold negocia con Slurm, reserva nodos GPU A100 y ejecuta AlphaFold 2 en el FinisTerrae III de forma transparente.",
              },
              {
                step: "03", icon: <Eye className="w-6 h-6" />, color: "text-emerald-400",
                title: "Analiza y colabora",
                desc: "Visor 3D interactivo, heatmap PAE, análisis IA con ProteIA y workspace colaborativo para compartir con tu equipo.",
              },
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

      {/* ── FEATURES ── */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Todo lo que necesita un laboratorio moderno</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Desde la predicción hasta la publicación, sin cambiar de herramienta.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<Bot className="w-6 h-6 text-emerald-400" />}
              title="ProteIA — Copiloto IA"
              desc="Lee pLDDT, solubilidad e inestabilidad y te traduce los datos técnicos a conclusiones biológicas accionables en lenguaje natural."
            />
            <FeatureCard
              icon={<BrainCircuit className="w-6 h-6 text-primary-400" />}
              title="ProteIA — Asistente RAG"
              desc='IA especializada en biología estructural. Escribe @ para adjuntar el contexto de cualquier predicción propia y obtener análisis personalizados.'
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-blue-400" />}
              title="Proyectos colaborativos"
              desc="Crea workspaces de equipo, invita colaboradores por email y centraliza todas las predicciones del grupo en un solo lugar."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-amber-400" />}
              title="Visor 3D + PAE heatmap"
              desc="Estructura molecular interactiva con coloreado por confianza y matriz de error de alineación predicho para análisis de dominios."
            />
            <FeatureCard
              icon={<Bell className="w-6 h-6 text-rose-400" />}
              title="Notificaciones en tiempo real"
              desc="Recibe alertas del sistema cuando una predicción se completa o falla, aunque tengas la pestaña en segundo plano."
            />
            <FeatureCard
              icon={<FlaskConical className="w-6 h-6 text-violet-400" />}
              title="Informe PDF automático"
              desc="Genera en un clic un informe con estructura 3D, métricas de confianza, propiedades biológicas y análisis de ProteIA listo para publicar."
            />
          </div>
        </div>
      </section>

      {/* ── COMPARATIVA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">Cómputo local vs CESGA HPC</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Las GPUs A100 del FinisTerrae III no son un lujo, son una necesidad para la biología moderna. Con LocalFold son accesibles para todos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Server className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-slate-300">Portátil de laboratorio</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Hasta 3 semanas de cómputo por predicción",
                  "Requiere GPU NVIDIA + 3 TB en disco",
                  "Configuración Linux + Docker + 20 dependencias",
                  "Bloquea el equipo durante días",
                  "Sin interfaz — solo línea de comandos",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className="text-red-500 mt-0.5 shrink-0">✕</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

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
                  "Interfaz visual con IA integrada",
                  "Colaboración de equipo incluida",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUIÉN ── */}
      <section className="py-16 px-4 sm:px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Diseñado para investigadores reales</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">LocalFold no asume que sabes Linux. Asume que sabes biología.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                who: "Bioquímicos y biólogos moleculares",
                icon: <FlaskConical className="w-5 h-5 text-emerald-400" />,
                use: "Predice la estructura de tu proteína de interés sin tocar la terminal. ProteIA interpreta los resultados en el contexto de tu experimento.",
              },
              {
                who: "Grupos de investigación",
                icon: <FolderOpen className="w-5 h-5 text-blue-400" />,
                use: "Centraliza todas las predicciones del lab en proyectos colaborativos. Cada miembro ve los resultados del equipo en tiempo real.",
              },
              {
                who: "Usuarios de CESGA",
                icon: <Shield className="w-5 h-5 text-amber-400" />,
                use: "Aprovecha al máximo tu asignación de horas de cómputo sin configurar entornos. LocalFold gestiona Slurm y los recursos GPU por ti.",
              },
            ].map((item) => (
              <div key={item.who} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  {item.icon}
                  <h3 className="font-bold text-white text-sm">{item.who}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{item.use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RAG HIGHLIGHT ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-primary-950/40 border border-primary-800/30 rounded-3xl p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-900/50 border border-primary-700/50 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-primary-400 uppercase tracking-widest mb-2">Nuevo</p>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-4">ProteIA — tu asistente con contexto propio</h2>
                <p className="text-slate-300 leading-relaxed mb-6">
                  Especializada en biología estructural con base de conocimiento local. Escribe <strong className="text-primary-300">@</strong> seguido del nombre de cualquier predicción o proyecto para adjuntar sus datos como contexto — ProteIA analiza tus resultados concretos, no respuestas genéricas.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: <AtSign className="w-3.5 h-3.5" />, text: "@ para referenciar predicciones" },
                    { icon: <FolderOpen className="w-3.5 h-3.5" />, text: "Contexto de proyectos completos" },
                    { icon: <BrainCircuit className="w-3.5 h-3.5" />, text: "Base de conocimiento especializada" },
                  ].map((t) => (
                    <span key={t.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-900/50 border border-primary-700/50 text-primary-300 text-xs font-medium">
                      {t.icon}{t.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="py-16 px-4 border-y border-white/5">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-medium">Por qué lo construimos</p>
          <blockquote className="text-2xl lg:text-3xl font-bold text-white leading-relaxed">
            "El Premio Nobel de AlphaFold debería poder aprovecharlo <span className="text-primary-400">cualquier investigador</span>, no solo los que saben Linux."
          </blockquote>
          <p className="text-slate-400 text-sm">— Equipo LocalFold, Impacthon 2026</p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-extrabold text-white">¿Listo para plegar proteínas?</h2>
          <p className="text-slate-400">Accede con tu cuenta de Google. Sin tarjeta de crédito. Sin instalaciones.<br />El CESGA hace la computación, tú haces la ciencia.</p>
          <button
            onClick={handleLogin}
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] transition-all hover:scale-105 active:scale-95"
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
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl text-left hover:border-slate-700 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center mb-4 border border-slate-700/50">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
