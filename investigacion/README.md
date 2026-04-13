# Micafold — Base de Conocimiento del Proyecto


Todo lo que el equipo necesita saber antes de escribir código.

---

## Estructura de archivos

```
investigacion/
│
├── 01_problema/                         ← Por qué existe Micafold
│   ├── DOCUMENTO_DE_INVESTIGACION.md    → Contexto del reto, problema y estado del arte
│   ├── USUARIOS.md                      → 5 perfiles, escenarios reales, MoSCoW, modo dual
│   └── ANALISIS_COMPETENCIA_NEUROSNAP.md → Funcionalidades, pricing, gaps vs Micafold
│
├── 02_producto/                         ← Qué construimos
│   ├── IDEAS_CONSOLIDADAS.md            → 29 ideas priorizadas (🟢🟡🔴)
│   └── MVP_SKETCH.md                    → Sketches ASCII de las 3 pantallas del MVP
│
├── 03_tecnico/                          ← Cómo lo construimos
│   ├── STACK_Y_APUNTES_DESARROLLO.md    → Stack, endpoints API, campos de salida
│   ├── ARQUITECTURA_COMPONENTES.md      → Árbol React, decisión 3Dmol.js, polling
│   ├── FORMATOS_ENTRADA_FASTA.md        → Todos los formatos de entrada y normalización
│   ├── PROTEIN_COPILOT_IA.md            → Diseño técnico del asistente LLM (ProteIA)
│   └── PLAN_SPRINT_HACKATHON.md         → Timeline 48h con checkpoints por bloque
│
└── README.md                            ← Este archivo
```

---

## Resumen ejecutivo (leer esto primero)

**El problema:** Los investigadores biológicos no pueden usar AlphaFold2 sin ayuda técnica externa.

**La solución existente:** Neurosnap — de pago ($7-80/mes), datos en USA (GDPR ❌), UX orientada a técnicos.

**Micafold:** La interfaz institucional del CESGA. Gratis, datos en Galicia, UX para el biólogo.

**El diferenciador ganador:** ProteIA — IA que traduce los datos crudos al lenguaje del investigador.

---

## Los 5 usuarios (ver USUARIOS.md para detalle)

| Perfil | Lo que necesita | Feature clave |
|---|---|---|
| Biólogo de laboratorio | Autonomía sin informático | ProteIA + visor pLDDT |
| Clínico / medicina personalizada | Privacidad de datos del paciente | CESGA institucional |
| Drug discovery | Estructura para docking | PDB descargable + métricas |
| Estudiante | Aprender mientras usa | Tooltips educativos + presets |
| Power user CESGA | Visualizar sus propios PDB | Upload propio + export métricas |

---

## Las 3 features que ganan el hackathon

1. **ProteIA** — LLM que explica resultados en lenguaje natural (nadie más lo tiene)
2. **Visor 3D coloreado por pLDDT** — el estándar visual que los jueces conocen
3. **Sequence Rainbow** — barra 1D de confianza residuo a residuo (innovación visual propia)

---

## Plan de sprint (ver PLAN_SPRINT_HACKATHON.md para detalle)

```
JUEVES NOCHE    → Setup + Pantalla 1 (input FASTA + submit)
VIERNES MAÑANA  → Pantalla 2 (polling + job lifecycle)
VIERNES TARDE   → Pantalla 3 (visor 3D + métricas)
VIERNES NOCHE   → PAE heatmap + descargas + MVP 100%
SÁBADO MAÑANA   → ProteIA (n8n Webhooks) + upload PDB + pitch
```

---

## Links rápidos

| Recurso | URL |
|---|---|
| API Mock | https://api-mock-cesga.onrender.com |
| Swagger Docs | https://api-mock-cesga.onrender.com/docs |
| AlphaFold DB (referencia) | https://alphafold.ebi.ac.uk |
| Neurosnap (competidor) | https://neurosnap.ai/service/AlphaFold2 |
| Mol* viewer | https://molstar.org/viewer/ |
| 3Dmol.js docs | https://3dmol.csb.pitt.edu |
| AI Orchestration | n8n Webhooks |
