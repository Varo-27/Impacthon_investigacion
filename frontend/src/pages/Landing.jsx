import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  Bot, ArrowRight, Upload, Cpu, Eye,
  Users, BrainCircuit, Bell,
  FlaskConical, BarChart3,
} from "lucide-react";
import logoUrl from "../assets/logo.png";
import heroVideo from "../assets/hero.mp4";

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
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-950/80 backdrop-blur-md border-b border-white/5" : "bg-transparent"}`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} className="w-8 h-8 object-contain" alt="OmicaFold" />
            <span className="text-xl font-bold tracking-tight text-white">Omica<span className="text-primary-500">Fold</span></span>
          </div>
          <button
            onClick={handleLogin}
            className="text-sm font-medium text-slate-300 hover:text-white transition-all duration-200 ease-in-out active:scale-[0.98]"
          >
            Iniciar sesión →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 relative overflow-hidden min-h-screen">
        {/* Video background */}
        <video
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-8">
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
              className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(99,102,241,0.6)] hover:scale-105 transition-all duration-200 ease-in-out active:scale-[0.98]"
            >
              Empezar con Google
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── STACK ── */}
      <section className="py-10 px-4 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] text-slate-600 uppercase tracking-widest mb-6 font-medium">Construido sobre</p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {[
              { label: "CESGA FinisTerrae III", color: "border-blue-500/30 text-blue-300" },
              { label: "AlphaFold 2", color: "border-emerald-500/30 text-emerald-300" },
              { label: "Google Gemini", color: "border-primary-500/30 text-primary-300" },
              { label: "n8n", color: "border-orange-500/30 text-orange-300" },
              { label: "Firebase", color: "border-amber-500/30 text-amber-300" },
              { label: "pdbe-molstar", color: "border-rose-500/30 text-rose-300" },
            ].map((t) => (
              <span key={t.label} className={`px-4 py-1.5 rounded-full border bg-white/5 text-xs font-medium backdrop-blur-sm ${t.color}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs text-primary-400 uppercase tracking-widest font-semibold mb-3">El flujo</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white">Tres pasos. Cero instalaciones.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: <Upload className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", title: "Sube tu FASTA", desc: "Pega la secuencia o arrastra el fichero. El nombre se detecta automáticamente del header UniProt." },
              { step: "02", icon: <Cpu className="w-5 h-5" />, color: "text-primary-400", bg: "bg-primary-500/10 border-primary-500/20", title: "El CESGA computa", desc: "OmicaFold reserva nodos GPU A100 y ejecuta AlphaFold 2 en el FinisTerrae III de forma transparente." },
              { step: "03", icon: <Eye className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", title: "Analiza y colabora", desc: "Visor 3D con pLDDT, heatmap PAE, análisis IA con ProteIA y workspace colaborativo en tiempo real." },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col gap-5 p-8 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-colors">
                <span className="absolute top-6 right-6 text-7xl font-black text-white/[0.04] leading-none select-none">{item.step}</span>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.bg} ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-primary-400 uppercase tracking-widest font-semibold mb-3">Capacidades</p>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white">Todo en una sola herramienta</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={<Bot className="w-6 h-6 text-emerald-400" />} title="ProteIA — Copiloto IA" desc="Lee pLDDT, solubilidad e inestabilidad y traduce los datos técnicos a conclusiones biológicas accionables." accent="from-emerald-500" />
            <FeatureCard icon={<BrainCircuit className="w-6 h-6 text-primary-400" />} title="ProteIA — Asistente RAG" desc="Escribe @ para adjuntar el contexto de cualquier predicción. Análisis personalizados, no respuestas genéricas." accent="from-primary-500" />
            <FeatureCard icon={<Users className="w-6 h-6 text-blue-400" />} title="Proyectos colaborativos" desc="Invita colaboradores por email y centraliza todas las predicciones del grupo en un workspace compartido." accent="from-blue-500" />
            <FeatureCard icon={<BarChart3 className="w-6 h-6 text-amber-400" />} title="Visor 3D + PAE heatmap" desc="Estructura molecular interactiva con coloreado por confianza y matriz de error de alineación predicho." accent="from-amber-500" />
            <FeatureCard icon={<Bell className="w-6 h-6 text-rose-400" />} title="Notificaciones en tiempo real" desc="Recibe alertas cuando una predicción completa o falla, aunque tengas la pestaña en segundo plano." accent="from-rose-500" />
            <FeatureCard icon={<FlaskConical className="w-6 h-6 text-violet-400" />} title="Informe PDF automático" desc="Genera en un clic un informe con estructura 3D, métricas de confianza y análisis de ProteIA." accent="from-violet-500" />
          </div>
        </div>
      </section>

      {/* ── PROTEIA HIGHLIGHT ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-primary-800/30 bg-gradient-to-br from-slate-900 via-primary-950/20 to-slate-900 p-10 md:p-14">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-600/8 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-600/8 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-start">
              {/* Left: copy */}
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
                  Un asistente que conoce<br /><span className="text-primary-300">tus</span> proteínas
                </h2>
                <p className="text-slate-400 leading-relaxed max-w-md">
                  Menciona <code className="text-primary-300 bg-primary-900/40 px-1.5 py-0.5 rounded text-sm">@proyecto</code> o <code className="text-primary-300 bg-primary-900/40 px-1.5 py-0.5 rounded text-sm">@proteína</code> para que ProteIA analice tus datos reales — no literatura genérica. Desde comparar riesgos entre candidatos hasta identificar dianas terapéuticas.
                </p>
              </div>
              {/* Right: fake chat */}
              <div className="w-full lg:w-[440px] shrink-0 rounded-2xl bg-slate-950/80 border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
                  <BrainCircuit className="w-4 h-4 text-primary-400" />
                  <span className="text-xs font-semibold text-slate-300">ProteIA</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />en línea
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-primary-600/80 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[90%] text-xs leading-relaxed">
                      <span className="text-primary-200 font-mono font-semibold">@Proyecto_ELA</span> de las 5 proteínas predichas, ¿cuál representa mayor riesgo de agregación patológica?
                    </div>
                  </div>
                  {/* ProteIA response */}
                  <div className="flex justify-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary-900 border border-primary-700 flex items-center justify-center shrink-0 mt-0.5">
                      <BrainCircuit className="w-3 h-3 text-primary-400" />
                    </div>
                    <div className="bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] text-xs leading-relaxed space-y-2">
                      <p><span className="text-rose-400 font-semibold">TDP-43 (RRM2)</span> es la candidata de mayor riesgo. Presenta un <span className="text-amber-400 font-medium">pLDDT medio de 58.4</span> con una región intrínsecamente desordenada de 156 residuos en el C-terminal y alta exposición de parches hidrofóbicos.</p>
                      <p className="text-slate-400">Este patrón es el mecanismo central de toxicidad en ELA y FTLD. Las otras cuatro muestran estructuras más compactas con menor propensión a nucleación.</p>
                      <p className="text-primary-300 font-medium">Recomiendo priorizar TDP-43 como diana terapéutica.</p>
                    </div>
                  </div>
                  {/* Typing indicator */}
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-1">¿Listo para predecir tu primera proteína?</h2>
            <p className="text-slate-500 text-sm">Sin instalaciones · Sin terminal · CESGA FinisTerrae III</p>
          </div>
          <button
            onClick={handleLogin}
            className="shrink-0 flex items-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-sm shadow-[0_0_30px_-8px_rgba(99,102,241,0.5)] hover:scale-105 whitespace-nowrap transition-all duration-200 ease-in-out active:scale-[0.98]"
          >
            Empezar con Google
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src={logoUrl} className="w-6 h-6 object-contain" alt="OmicaFold" />
            <span className="font-bold text-white text-sm">Omica<span className="text-primary-500">Fold</span></span>
            <span className="text-slate-700 text-sm">—</span>
            <span className="text-slate-500 text-xs">Predicción proteica en el navegador</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-xs text-slate-600">
            <span>Impacthon 2026</span>
            <span className="hidden sm:block w-px h-3 bg-slate-800" />
            <span>GDG Santiago de Compostela</span>
            <span className="hidden sm:block w-px h-3 bg-slate-800" />
            <span>CESGA FinisTerrae III</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

function useCountUp(target, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || target === 0) { setCount(target); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return count;
}

function MetricCard({ value, suffix }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1800, started);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <span ref={ref}>{count}{suffix}</span>;
}

function MetricsSection() {
  const metrics = [
    { value: 500, suffix: "×", label: "más rápido que cómputo local", from: "#6366f1", to: "#a5b4fc" },
    { value: 1, prefix: "< ", suffix: " min", label: "de configuración", from: "#34d399", to: "#6ee7b7" },
    { value: 0, suffix: "", label: "instalaciones requeridas", from: "#fbbf24", to: "#fde68a" },
    { value: 100, suffix: "%", label: "desde el navegador", from: "#f87171", to: "#fca5a5" },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
          {metrics.map((m, i) => (
            <div key={m.label} className={`flex flex-col items-center text-center gap-2 px-6 py-4 ${i % 2 === 0 ? "" : ""}`}>
              <span
                className="text-6xl lg:text-7xl font-black tracking-tighter leading-none"
                style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {m.prefix}<MetricCard value={m.value} suffix={m.suffix} from={m.from} to={m.to} />
              </span>
              <p className="text-sm text-slate-500 leading-snug max-w-[130px]">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, accent = "from-primary-500" }) {
  return (
    <div className="group relative bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-left hover:border-slate-600 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 overflow-hidden">
      {/* colored top line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="w-11 h-11 rounded-xl bg-slate-800/80 flex items-center justify-center mb-4 border border-slate-700/50 group-hover:bg-slate-800 transition-colors">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
