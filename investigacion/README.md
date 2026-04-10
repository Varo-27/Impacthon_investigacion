# LocalFold — Documentación de Investigación y Producto

Repositorio de conocimiento para el reto **LocalFold** del Impacthón 2026.
Todo lo que necesitas saber antes de abrir el editor.

---

## Estructura de carpetas

```
investigacion/
│
├── 01_problema/              ← Por qué existe LocalFold
│   ├── DOCUMENTO_DE_INVESTIGACION.md    → Contexto del reto, el problema y estado del arte
│   └── INVESTIGACION_USUARIOS.md        → Perfiles de usuario, flujos reales, funcionalidades propuestas
│
├── 02_producto/              ← Qué construimos
│   └── MVP_SKETCH.md                    → Sketches ASCII de las 3 pantallas del MVP
│
└── 03_tecnico/               ← Cómo lo construimos
    └── STACK_Y_APUNTES_DESARROLLO.md    → Stack tecnológico, endpoints, campos de API, trampas técnicas

Documentacion/                ← Fuente: PDFs originales del reto + doc unificado
    ├── CONTEXTUALIZACION_DEL_RETO.pdf
    ├── GUIA_DE_USO_API.pdf
    ├── IMPACTHON_2026_CAMELIA.pdf
    ├── PRESENTACIÓN_IDEA_GENERAL.pdf
    └── DOCUMENTACION_COMPLETA_IMPACTHON.md  → Resumen unificado de los 4 PDFs
```

---

## Estado actual de la documentación

| Documento | Estado | Contenido |
|---|---|---|
| `DOCUMENTO_DE_INVESTIGACION.md` | ✅ Completo | Problema, usuarios, estado del arte |
| `INVESTIGACION_USUARIOS.md` | ✅ Completo | 4 perfiles, flujos, features priorizadas (MoSCoW) |
| `MVP_SKETCH.md` | ✅ Completo | 3 pantallas en ASCII + flujo completo |
| `STACK_Y_APUNTES_DESARROLLO.md` | ✅ Completo | Stack, endpoints, campos salida, apuntes clave |
| `DOCUMENTACION_COMPLETA_IMPACTHON.md` | ✅ Completo | Resumen de todos los PDFs del reto |

---

## Siguientes pasos recomendados

### 🔴 CRÍTICO — antes de escribir código
- [ ] **Definir arquitectura de componentes** — qué componentes React necesitamos y cómo se comunican entre sí
- [ ] **Decidir visor 3D** — Mol* vs 3Dmol.js (Mol* más potente, 3Dmol más fácil de integrar en el tiempo del hackathon)
- [ ] **Probar la API** — verificar que el cold-start está resuelto y que el flujo completo funciona

### 🟡 ALTA PRIORIDAD — semana del hackathon
- [ ] **Pantalla 1 funcional** — textarea FASTA + botón de envío + validación visual
- [ ] **Pantalla 2 funcional** — polling de estado + logs en tiempo real
- [ ] **Pantalla 3 funcional** — panel de métricas (pLDDT y datos biológicos)
- [ ] **Integrar visor 3D** — renderizar el PDB con coloreado por pLDDT

### 🟢 DIFERENCIACIÓN — si queda tiempo
- [ ] **Resumen con LLM** — llamada a Gemini/GPT que explique el resultado en lenguaje natural
- [ ] **Dashboard "Mis Jobs"** — historial de predicciones enviadas
- [ ] **Advertencias automáticas** — banner si pLDDT_mean < 50

---

## Links de referencia rápida

| Recurso | URL |
|---|---|
| API Mock (base) | https://api-mock-cesga.onrender.com |
| Swagger / Docs interactivos | https://api-mock-cesga.onrender.com/docs |
| AlphaFold DB (referencia visual) | https://alphafold.ebi.ac.uk |
| Mol* viewer | https://molstar.org/viewer/ |
| 3Dmol.js | https://3dmol.csb.pitt.edu |
