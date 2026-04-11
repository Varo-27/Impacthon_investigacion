/**
 * Servicio de conexión con el asistente RAG especializado en biología estructural
 * Webhook n8n con base de conocimiento (papers, UniProt, PDB, etc.)
 */

const RAG_URL = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/asistente-proteina";

function formatContextAsText(references) {
  if (!references.length) return "";
  return references.map((r) => {
    if (r.type === "job") {
      const lines = [
        `[PREDICCIÓN: ${r.proteinName || r.jobId}]`,
        `  - Estado: ${r.status}`,
        r.plddt   != null ? `  - pLDDT: ${r.plddt}` : null,
        r.organism         ? `  - Organismo: ${r.organism}` : null,
        r.biological?.solubility_score  != null ? `  - Solubilidad: ${r.biological.solubility_score}` : null,
        r.biological?.instability_index != null ? `  - Índice inestabilidad: ${r.biological.instability_index}` : null,
        r.biological?.stability_status  ? `  - Estabilidad: ${r.biological.stability_status}` : null,
      ].filter(Boolean);
      return lines.join("\n");
    }
    if (r.type === "project") {
      return [
        `[PROYECTO: ${r.name}]`,
        r.description ? `  - Descripción: ${r.description}` : null,
        `  - Miembros: ${r.memberCount}`,
      ].filter(Boolean).join("\n");
    }
    return JSON.stringify(r);
  }).join("\n\n");
}

export const ragApi = {
  async sendMessage(message, chatHistory = [], sessionId, references = []) {
    try {
      const response = await fetch(RAG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          chatInput: message,
          history: chatHistory.map((m) => ({ role: m.role, content: m.text })),
          context: references,
          contextText: formatContextAsText(references),
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.output || data.response || "No obtuve respuesta del asistente.";
    } catch (err) {
      console.error("RAG API error:", err);
      return "No pude conectar con el asistente. Comprueba que el webhook RAG está activo en n8n.";
    }
  },
};
