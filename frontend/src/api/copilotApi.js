/**
 * Servicio de conexión con los orquestadores de IA en n8n
 */

const N8N_CHAT_URL = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/protein-chat";
const N8N_SUMMARY_URL = "https://n8n-n8n.yaqvsc.easypanel.host/webhook/protein-summary";

export const copilotApi = {
  /**
   * Obtiene un resumen inicial de la proteína analizada
   */
  async getInitialSummary(jobId, proteinName, statusData) {
    try {
      const response = await fetch(N8N_SUMMARY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          protein_name: proteinName,
          metrics: statusData // Le pasamos pLDDT, etc.
        })
      });
      if (!response.ok) throw new Error("Error en el resumen de n8n");
      const data = await response.json();
      return data.output || data.response || "No se pudo generar un resumen automático.";
    } catch (error) {
      console.error("Copilot Summary Error:", error);
      return "Hubo un problema al conectar con el Asistente de IA.";
    }
  },

  /**
   * Envía un mensaje al chat interactivo
   * @param {string} jobId - ID del trabajo del CESGA
   * @param {string} message - Pregunta del usuario
   * @param {Array} chatHistory - Historial de la sesión
   * @param {Object} proteinContext - Datos de la proteína (nombre, pLDDT, etc.)
   */
  async sendChatMessage(jobId, message, chatHistory = [], proteinContext = {}) {
    try {
      const response = await fetch(N8N_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: `job_${jobId}`,
          chatInput: message,
          history: chatHistory,
          // Contexto de la proteína para que el LLM sepa de qué estamos hablando
          protein_context: {
            job_id: jobId,
            protein_name: proteinContext.name || "Proteína desconocida",
            plddt: proteinContext.plddt || null,
            organism: proteinContext.organism || null,
            uniprot: proteinContext.uniprot || null,
            solubility: proteinContext.biological?.solubility_score || null,
            instability: proteinContext.biological?.instability_index || null
          }
        })
      });
      if (!response.ok) throw new Error("Error en el chat de n8n");
      const data = await response.json();
      return data.output || data.response || "Mmm, no estoy seguro de cómo responder a eso.";
    } catch (error) {
      console.error("Copilot Chat Error:", error);
      return "Lo siento, la conexión con mi cerebro de IA se ha interrumpido.";
    }
  }
};
