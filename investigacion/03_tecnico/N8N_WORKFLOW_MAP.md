# Plano de Construcción en n8n (Dos Flujos Separados)

Tienes toda la razón. Para un hackathon es mucho más limpio, fácil de debugear y seguro crear **dos Workflows separados** (con dos URLs diferentes). Así, si un flujo se rompe, el otro sigue funcionando.

---

## 🟢 Workflow 1: El Resumen Automático
*Objetivo: Generar el párrafo inicial súper rápido nada más abrir la web. No tiene memoria.*

1. **Nodo 1: Webhook (Trigger)**
   - **Path:** `protein-summary`
   - **Method:** `POST`
   - **Respond:** `Using 'Respond to Webhook' Node`

2. **Nodo 2: Basic LLM Chain**
   - *Prompt:* `{{ $json.body.context }}`
   - *System Message:* "Eres un experto bioquímico. Devuelve un JSON con: {'text': 'resumen en lenguaje natural'}."
   - **Nodo Auxiliar conectado (Language Model):** LLM Chat Model (configurado en n8n).

3. **Nodo 3: Respond to Webhook**
   - *Respond With:* `JSON`
   - *Response Body:* `{{ $json.text }}`

---

## 🔵 Workflow 2: El Chat Interactivo
*Objetivo: Responder preguntas del biólogo. Tiene memoria y herramientas.*

1. **Nodo 1: Webhook (Trigger)**
   - **Path:** `protein-chat`
   - **Method:** `POST`
   - **Respond:** `Using 'Respond to Webhook' Node`

2. **Nodo 2: AI Agent**
   - *Prompt:* `{{ $json.body.question }}`
   - **Nodo Auxiliar conectado (Language Model):** LLM Chat Model (configurado en n8n).
   - **Nodo Auxiliar conectado (Memory):** Window Buffer Memory.
     - *Session ID:* `={{ $json.body.session_id }}` *(Super importante para que no mezcle pacientes)*.
   - **Nodos Auxiliares conectados (Tools):** Si quieres, métele un Calculator o un HTTP Request a la Wikipedia.

3. **Nodo 3: Respond to Webhook**
   - *Respond With:* `JSON`
   - *Response Body:* Devuelve el output del modelo.
