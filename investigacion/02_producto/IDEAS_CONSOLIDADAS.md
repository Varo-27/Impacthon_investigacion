# IDEAS — LocalFold (Impacthón 2026)

Priorización basada en los **5 criterios oficiales del jurado**, en orden de peso.

---

## Criterios del jurado (fuente: doc oficial del reto)

| Peso | Criterio |
|---|---|
| 🥇 1º | **UX para el biólogo + valor con IA** — ¿podría usarlo alguien sin abrir una terminal? |
| 🥈 2º | **Visualización e interpretabilidad** — visor 3D, PAE, métricas como historia no como números |
| 🥉 3º | **Gestión del ciclo de vida del job** — PENDING → RUNNING → COMPLETED comunicado claramente |
| 4º | **Integración creativa de datos adicionales** — solubilidad, toxicidad, accounting HPC... |
| 5º | **Viabilidad como base de producción** — código limpio, errores manejados, fácil de conectar al CESGA real |

---

## 🔴 BLOQUE A — OBLIGATORIO (sin esto no hay demo)

### A1. Input FASTA inteligente ("Limpiador Automático")
- **El motor de limpieza invisible:** Función JS ejecutada antes de enviar a la API que previene el 95% de los crasheos.
- **Normalización silenciosa:** Extrae espacios en blanco, salta tabulaciones, quita los números de línea típicos de GenBank y pasa todo a MAYÚSCULAS obligatoriamente.
- **Subida de archivo (Drag & Drop):** Posibilidad de pinchar/arrastrar un `.txt`, `.fasta`, `.fa`, `.seq`. El sistema lee el texto plano y lo inyecta al limpiador.
- **Auto-corrección de cabeceras:** Si el usuario no escribe el `>nombre` al inicio, el sistema lo inyecta automáticamente (`>Secuencia_Usuario`) para satisfacer a AlphaFold.
- **Detección temprana de ADN (Error Fatal):** Algoritmo heurístico que cuenta % de A, T, G, C. Si es > 85%, bloquea y avisa: *"Parece ADN. Necesitamos proteína"*.
- **Anti Multi-FASTA:** Si detecta varios bloques `>`, los recorta y se queda sólo con el primero.
- **Test Jurado:** Ningún error de servidor (500) por formatear mal un texto.
- **Criterio:** 🥇 UX biólogo

### A2. Chips de proteínas de ejemplo + buscador
- Chips clicables que rellenan el textarea: `[Ubiquitin] [GFP] [p53] [SOD1] [Insulin]`
- Barra de búsqueda: `GET /proteins/?search=` con autocompletado
- Seleccionar una proteína → rellena FASTA automáticamente
- **Criterio:** 🥇 UX biólogo

### A3. Selector de recursos HPC (presets conceptuales)
- 3 opciones: `Rápido` / `Estándar` / `Alta precisión`
- **Nunca** mostrar "0 GPUs / 32 GB RAM" al usuario
- **Criterio:** 🥇 UX biólogo

### A4. Monitor del job en tiempo real
- Stepper animado: PENDING → RUNNING → COMPLETED / FAILED
- Terminal de logs con autoscroll y fuente monoespaciada
- Polling cada 3 segundos automático
- Mensaje amigable si la API tarda en arrancar (cold-start ~30s)
- Redirección automática a resultados al completar
- Errores de red manejados con mensajes claros
- **Criterio:** 🥉 Ciclo de vida

### A5. Visor 3D con coloreado pLDDT (3Dmol.js)
- Azul oscuro → azul → amarillo → naranja según confianza del residuo
- Rotación y zoom fluido
- Selector de modo: `Cartoon` / `Surface` / `Stick` / `Ribbon`
- Leyenda de colores siempre visible
- **Criterio:** 🥈 Visualización

### A6. Panel pLDDT en lenguaje humano
- NO: `plddt_mean: 71.7`
- SÍ: semáforo 🟢 + `"Confianza ALTA — la forma general es fiable para estudios estructurales"`
- Histograma de 4 rangos con colores y conteo de residuos
- Tooltip explicativo: `"pLDDT es la puntuación de confianza del modelo. >90 = muy fiable"`
- **Criterio:** 🥇 UX + 🥈 Visualización

### A7. PAE Heatmap con interpretación
- Matriz NxN renderizada con Plotly (azul = baja incertidumbre / rojo = alta)
- Debajo del gráfico: `"Los bloques azules indican dominios estructuralmente bien definidos entre sí"`
- Tooltip en el gráfico: `"Residuo X vs Y: ±N Å de incertidumbre"`
- **Criterio:** 🥈 Visualización

### A8. Panel de metadatos biológicos (Traducción al biólogo)
- **Concepto clave:** No dar números crudos, responder a las preguntas reales del biólogo con colores y métricas visuales.
- 🔥 **Recomendación ideal (La Buena):**
  - 🥇 **1. Solubilidad** 👉 *"¿Esto se puede usar en laboratorio?"* (Barra de progreso semaforizada).
  - 🥈 **2. Estabilidad** 👉 *"¿Se mantiene funcional o se rompe?"* (Badge de estatus).
  - 🥉 **3. Afinidad de unión (binding)** 👉 *"¿Interactúa con algo importante?"* (Si hay datos de interfaz, destacarlos).
  - ⭐ **4. Expresabilidad** 👉 *"¿Se puede producir fácilmente en cultivo?"* (Derivado de índices bioquímicos u optimización de codones).
- **Criterio:** 🥇 UX + 4º Datos creativos

### A9. Card de Accounting HPC
- `"Esta predicción usó 0.003 GPU·hours en el CESGA"`
- `"En un portátil convencional tardaría ~3 semanas"`
- Fácil de implementar (viene directo de la API) y muy impactante en el pitch
- **Criterio:** 4º Datos creativos

### A10. Barra de descargas
- Botones: `PDB` / `mmCIF` / `JSON métricas` / `Logs`
- **Criterio:** 🥈 Visualización

---

## 🟠 BLOQUE B — DIFERENCIADORES (con esto se gana)

### B1. ⭐ Protein Copilot — IA que explica en lenguaje natural
**El feature que gana el hackathon. El jurado preguntará "¿tiene IA?".**

**Modo automático** (al cargar resultados, sin hacer nada):
- El LLM recibe: nombre, pLDDT, solubilidad, estabilidad, toxicidad, estructura secundaria
- Genera un párrafo en lenguaje de biólogo explicando qué significa el resultado
- Spinner `"Analizando con IA..."` (~2s) → texto aparece

**Modo chat:**
- Preguntas presugeridas: `[¿Qué hace?]` `[¿Qué son las zonas naranjas?]` `[¿Es diana terapéutica?]`
- Input libre para preguntas personalizadas
- El LLM de contexto: siempre tiene acceso a los datos del job actual

**Red flags automáticos:**
- 🔴 `"pLDDT < 40 en más del 50% — no recomendado para docking"`
- 🟡 `"Región desordenada larga — puede ser funcional (IDR)"`
- 🟢 `"Alta confianza en dominio catalítico — apto para estudios de binding"`

**API:** Gemini Flash 2.0 (gratis, sin tarjeta de crédito)
**Criterio:** 🥇 UX + IA (criterio 1 explícito del reto)

### B2. Historial de jobs — "Mis predicciones"
**Explícitamente mencionado como ejemplo positivo en el doc del reto.**

- Tabla con todos los jobs guardados en `localStorage`
- Columnas: Proteína · Estado · pLDDT · Solubilidad · Fecha · Acciones
- Al completar un job → se guarda automáticamente
- Clic en cualquier row → abre los resultados directamente
- Persiste entre sesiones (mientras no se limpie el navegador)
- **Criterio:** 🥇 UX + 5º Viabilidad producción

### B3. Compartir resultado por URL
- El `job_id` ya está en la URL: `/results/abc123`
- Botón `"🔗 Copiar link"` → copia la URL al portapapeles
- Cualquier persona con el link ve los resultados (carga desde la API)
- Sin base de datos, sin backend propio
- **30 minutos de implementación**
- **Criterio:** 🥇 UX + 4º Datos creativos

### B4. Tooltips educativos en todo
- Icono `ⓘ` junto a cada término técnico
- `pLDDT` → `"Predicted Local Distance Difference Test. Puntuación 0-100 de confianza por residuo"`
- `PAE` → `"Predicted Aligned Error. Incertidumbre en la posición relativa entre pares de residuos"`
- `FASTA` → `"Formato de texto para secuencias biológicas. Empieza con > seguido del nombre"`
- **Criterio:** 🥇 UX biólogo (test: ¿puede usarlo sin ayuda?)

---

## 🟡 BLOQUE C — SI QUEDA TIEMPO

### C1. Sequence Rainbow — barra 1D de confianza
- Barra horizontal con cada aminoácido coloreado por su pLDDT
- Hover → tooltip con residuo, aminoácido y valor exacto
- Clic → resalta ese residuo en el visor 3D

### C2. "Proteína del día" en la landing
- Visor 3D ya en rotación al entrar
- Explicación en lenguaje natural de qué es y por qué es interesante
- El usuario entiende el producto en 10 segundos sin hacer nada

### C3. Notificaciones del navegador
- Al enviar job → activar notificaciones
- Cuando completa → notificación aunque el usuario esté en otra pestaña
- Web Notifications API — ~30 minutos

### C4. Comparación Sano vs Mutado
- Dos textareas: secuencia original + variante
- Dos jobs en paralelo, comparación de métricas side-by-side
- Caso de uso estrella para medicina personalizada

### C5. Proyectos de Investigación — "Mis carpetas"
- El investigador agrupa sus predicciones en proyectos (ej: "TFM 2026", "Lote Abril")
- En el historial, cada row muestra a qué proyecto pertenece
- Filtro por proyecto en la tabla de historial
- **Implementación mínima (sin tabla extra):** campo `project_name text` en `jobs` — el usuario escribe el nombre al guardar
- **Implementación completa (tabla `projects`):** permite renombrar proyectos globalmente, ver estadísticas por carpeta, compartir proyectos enteros con colaboradores
- **Decisión para hackathon:** usar `project_name text` (5 min) → tabla completa solo si sobra tiempo
- **Por qué es interesante:** convierte LocalFold en gestor de investigación, no solo predictor. Muy relevante para el perfil CESGA que tiene múltiples experimentos en paralelo.

---

## 🔵 BLOQUE D — PARA EL PITCH (no implementar)

| Idea | Por qué mola en el pitch |
|---|---|
| Knowledge Graph (proteínas↔enfermedades↔fármacos) | "El siguiente paso natural" |
| Drug Discovery Mode (docking, binding) | Extiende el caso de uso a farmacología |
| SSO institucional USC/CSIC | "En producción = cambiar URL + conectar LDAP" |
| API pública `/predict` `/compare` | "Permite integración con pipelines del CESGA" |
| Animación de plegamiento | Impacto visual en demo |
| CESGA Live Stats en landing | Storytelling de escala |

---

## Orden de construcción recomendado

```
JUEVES NOCHE:
  A1 + A2 + A3  →  Pantalla de submit funcional

VIERNES MAÑANA:
  A4           →  Pantalla de estado con polling

VIERNES TARDE:
  A5 + A6 + A7 + A8  →  Pantalla de resultados completa

VIERNES NOCHE:
  A9 + A10     →  Accounting + descargas
  B2           →  Historial en localStorage
  B3           →  Compartir por URL (30 min)

SÁBADO MAÑANA:
  B1           →  Protein Copilot LLM ← ESTO GANA
  B4           →  Tooltips educativos
  C1/C2/C3     →  Lo que quede de tiempo
```

> **Regla de oro:** Un MVP funcional y bonito en A1-A10 ya compite.
> El Protein Copilot (B1) es lo que gana.
