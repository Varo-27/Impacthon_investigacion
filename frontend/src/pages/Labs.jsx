import { useState, useEffect } from 'react';
import { Beaker, BookOpen, CheckCircle, XCircle, ChevronRight, Info, ExternalLink } from 'lucide-react';

const LAB_PROTEINS = [
  {
    uniprotId: 'P69905',
    name: 'Hemoglobin subunit alpha',
    description: 'Proteína esencial para el transporte de oxígeno en la sangre.',
    questions: [
      {
        id: 1,
        text: "¿Cuál es el nombre del gen que codifica esta proteína?",
        options: ["HBA1", "INS", "GFP", "TP53"],
        correct: "HBA1"
      },
      {
        id: 2,
        text: "¿Cuál es la función principal de la Hemoglobina?",
        options: ["Digestión", "Respuesta inmune", "Transporte de oxígeno", "Estructura celular"],
        correct: "Transporte de oxígeno"
      },
      {
        id: 3,
        text: "¿Cuántos aminoácidos tiene esta subunidad?",
        options: ["110", "142", "238", "500"],
        correct: "142"
      }
    ]
  },
  {
    uniprotId: 'P01308',
    name: 'Insulin',
    description: 'Hormona clave en la regulación del metabolismo de la glucosa.',
    questions: [
      {
        id: 1,
        text: "¿Qué gen codifica la insulina humana?",
        options: ["INSR", "INS", "IGF1", "HBA1"],
        correct: "INS"
      },
      {
        id: 2,
        text: "¿Cuál es el organismo de origen de esta secuencia?",
        options: ["Escherichia coli", "Mus musculus", "Saccharomyces cerevisiae", "Homo sapiens"],
        correct: "Homo sapiens"
      },
      {
        id: 3,
        text: "¿Qué tipo de molécula es la insulina?",
        options: ["Lípido", "Carbohidrato", "Hormona peptídica", "Ácido nucleico"],
        correct: "Hormona peptídica"
      }
    ]
  },
  {
    uniprotId: 'P42212',
    name: 'Green Fluorescent Protein (GFP)',
    description: 'Proteína bioluminiscente ampliamente utilizada como marcador en biología molecular.',
    questions: [
      {
        id: 1,
        text: "¿De qué organismo se aisló originalmente la GFP?",
        options: ["Homo sapiens", "Aequorea victoria", "Arabidopsis thaliana", "Drosophila melanogaster"],
        correct: "Aequorea victoria"
      },
      {
        id: 2,
        text: "¿Qué estructura secundaria caracteriza al barril de la GFP?",
        options: ["Hélices alfa", "Giros beta", "Láminas beta", "Hélices de colágeno"],
        correct: "Láminas beta"
      },
      {
        id: 3,
        text: "¿Cuál es el color de emisión característico de esta proteína?",
        options: ["Azul", "Rojo", "Amarillo", "Verde"],
        correct: "Verde"
      }
    ]
  },
  {
    uniprotId: 'P04637',
    name: 'Cellular tumor antigen p53',
    description: 'Conocida como "el guardián del genoma", es crucial en la prevención del cáncer.',
    questions: [
      {
        id: 1,
        text: "¿Cuál es la función principal de la proteína p53?",
        options: ["Transporte de lípidos", "Supresor de tumores", "Contracción muscular", "Producción de energía"],
        correct: "Supresor de tumores"
      },
      {
        id: 2,
        text: "¿Qué proceso celular induce p53 ante un daño irreparable en el ADN?",
        options: ["Mitosis", "Apoptosis", "Glucólisis", "Traducción"],
        correct: "Apoptosis"
      },
      {
        id: 3,
        text: "¿En qué cromosoma humano se localiza el gen TP53?",
        options: ["Cromosoma 1", "Cromosoma 21", "Cromosoma 17", "Cromosoma X"],
        correct: "Cromosoma 17"
      },
      {
        id: 4,
        text: "¿Qué tipo de proteína es p53 estructuralmente?",
        options: ["Factor de transcripción", "Enzima cinasa", "Proteína de canal", "Receptor de membrana"],
        correct: "Factor de transcripción"
      },
      {
        id: 5,
        text: "¿Cuál es el gen que codifica esta proteína?",
        options: ["MDM2", "BRCA1", "TP53", "RB1"],
        correct: "TP53"
      }
    ]
  },
  {
    uniprotId: 'P01112',
    name: 'GTPase HRas',
    description: 'Proteína involucrada en la señalización celular que regula el crecimiento y la división.',
    questions: [
      {
        id: 1,
        text: "¿A qué familia de proteínas pertenece HRas?",
        options: ["Inmunoglobulinas", "Pequeñas GTPasas", "Colágenos", "Histonas"],
        correct: "Pequeñas GTPasas"
      },
      {
        id: 2,
        text: "¿Cuál es el cofactor necesario para la actividad de señalización de HRas?",
        options: ["ATP", "cAMP", "GTP", "NADH"],
        correct: "GTP"
      },
      {
        id: 3,
        text: "¿Dónde se localiza principalmente la proteína HRas funcional?",
        options: ["Núcleo", "Mitocondria", "Membrana plasmática", "Lisosoma"],
        correct: "Membrana plasmática"
      },
      {
        id: 4,
        text: "¿Qué ocurre cuando HRas tiene una mutación oncogénica común?",
        options: ["Se degrada rápidamente", "Queda bloqueada en estado activo", "Deja de unir nucleótidos", "Se vuelve una proteína soluble"],
        correct: "Queda bloqueada en estado activo"
      }
    ]
  },
  {
    uniprotId: 'P0DTC2',
    name: 'Spike glycoprotein (SARS-CoV-2)',
    description: 'Proteína de superficie del virus responsable de la entrada en las células humanas.',
    questions: [
      {
        id: 1,
        text: "¿A qué receptor humano se une la proteína Spike para iniciar la infección?",
        options: ["CD4", "ACE2", "Insulin Receptor", "Hemoglobina"],
        correct: "ACE2"
      },
      {
        id: 2,
        text: "¿Cuál es el dominio específico que interactúa directamente con el receptor celular?",
        options: ["NTD", "RBD", "S2 subunit", "FP"],
        correct: "RBD"
      },
      {
        id: 3,
        text: "¿En qué estado cuaternario se encuentra funcionalmente la proteína Spike?",
        options: ["Monómero", "Dímero", "Trímero", "Tetrámero"],
        correct: "Trímero"
      },
      {
        id: 4,
        text: "¿Qué modificación post-traduccional es masiva en la superficie de esta proteína?",
        options: ["Fosforilación", "Glicosilación", "Ubiquitinación", "Metilación"],
        correct: "Glicosilación"
      },
      {
        id: 5,
        text: "¿Qué enzima humana corta la proteína Spike (cleavage) para facilitar la fusión de membranas?",
        options: ["Amilasa", "Pepsina", "Furina / TMPRSS2", "Lipasa"],
        correct: "Furina / TMPRSS2"
      }
    ]
  }
];

export default function Labs() {
  const [selectedProtein, setSelectedProtein] = useState(null);
  const [proteinData, setProteinData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [feedback, setFeedback] = useState(null); // { correct: boolean, selected: string }
  
  // Persistencia: Cargar laboratorios completados desde localStorage
  const [completedLabs, setCompletedLabs] = useState(() => {
    const saved = localStorage.getItem('micafold_completed_labs');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('micafold_completed_labs', JSON.stringify(completedLabs));
  }, [completedLabs]);

  useEffect(() => {
    if (selectedProtein) {
      fetchAlphaFoldData(selectedProtein.uniprotId);
    }
  }, [selectedProtein]);

  const fetchAlphaFoldData = async (uniprotId) => {
    setLoading(true);
    try {
      const response = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`);
      const data = await response.json();
      setProteinData(data[0]);
    } catch (error) {
      console.error("Error fetching AlphaFold data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option) => {
    const isCorrect = option === selectedProtein.questions[currentQuestion].correct;
    setFeedback({ correct: isCorrect, selected: option });

    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentQuestion + 1 < selectedProtein.questions.length) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Al terminar, guardamos en el cache
        const finalScore = score + (isCorrect ? 1 : 0);
        setCompletedLabs(prev => ({
          ...prev,
          [selectedProtein.uniprotId]: {
            score: finalScore,
            total: selectedProtein.questions.length,
            date: new Date().toISOString()
          }
        }));
        setQuizFinished(true);
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setSelectedProtein(null);
    setProteinData(null);
    setCurrentQuestion(0);
    setScore(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">¡Laboratorio Completado!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Has respondido correctamente {score} de {selectedProtein.questions.length} preguntas sobre {selectedProtein.name}.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetQuiz}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Volver a Labs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedProtein) {
    return (
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
        {/* Panel Izquierdo: Información de la Proteína (AlphaFold Data) */}
        <div className="flex flex-col gap-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <button onClick={resetQuiz} className="text-sm text-primary-600 dark:text-primary-400 mb-4 flex items-center gap-1 hover:underline">
              ← Volver al listado
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Beaker className="w-6 h-6 text-primary-500" />
              {selectedProtein.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 italic">
              {selectedProtein.description}
            </p>

            {loading ? (
              <div className="mt-8 animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
              </div>
            ) : proteinData && (
              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Gen</p>
                    <p className="font-mono font-bold text-slate-900 dark:text-white">{proteinData.gene}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">UniProt ID</p>
                    <p className="font-mono font-bold text-slate-900 dark:text-white">{proteinData.uniprotAccession}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Organismo</p>
                    <p className="font-medium text-slate-900 dark:text-white">{proteinData.organismScientificName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Residuos</p>
                    <p className="font-bold text-slate-900 dark:text-white">{proteinData.uniprotEnd}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" />
                    Tip Científico
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Los datos mostrados provienen directamente de la API de AlphaFold DB. El visor 3D en la sección principal utiliza estos mismos modelos para el análisis estructural.
                  </p>
                </div>

                <a
                  href={`https://alphafold.ebi.ac.uk/entry/${proteinData.uniprotAccession}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Ver en AlphaFold DB <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Quiz */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Pregunta {currentQuestion + 1} de {selectedProtein.questions.length}
            </span>
            <div className="flex gap-1">
              {selectedProtein.questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-8 rounded-full ${
                    idx < currentQuestion ? 'bg-primary-500' :
                    idx === currentQuestion ? 'bg-primary-300 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">
            {selectedProtein.questions[currentQuestion].text}
          </h3>

          <div className="space-y-3 flex-1">
            {selectedProtein.questions[currentQuestion].options.map((option) => {
              const isSelected = feedback?.selected === option;
              const isCorrect = selectedProtein.questions[currentQuestion].correct === option;

              let buttonClass = "w-full p-4 rounded-xl border text-left transition-all duration-200 flex justify-between items-center ";

              if (feedback) {
                if (isCorrect) {
                  buttonClass += "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300";
                } else if (isSelected) {
                  buttonClass += "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300";
                } else {
                  buttonClass += "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600";
                }
              } else {
                buttonClass += "bg-white border-slate-200 text-slate-700 hover:border-primary-500 hover:bg-primary-50/30 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-500";
              }

              return (
                <button
                  key={option}
                  disabled={!!feedback}
                  onClick={() => handleAnswer(option)}
                  className={buttonClass}
                >
                  <span className="font-medium">{option}</span>
                  {feedback && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {feedback && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Puntuación actual: <span className="font-bold text-primary-600 dark:text-primary-400">{score}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <Beaker className="w-10 h-10 text-primary-500" />
            Micafold Labs
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Explora proteínas documentadas y pon a prueba tus conocimientos sobre sus estructuras predichas por AlphaFold.
          </p>
        </div>
        {Object.keys(completedLabs).length > 0 && (
          <button 
            onClick={() => {
              if(confirm("¿Estás seguro de que quieres borrar todo tu progreso en los laboratorios?")) {
                setCompletedLabs({});
              }
            }}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest font-bold"
          >
            Limpiar progreso
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LAB_PROTEINS.map((protein) => {
          const isCompleted = !!completedLabs[protein.uniprotId];
          const prevResult = completedLabs[protein.uniprotId];

          return (
            <div
              key={protein.uniprotId}
              className={`group bg-white dark:bg-slate-800 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col ${
                isCompleted ? 'border-primary-500/50 dark:border-primary-500/30' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="h-32 bg-gradient-to-br from-primary-500/10 to-primary-600/20 dark:from-primary-900/20 dark:to-primary-800/40 flex items-center justify-center relative">
                {isCompleted ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary-600/10 backdrop-blur-[1px]">
                    <CheckCircle className="w-12 h-12 text-primary-600 dark:text-primary-400 animate-in zoom-in duration-300" />
                  </div>
                ) : (
                  <BookOpen className="w-12 h-12 text-primary-600 dark:text-primary-400 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                )}
                <div className="absolute top-3 right-3 px-2 py-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {protein.uniprotId}
                </div>
                {isCompleted && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 text-white rounded text-[10px] font-bold shadow-sm">
                    COMPLETADO
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {protein.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1">
                  {protein.description}
                </p>
                
                {isCompleted && (
                  <div className="mb-4 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800/50 flex items-center justify-between">
                    <span className="text-xs text-primary-700 dark:text-primary-300 font-medium">Última puntuación:</span>
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{prevResult.score}/{prevResult.total}</span>
                  </div>
                )}

                <button
                  onClick={() => setSelectedProtein(protein)}
                  className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 group-hover:shadow-lg ${
                    isCompleted 
                      ? 'bg-white dark:bg-slate-900 border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/40' 
                      : 'bg-slate-900 dark:bg-slate-700 hover:bg-primary-600 dark:hover:bg-primary-600 text-white'
                  }`}
                >
                  {isCompleted ? 'Repetir Lab' : 'Comenzar Lab'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500">
          Powered by <span className="font-bold text-primary-600 dark:text-primary-400">AlphaFold DB API</span>
        </p>
      </footer>
    </div>
  );
}
