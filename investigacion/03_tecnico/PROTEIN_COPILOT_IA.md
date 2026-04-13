# Protein Copilot — Diseño técnico del asistente IA

La funcionalidad más diferenciadora de LocalFold. Un LLM que traduce
los datos crudos de la API en explicaciones comprensibles para un biólogo
sin experiencia computacional.

---

## 1. Dos modos de funcionamiento

### Modo A — Resumen automático (siempre activo)
Al cargar la pantalla de resultados, **sin que el usuario haga nada**,
se genera automáticamente un párrafo de resumen que aparece en la parte
superior del panel de resultados.

```
┌────────────────────────────────────────────────────────────────┐
│ 🧠 Resumen de tu predicción                                    │
│                                                                │
│ "La ubiquitina es una proteína de señalización altamente       │
│  conservada de 76 aminoácidos. Tu predicción muestra una       │
│  confianza global alta (pLDDT 71.7), con la mayoría de su     │
│  estructura bien definida. Las zonas en naranja (residuos      │
│  finales) son habituales en esta proteína y corresponden a     │
│  una región flexible funcional. La proteína es estable y       │
│  soluble, lo que facilita su purificación en laboratorio."     │
│                                                                │
│                              Generado con IA ✨               │
└────────────────────────────────────────────────────────────────┘
```

### Modo B — Chat interactivo (bajo el resumen)
Un input donde el usuario puede hacer preguntas sobre el resultado.

```
┌────────────────────────────────────────────────────────────────┐
│ 💬 Pregunta sobre esta proteína                                │
│ ┌──────────────────────────────────────────────┐ [ Preguntar ] │
│ │ ¿Qué hace esta proteína?                     │               │
│ └──────────────────────────────────────────────┘               │
│                                                                │
│  Preguntas sugeridas:                                          │
│  [ ¿Qué hace? ] [ ¿Por qué hay zonas naranjas? ]              │
│  [ ¿Es diana terapéutica? ] [ ¿Qué enfermedades asocia? ]     │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Qué datos se pasan al LLM (contexto)

El LLM no tiene acceso al visor 3D ni a la imagen. Recibe un JSON
estructurado con todos los datos del resultado. Cuanto más contexto,
mejor la respuesta.

### Contexto completo a enviar:

```json
{
  "protein_name": "Ubiquitin",
  "uniprot_id": "P0CG47",
  "organism": "Homo sapiens",
  "description": "Small regulatory protein...",
  "sequence_length": 76,
  "plddt_mean": 71.7,
  "plddt_histogram": {
    "very_high": 13,
    "high": 29,
    "medium": 24,
    "low": 10
  },
  "mean_pae": 3.33,
  "solubility_score": 79.8,
  "solubility_prediction": "soluble",
  "instability_index": 19.8,
  "stability_status": "stable",
  "toxicity_alerts": ["Potential signal peptide detected"],
  "allergenicity_alerts": [],
  "secondary_structure": {
    "helix_percent": 23.7,
    "strand_percent": 14.5,
    "coil_percent": 61.8
  },
  "data_source": "precomputed_database"
}
```

---

## 3. Prompts del sistema

### System prompt (fijo, enviado siempre):

```
Eres un asistente científico experto en biología molecular y
bioquímica estructural. Tu función es explicar resultados de
predicción de estructura proteica (generados por AlphaFold2) a
investigadores que pueden ser expertos en biología pero NO en
bioinformática computacional.

Reglas estrictas:
- Usa lenguaje claro y accesible. Evita jerga técnica computacional.
- Cuando uses términos biológicos técnicos (pLDDT, IDR, etc.),
  defínelos brevemente la primera vez en la respuesta.
- Sé honesto sobre las limitaciones del modelo (pLDDT bajo = incierto).
- No inventes datos que no están en el contexto proporcionado.
- Respuestas concisas: máximo 3-4 párrafos para el resumen automático,
  máximo 2 párrafos para respuestas del chat.
- No digas "basándome en los datos proporcionados" — sé directo.
- Cuando no tengas información suficiente para responder, dilo claramente.
```

### Prompt para el resumen automático:

```
Aquí tienes los resultados de una predicción de estructura proteica:

[CONTEXTO JSON]

Genera un resumen en lenguaje natural para un investigador biólogo.
El resumen debe explicar:
1. Qué es esta proteína y qué función tiene (si se conoce).
2. Cuál es la calidad global de la predicción y qué significa
   en términos prácticos (¿pueden confiar en esta estructura?).
3. Qué significan las zonas de baja confianza si las hay.
4. Las propiedades biológicas más relevantes (solubilidad,
   estabilidad, alertas de toxicidad).
5. Una recomendación de uso: ¿es esta estructura suficientemente
   fiable para usar en experimentos/publicaciones?
```

### Prompt para preguntas del chat:

```
El investigador ha recibido los siguientes resultados de predicción:

[CONTEXTO JSON]

Pregunta del investigador: "[PREGUNTA DEL USUARIO]"

Responde de forma clara y directa, usando el contexto anterior.
Si la pregunta no puede responderse con los datos disponibles,
indícalo y sugiere cómo obtener más información.
```

---

## 4. Preguntas presugeridas (chips clicables)

Diseñadas para cubrir los casos de uso más comunes de los 4 perfiles
de usuario identificados en la investigación:

```
Para todos:
[ ¿Qué hace esta proteína? ]
[ ¿Por qué hay zonas naranjas en el visor? ]
[ ¿Puedo publicar esta estructura en un paper? ]

Para biólogos de laboratorio:
[ ¿Es fácil de purificar en laboratorio? ]
[ ¿Es estable a temperatura ambiente? ]

Para investigadores clínicos:
[ ¿Está relacionada con alguna enfermedad? ]
[ ¿Qué impacto tiene la baja confianza en esta región? ]

Para drug discovery:
[ ¿Podría ser diana terapéutica? ]
[ ¿Tiene cavidades donde podría unirse un fármaco? ]
```

---

## 5. Orquestación del backend (n8n Webhook)

Para evitar exponer API keys en el frontend y ganar puntos por usar una "arquitectura de orquestación", usaremos **n8n**. n8n actúa como un hub que recibe los datos de la proteína, los procesa y consulta al modelo de lenguaje configurado de forma segura.

**Recomendación:** Usar n8n como capa intermedia para añadir asincronía y memoria sin complicar el código del frontend.

---

## 6. Implementación técnica (Arquitectura n8n Webhook)

Para evitar exponer la API Key en el frontend y ganar puntos con el jurado por usar una "arquitectura agentic" (orquestación), usaremos **n8n**.

### Código React (Llamada al Webhook sin Backend):

```javascript
// src/api/llm.js

export async function generateProteinSummary(proteinContext) {
  // El webhook público que te da n8n al crear el workflow
  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'summary', 
        context: proteinContext 
      })
    });
    
    // n8n debe devolver un JSON { "text": "Tu proteína es..." }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Fallo al conectar con el orquestador n8n", error);
    return null; // Fallback: simplemente no mostramos el resumen
  }
}
}
```

> **Ventaja de Seguridad:** Todas las credenciales críticas viven seguras dentro de la nube de n8n. React solo conoce la URL del Webhook.

---

## 7. Arquitectura del Workflow en n8n (Dos Flujos)

Para mayor robustez y facilidad de construcción en el Hackathon, separaremos la IA en dos flujos independientes en tu panel de n8n:

### Flujo 1: Resumen Automático
```text
[ Webhook Node POST /summary ]
       ↓
[ Basic LLM Chain ] (Rápido, estático, devuelve JSON {"text": "..."})
       ↓
[ Respond to Webhook ]
```

### Flujo 2: Chat Interactivo (Agente Memoria)
```text
[ Webhook Node POST /chat ]
       ↓
[ AI Agent Node ] (Usa herramientas y piensa)
   ├─ Entrada de Memoria: [ Window Buffer Memory ]
   └─ Configuración: Session ID = `={{ $json.body.session_id }}`
       ↓
[ Respond to Webhook ]
```

### Gestión de la Memoria (Flujo 2)
1. El frontend de React le inventa un ID único al chat (ej: `session_id: "chat_83745"` usando el ID del CESGA).
2. React envía ese ID en el JSON al Webhook `/chat`.
3. El Agente lee el `session_id` y recupera la conversación temporal de la RAM de n8n.

### Flujo en ResultsPage:

```
1. Resultados cargados desde la API del CESGA
      ↓
2. Construir objeto proteinContext con todos los datos
      ↓
3. Llamar generateProteinSummary(proteinContext)
      ↓
4. Mostrar spinner "Analizando con IA..." durante ~2s
      ↓
5. Renderizar resumen en el panel "🧠 Resumen de tu predicción"
      ↓
6. Habilitar el chat para preguntas adicionales
```

---

## 7. Fallback si el LLM no está disponible

Si la llamada al LLM falla (API key no configurada, rate limit, red):
- No bloquear la pantalla de resultados
- Ocultar el panel del Copilot
- Mostrar pequeño aviso: *"Análisis IA no disponible. Los datos están
  disponibles en los paneles de abajo."*
- Todos los datos científicos se siguen mostrando normalmente

> **El LLM es un bonus, no un requisito. Los resultados son completos sin él.**

---

## 8. Ejemplo de respuesta esperada

**Pregunta:** "¿Puede esta proteína ser diana terapéutica?"

**Respuesta del Copilot:**
> "La ubiquitina es una proteína altamente conservada que juega un papel
> central en el sistema de degradación de proteínas de la célula
> (vía ubiquitin-proteosoma). Sí, es considerada una diana terapéutica
> activa: inhibidores de la vía de ubiquitinación se investigan en cáncer,
> enfermedades neurodegenerativas e infecciones virales.
>
> Tu predicción muestra una estructura de alta confianza (pLDDT 71.7),
> suficientemente fiable para estudios iniciales de binding. Las regiones
> de baja confianza (residuos terminales) son zonas flexibles que en
> contexto celular interaccionan con otras proteínas, y son precisamente
> algunas de las dianas más estudiadas farmacológicamente."
