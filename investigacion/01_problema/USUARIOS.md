# Usuarios de LocalFold — Investigación Completa

Documento unificado que recopila todos los perfiles de usuario,
sus necesidades reales, flujos de trabajo, y las implicaciones
de diseño que se derivan.

---

## PARTE 1 — Perfiles de Usuario y Necesidades

### Perfil A — El Biólogo Molecular / Bioquímico de laboratorio
- Experto en biología, sin formación técnica en HPC ni línea de comandos.
- Necesita predecir rápidamente estructuras 3D de secuencias nuevas o experimentales.
- **Bloqueante actual:** Depende del bioinformático del grupo para cualquier predicción.
- **Lo que quiere de LocalFold:** Pegar secuencia → ver la proteína → entender si es fiable → descargar para reunión.

### Perfil B — El Investigador Clínico / Medicina Personalizada
- Trabaja con muestras de pacientes (tumores, variantes genéticas raras).
- **Bloqueante actual:** No puede subir datos a terceros por normativa de privacidad (GDPR, normativa hospitalaria). Google Colab queda completamente descartado.
- **Lo que quiere de LocalFold:** Modelar la proteína mutada del paciente dentro del CESGA (datos que nunca salen del clúster institucional) y compararla con la sana.

### Perfil C — El Investigador en Descubrimiento de Fármacos (Drug Discovery)
- Busca dianas terapéuticas. Necesita identificar "pockets" o cavidades donde encaje un fármaco.
- **Bloqueante actual:** Varias herramientas encadenadas manualmente: CESGA para predecir, PyMOL para visualizar, scripts Python para extraer métricas.
- **Lo que quiere de LocalFold:** Estructura 3D de la diana → identificar cavidades → descargar PDB para herramientas de docking externas.

### Perfil D — El Estudiante de Máster / Doctorado
- Primer contacto con herramientas computacionales. Quiere autonomía sin depender eternamente del director.
- **Bloqueante actual:** Curva de aprendizaje altísima de todas las herramientas existentes.
- **Lo que quiere de LocalFold:** Tooltips que expliquen el pLDDT. Flujo guiado. Resultados exportables para el TFM.

### Perfil E — El Investigador / Técnico del CESGA (Power User)
- Ya usa clusters HPC, pipelines, Slurm, Python, GROMACS. No necesita que LocalFold prediga — ya tiene sus PDB.
- **Bloqueante actual:** No hay un lugar bueno para visualizar, comparar y comunicar sus resultados computacionales sin instalar herramientas locales pesadas.
- **Lo que quiere de LocalFold:**
  - Subir directamente su PDB calculado en el CESGA
  - Comparar modelos (sano vs mutado, AlphaFold vs MD)
  - Panel de métricas exportable en CSV/JSON
  - Gestionar múltiples experimentos por proyecto
  - Compartir resultados con colaboradores sin que descarguen nada

---

## PARTE 2 — Un Día en la Vida del Usuario

### ESCENARIO 1 — Laura (doctoranda, nuevo resultado de secuenciación)

**Sin LocalFold → 5 horas:**
```
09:00 Llegan resultados de secuenciación. Copia el FASTA.
09:15 Busca en UniProt. No aparece (variante nueva).
09:45 Intenta Google Colab + ColabFold. 23 celdas que no entiende.
10:40 La sesión de Colab se desconecta. Vuelve a empezar.
12:00 Tiene el PDB. No sabe con qué abrirlo.
12:30 Descarga UCSF Chimera (800 MB). No sabe interpretar los colores.
14:00 Va a comer frustrada. Manda email al bioinformático del grupo.
→ Respuesta: 3 días después.
```

**Con LocalFold → 30 minutos:**
```
09:00 Pega el FASTA. Pulsa "Predecir". Espera 10 segundos.
09:15 Ve el resumen del Copilot en lenguaje natural.
09:20 Pregunta "¿Está relacionada con cáncer?" → respuesta inmediata.
09:30 Descarga el PDF. Lo lleva a la reunión de las 10.
10:00 Su directora entiende. Deciden priorizar esa proteína.
```

---

### ESCENARIO 2 — Dr. Ramón (oncólogo, mutación de paciente)

Paciente con cáncer de mama. Informe genómico: mutación BRCA1 G1699A.
**No puede usar Google Colab** — la secuencia es datos médicos del paciente.

Con LocalFold:
- Introduce la secuencia mutada. El CESGA la procesa. Los datos no salen del clúster.
- Copilot: *"La posición 1699 está en el dominio BRCT, crítico para reparación del ADN. Esta variante está clasificada como probablemente patogénica en ClinVar."*
- Genera informe PDF. Lo adjunta a la historia clínica.

**Implicación de diseño: la privacidad es el requisito más crítico, no un feature opcional.**

---

### ESCENARIO 3 — Carlos (postdoc, expresión de proteínas)

Antes de gastar 3 semanas y 2.000€ en expresar una proteína, necesita saber si va a ser soluble y si tiene regiones desordenadas que dificulten la cristalización.

Con LocalFold en 10 minutos predice sus 5 candidatas y ve:
- Proteína A: solubilidad 82/100 ✅, IDR 8% → **candidata principal**
- Proteína B: solubilidad 23/100 ❌, IDR 44% → **descartar**

**Implicación de diseño: el dashboard comparativo de múltiples jobs es esencial para este perfil.**

---

### ESCENARIO 4 — María (estudiante, primera vez)

Su directora le dijo: *"predice la estructura de esta proteína para el miércoles".*
María nunca ha usado AlphaFold. Tiene miedo de hacer el ridículo.

Sus preguntas al abrir la app:
- "¿Qué es un archivo FASTA?"
- "¿Cuántos GPUs pido?"
- "¿pLDDT 71.7 es bueno o malo?"

**Implicación de diseño:** El primer contacto tiene que ser exitoso o la pierde para siempre. Los presets de recursos deben ser `"Rápido / Estándar / Preciso"`, no `"0 GPUs / 32 GB RAM"`.

---

### ESCENARIO 5 — Investigador CESGA (ya tiene sus PDB)

Acaba de terminar una simulación MD de 72 horas en el CESGA.
Tiene 6 ficheros PDB (proteína en distintos estados conformacionales).
Quiere comparar las estructuras y compartir con su grupo sin que descarguen PyMOL.

Con LocalFold:
- Sube los PDB directamente (sin predecir, ya los tiene)
- Compara dos modelos en split screen
- Exporta las métricas en JSON para análisis posterior
- Comparte el link de los resultados con sus colaboradores

---

## PARTE 3 — Lo que tienen en común todos los usuarios

### No necesitan más datos. Necesitan comprensión.

```
"pLDDT: 71.7"  ≠  "Puedes confiar en esta estructura"
"solubility_score: 79.8"  ≠  "Se comportará bien en laboratorio"
"toxicity_alerts: ['signal peptide']"  ≠  "Presta atención a esta región"
```

### Los 3 momentos de valor para el usuario

1. **ANTES de la predicción:** ¿Qué proteína elijo? ¿Vale la pena?
2. **AL VER los resultados:** ¿Puedo fiarme de esta estructura? ¿Qué hago con ella?
3. **DESPUÉS:** ¿Cómo explico esto a mi directora / colaborador / jurado?

### Las 3 preguntas que siempre se hacen

1. "¿Es fiable esta predicción?" → pLDDT en lenguaje humano
2. "¿Para qué me sirve?" → contexto biológico + Copilot
3. "¿Qué hago ahora?" → siguiente paso sugerido

---

## PARTE 4 — Funcionalidades priorizadas (MoSCoW)

| Prioridad | Funcionalidad | Usuario principal |
|---|---|---|
| **Must have** | Visor 3D con coloreado pLDDT | Todos |
| **Must have** | Panel métricas en lenguaje claro | A, B, D |
| **Must have** | Heatmap PAE | A, C, E |
| **Must have** | Flujo job PENDING → COMPLETED | Todos |
| **Must have** | Download PDB, mmCIF, JSON | Todos |
| **Should have** | Protein Copilot (resumen LLM automático) | A, B, D |
| **Should have** | Upload PDB propio | E |
| **Should have** | Historial de jobs | C, E |
| **Should have** | Advertencias automáticas baja confianza | A, B |
| **Should have** | Export CSV/JSON de métricas | C, E |
| **Could have** | Comparación sano vs mutado | B |
| **Could have** | Split screen dos estructuras | E |
| **Could have** | "Disease mode" por enfermedad | B, D |
| **Could have** | Compartir resultado por URL | Todos |
| **Could have** | PDF exportable | A, B, D |
| **Won't have (hack)** | Autenticación real | — |
| **Won't have (hack)** | Conexión CESGA real | — |
| **Won't have (hack)** | Knowledge graph completo | — |

---

## PARTE 5 — Modo Dual: Biólogo vs. Power User

```
┌─────────────────────────────────────────────────────────────────┐
│                        LocalFold                                │
├───────────────────────────┬─────────────────────────────────────┤
│    MODO BIÓLOGO           │    MODO INVESTIGADOR AVANZADO       │
│    (novice-friendly)      │    (power user CESGA)               │
├───────────────────────────┼─────────────────────────────────────┤
│ Pegar FASTA → predecir    │ Subir PDB propio / múltiples jobs   │
│ Lenguaje natural          │ Métricas exportables CSV/JSON       │
│ Protein Copilot           │ Comparación con RMSD (split screen) │
│ Presets simples           │ Proyectos y colecciones             │
│ PDF para reunión          │ Configuración avanzada              │
└───────────────────────────┴─────────────────────────────────────┘
```

**Para el hackathon:** Modo Biólogo al 100% (criterio 1 del jurado).
**Para el pitch:** Presentar el Modo Avanzado como roadmap — demuestra
que el producto sirve a toda la comunidad investigadora del CESGA.
