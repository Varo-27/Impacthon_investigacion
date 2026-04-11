const PROTEIA_CHAT_URL    = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/protein-chat";
const PROTEIA_SUMMARY_URL = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/protein-summary";

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

export const proteiaApi = {
  async getInitialSummary(jobId, proteinName, statusData) {
    try {
      const metrics = buildMetricsPayload(statusData);
      const contextSummary = `Proteína: ${proteinName}\nOrganismo: ${metrics.organism || "N/A"}\npLDDT: ${metrics.plddt || "N/A"}\nUniProt: ${metrics.uniprot || "N/A"}`;
      
      const response = await fetch(PROTEIA_SUMMARY_URL, {
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
      console.error("ProteIA summary error:", error);
      return "Hubo un problema al conectar con ProteIA.";
    }
  },

  async sendChatMessage(jobId, message, chatHistory = [], proteinContext = {}) {
    try {
      const bio = proteinContext.biological;
      const contextSummary = `DATOS DE LA PROTEÍNA:\n- Nombre: ${proteinContext.name}\n- pLDDT: ${proteinContext.plddt}\n- Organismo: ${proteinContext.organism}\n- UniProt: ${proteinContext.uniprot}\n- Solubilidad: ${bio?.solubility_score}/100\n- Inestabilidad: ${bio?.instability_index}`;

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

      console.log("ProteIA API enviando payload:", payload);

      const response = await fetch(PROTEIA_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.output || data.response || "No obtuve respuesta de ProteIA.";
    } catch (error) {
      console.error("ProteIA chat error:", error);
      return "No pude conectar con ProteIA. Comprueba que el webhook está activo.";
    }
  },
};
