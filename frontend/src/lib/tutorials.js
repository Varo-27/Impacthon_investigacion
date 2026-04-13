// Configuraciones de pasos para cada tour.
// Los componentes que necesiten lanzar un tour deben usar useTutorial().startTour(STEPS)

export const DASHBOARD_STEPS = [
  {
    target: null,
    title: "Bienvenido a Micafold",
    description: "Te mostramos las funciones principales en menos de un minuto. Usa las flechas del teclado o los botones para navegar.",
    icon: "👋",
  },
  {
    target: "#btn-new-job",
    title: "Enviar una predicción",
    description: "Pega tu secuencia FASTA y Micafold la envía al CESGA. Sin terminales, sin scripts, sin configuración.",
    side: "right",
  },
  {
    target: "#jobs-link",
    title: "Seguimiento en tiempo real",
    description: "Ve el estado de cada predicción: en cola, procesando o completada. Firebase sincroniza automáticamente sin recargar.",
    side: "right",
  },
  {
    target: "#projects-list",
    title: "Proyectos colaborativos",
    description: "Agrupa predicciones en proyectos e invita a colaboradores por email. Todo el equipo en un mismo espacio.",
    side: "right",
  },
  {
    target: "#assistant-link",
    title: "ProteIA — tu asistente IA",
    description: "Analiza resultados con contexto real de tu proteína. Las respuestas se adaptan a tu perfil, no son genéricas.",
    side: "right",
  },
];

export const SUBMIT_STEPS = [
  {
    target: "#fasta-input-area",
    title: "Secuencia FASTA",
    description: "Pega aquí la secuencia de tu proteína. El nombre se detecta automáticamente desde el header UniProt.",
    side: "right",
  },
  {
    target: "#target-project-select",
    title: "Asignar a un proyecto",
    description: "Opcional. Organiza tus predicciones asignándolas a un proyecto para mantener todo ordenado.",
    side: "bottom",
  },
  {
    target: "#submit-job-btn",
    title: "Lanzar al CESGA",
    description: "Al confirmar, Micafold reserva nodos GPU en el FinisTerrae III y ejecuta AlphaFold2 de forma transparente.",
    side: "top",
  },
];

export const VIEWER_STEPS = [
  {
    target: "#viewer-canvas",
    title: "Visor 3D interactivo",
    description: "Rota, zoom y explora la estructura. El coloreado por pLDDT muestra la confianza residuo a residuo: azul es alta confianza, naranja es incertidumbre.",
    side: "left",
  },
  {
    target: "#viewer-tabs",
    title: "Pestañas de análisis",
    description: "Estructura, métricas bioquímicas, PAE heatmap y tu asistente IA — todo en el mismo panel.",
    side: "left",
  },
  {
    target: "#viewer-biochem",
    title: "Datos bioquímicos",
    description: "Solubilidad, índice de inestabilidad, alertas de toxicidad y predicción de estructura secundaria calculados automáticamente.",
    side: "top",
  },
];

export const CHAT_STEPS = [
  {
    target: "#chat-context-area",
    title: "Contexto de tu proteína",
    description: "ProteIA ya ha leído todos los datos de tu predicción antes de que preguntes. Cada respuesta parte de tus resultados reales.",
    side: "bottom",
  },
  {
    target: "#chat-input-area",
    title: "Pregunta en lenguaje natural",
    description: "Escribe como hablarías con un colega. ProteIA adapta la profundidad de la respuesta a tu perfil de usuario.",
    side: "top",
  },
];
