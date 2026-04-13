const MICAFOLD_CHAT_URL    = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/protein-chat";
const MICAFOLD_SUMMARY_URL = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/protein-summary";

const PROFILE_INSTRUCTIONS = {
  researcher: {
    understand: "El usuario es un investigador en biología molecular sin experiencia en HPC. Usa lenguaje biológico accesible, evita jerga técnica de computación y prioriza las implicaciones funcionales.",
    binding:    "El usuario es un investigador buscando sitios de unión. Destaca regiones conservadas, cavidades hidrofóbicas y posibles interfaces proteína-ligando.",
    validate:   "El usuario valida resultados experimentales. Conecta las predicciones estructurales con lo observable en gel, western blot o cristalografía.",
  },
  clinical: {
    understand: "El usuario es un investigador clínico. Relaciona la estructura con enfermedades conocidas y relevancia terapéutica. Evita jerga computacional.",
    binding:    "El usuario clínico busca dianas terapéuticas. Prioriza druggability, toxicidad potencial y relevancia para enfermedad.",
    validate:   "El usuario clínico valida datos. Enfoca en concordancia con literatura médica y significado clínico de las regiones de baja confianza.",
  },
  drug: {
    understand: "El usuario trabaja en drug discovery. Destaca propiedades ADMET, estabilidad, solubilidad y características que afectan al desarrollo de fármacos.",
    binding:    "El usuario busca sitios de unión para drug discovery. Prioriza binding pockets, accesibilidad del solvente y comparación con dianas conocidas.",
    validate:   "El usuario valida candidatos farmacológicos. Analiza solubilidad, índice de inestabilidad, alertas de toxicidad y viabilidad terapéutica.",
  },
  student: {
    understand: "El usuario es estudiante aprendiendo sobre estructuras proteicas. Explica paso a paso, define los términos técnicos y adopta un tono pedagógico.",
    binding:    "El usuario es estudiante interesado en interacciones proteína-ligando. Explica qué es un sitio de unión y cómo leer los datos de confianza.",
    validate:   "El usuario es estudiante aprendiendo a interpretar resultados. Conecta la predicción computacional con experimentos de laboratorio.",
  },
};

function getProfileContext() {
  try {
    const raw = localStorage.getItem("omicafold_profile");
    if (!raw) return "";
    const { type, goal, personalNote } = JSON.parse(raw);
    const instruction = PROFILE_INSTRUCTIONS[type]?.[goal];
    let context = instruction ? `\n\nPERFIL DEL USUARIO: ${instruction}` : "";
    if (personalNote?.trim()) {
      context += `\n\nCONTEXTO PERSONAL: "${personalNote.trim()}"`;
    }
    return context;
  } catch {
    return "";
  }
}

function buildMetricsPayload(statusData) {
  if (!statusData) return {};
  return {
    name: statusData.name || null,
    plddt: statusData.plddt || null,
    organism: statusData.organism || null,
    uniprot: statusData.uniprot || null,
    biological: statusData.biological
      ? {
          solubility_score: statusData.biological.solubility_score ?? null,
          solubility_prediction: statusData.biological.solubility_prediction ?? null,
          instability_index: statusData.biological.instability_index ?? null,
          stability_status: statusData.biological.stability_status ?? null,
          toxicity_alerts: statusData.biological.toxicity_alerts ?? [],
          allergenicity_alerts: statusData.biological.allergenicity_alerts ?? [],
          secondary_structure_prediction: statusData.biological.secondary_structure_prediction ?? null,
          sequence_properties: statusData.biological.sequence_properties ?? null,
        }
      : null,
    plddtHistogram: statusData.plddtHistogram || null,
    // pdbFileUrl y paeMatrix excluidos — demasiado grandes para el LLM
  };
}

export const micafoldApi = {
  async getInitialSummary(jobId, proteinName, statusData) {
    try {
      const metrics = buildMetricsPayload(statusData);
      const contextSummary = `Proteína: ${proteinName}\nOrganismo: ${metrics.organism || "N/A"}\npLDDT: ${metrics.plddt || "N/A"}\nUniProt: ${metrics.uniprot || "N/A"}${getProfileContext()}`;
      
      const response = await fetch(MICAFOLD_SUMMARY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          protein_name: proteinName,
          metrics: metrics,
          context: contextSummary, // Para el prompt de n8n
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.output || data.response || "No se pudo generar un resumen automático.";
    } catch (error) {
      console.error("MicaFold summary error:", error);
      return "Hubo un problema al conectar con Micafold.";
    }
  },

  async sendChatMessage(jobId, message, chatHistory = [], proteinContext = {}) {
    try {
      const bio = proteinContext.biological;
      const contextSummary = `DATOS DE LA PROTEÍNA:\n- Nombre: ${proteinContext.name}\n- pLDDT: ${proteinContext.plddt}\n- Organismo: ${proteinContext.organism}\n- UniProt: ${proteinContext.uniprot}\n- Solubilidad: ${bio?.solubility_score}/100\n- Inestabilidad: ${bio?.instability_index}${getProfileContext()}`;

      const payload = {
        session_id: `job_${jobId}`,
        question: message,  
        chatInput: message,
        context_summary: contextSummary,
        history: chatHistory.map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text,
        })),
        protein_context: {
          job_id: jobId,
          protein_name: proteinContext.name || "Proteína desconocida",
          plddt: proteinContext.plddt || null,
          organism: proteinContext.organism || null,
          uniprot: proteinContext.uniprot || null,
          solubility: bio?.solubility_score || null,
          instability: bio?.instability_index || null,
          toxicity_alerts: bio?.toxicity_alerts || [],
          secondary_structure: bio?.secondary_structure_prediction || null,
          sequence_properties: bio?.sequence_properties || null,
        },
      };

      console.log("MicaFold API enviando payload:", payload);

      const response = await fetch(MICAFOLD_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.output || data.response || "No obtuve respuesta de MicaFold.";
    } catch (error) {
      console.error("MicaFold chat error:", error);
      return "No pude conectar con MicaFold. Comprueba que el webhook está activo.";
    }
  },
};
