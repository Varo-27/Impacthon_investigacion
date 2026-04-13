import { useState } from "react";
import { FlaskConical, Stethoscope, Pill, GraduationCap, Check, Info, Map } from "lucide-react";

const PROFILES = [
  { id: "researcher", icon: <FlaskConical className="w-6 h-6" />, label: "Investigador",    desc: "Biología molecular, bioquímica, genómica",    color: "border-primary-500 bg-primary-500/10 text-primary-300", check: "bg-primary-500" },
  { id: "clinical",   icon: <Stethoscope className="w-6 h-6" />,  label: "Clínico",          desc: "Aplicación médica, diagnóstico, terapia",      color: "border-emerald-500 bg-emerald-500/10 text-emerald-300", check: "bg-emerald-500" },
  { id: "drug",       icon: <Pill className="w-6 h-6" />,         label: "Drug Discovery",   desc: "Targets, ADMET, candidatos farmacológicos",    color: "border-amber-500 bg-amber-500/10 text-amber-300",       check: "bg-amber-500" },
  { id: "student",    icon: <GraduationCap className="w-6 h-6" />, label: "Estudiante",       desc: "Aprendiendo y explorando",                     color: "border-violet-500 bg-violet-500/10 text-violet-300",    check: "bg-violet-500" },
];

const GOALS = [
  { id: "understand", label: "Entender qué está pasando biológicamente" },
  { id: "binding",    label: "Encontrar sitios de unión o dianas terapéuticas" },
  { id: "validate",   label: "Validar mis resultados experimentales" },
];

const WELCOME = {
  researcher: "Micafold está listo para investigadores.",
  clinical:   "Micafold está listo para clínicos.",
  drug:       "Micafold está listo para drug discovery.",
  student:    "Micafold está listo para aprender.",
};

// phase: "steps" → "tutorial-prompt" → "closing"
export default function OnboardingModal({ onComplete }) {
  const [step,         setStep]         = useState(1);
  const [type,         setType]         = useState(null);
  const [goal,         setGoal]         = useState(null);
  const [personalNote, setPersonalNote] = useState("");
  const [showInfo,     setShowInfo]     = useState(false);
  const [phase,        setPhase]        = useState("steps"); // "steps" | "tutorial-prompt" | "closing"

  const handleFinishStep2 = () => {
    const profile = { type, goal, personalNote: personalNote.trim() };
    localStorage.setItem("omicafold_profile", JSON.stringify(profile));
    setPhase("tutorial-prompt");
  };

  const handleTutorialChoice = (wantsTutorial) => {
    setPhase("closing");
    const profile = JSON.parse(localStorage.getItem("omicafold_profile"));
    setTimeout(() => onComplete({ ...profile, wantsTutorial }), 400);
  };

  const isClosing = phase === "closing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl transition-all duration-400 ${isClosing ? "scale-90 opacity-0" : "scale-100 opacity-100"}`}>

        {/* ── TUTORIAL PROMPT ── */}
        {phase === "tutorial-prompt" && (
          <div className="p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-primary-500/15 border border-primary-500/30 flex items-center justify-center mx-auto">
              <Map className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{WELCOME[type]}</p>
              <p className="text-slate-400 text-sm mt-2">¿Quieres que te guiemos por la aplicación?</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleTutorialChoice(false)}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Ya sé moverme
              </button>
              <button
                onClick={() => handleTutorialChoice(true)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors"
              >
                Ver tutorial →
              </button>
            </div>
          </div>
        )}

        {/* ── STEPS ── */}
        {phase === "steps" && (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                {[1, 2].map((s) => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? "bg-primary-500" : "bg-slate-700"}`} />
                ))}
              </div>
              <h2 className="text-lg font-bold text-white">
                {step === 1 ? "¿Cuál es tu perfil?" : "¿Qué buscas principalmente?"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {step === 1 ? "Para que Micafold hable tu idioma." : "Micafold adaptará sus respuestas a tu objetivo."}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">

              {/* Step 1 — Perfil */}
              {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {PROFILES.map((p) => {
                    const active = type === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setType(p.id)}
                        className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200 ${active ? p.color : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800"}`}
                      >
                        {active && (
                          <span className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center ${p.check}`}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                        <span className={active ? "" : "text-slate-500"}>{p.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">{p.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{p.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2 — Objetivo + Nota personal */}
              {step === 2 && (
                <div className="flex flex-col gap-2">
                  {GOALS.map((g) => {
                    const active = goal === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 ${active ? "border-primary-500 bg-primary-500/10" : "border-slate-700 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800"}`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${active ? "border-primary-500 bg-primary-500" : "border-slate-600"}`}>
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm leading-snug ${active ? "text-white font-medium" : "text-slate-300"}`}>
                          {g.label}
                        </span>
                      </button>
                    );
                  })}

                  {/* Nota personal */}
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="text-xs font-medium text-slate-400">Personalizar experiencia</label>
                      <div className="relative">
                        <button
                          onMouseEnter={() => setShowInfo(true)}
                          onMouseLeave={() => setShowInfo(false)}
                          className="text-slate-600 hover:text-slate-400 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        {showInfo && (
                          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-56 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 leading-relaxed shadow-xl z-10">
                            Micafold tendrá en cuenta lo que escribas aquí para personalizar cada respuesta según tu contexto de investigación.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 -mt-1" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 ml-auto">Opcional</span>
                    </div>
                    <textarea
                      value={personalNote}
                      onChange={(e) => setPersonalNote(e.target.value)}
                      placeholder="Ej: Estoy investigando proteínas relacionadas con ELA en modelos murinos..."
                      rows={2}
                      maxLength={300}
                      className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50 resize-none transition-colors"
                    />
                    {personalNote.length > 0 && (
                      <p className="text-[10px] text-slate-600 text-right mt-1">{personalNote.length}/300</p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-5 flex justify-between items-center">
                {step === 2 ? (
                  <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    ← Atrás
                  </button>
                ) : <span />}
                <button
                  onClick={step === 1 ? () => setStep(2) : handleFinishStep2}
                  disabled={step === 1 ? !type : !goal}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all duration-200 active:scale-[0.98]"
                >
                  {step === 1 ? "Siguiente →" : "Empezar"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
