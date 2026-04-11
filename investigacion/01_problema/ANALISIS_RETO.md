# Analisis del Reto — Impacthon 2026: LocalFold

## Resumen ejecutivo

El reto consiste en construir la **"ultima milla"** de un sistema de prediccion de estructuras proteicas. No se trata de crear IA ni conectar al hardware real — el objetivo es construir una interfaz web intuitiva que consuma una API Mock que simula fielmente el superordenador CESGA Finis Terrae III con AlphaFold2.

---

## 1. Contexto del problema

| Elemento | Detalle |
|---|---|
| **Organizador** | GDG Santiago de Compostela / ETSE / USC |
| **Sponsor** | Catedra Camelia Medicina Personalizada - Plexus |
| **Fechas** | 10–12 abril 2026 |
| **Premio** | Continuar desarrollo en CiTIUS + ecosistema CAMELIA con soporte experto |
| **Contacto sponsor** | jose.valdivia.pinaque@usc.es |

### El problema real
Los biologos no pueden usar AlphaFold2 directamente porque requiere:
- Linux + GPUs NVIDIA A100
- ~3 TB de bases de datos geneticas
- Conocimiento de SLURM, Bash, HPC
- Infraestructura que solo existe en supercomputadores como el CESGA

La infraestructura ya existe. **Falta la interfaz.**

---

## 2. Arquitectura del sistema

```
[Investigador / Navegador]
        ↓ pega secuencia FASTA
[Tu Proyecto — SCOPE DEL HACKATHON]
  Frontend React / SPA + Agentes IA (opcional)
        ↓ POST /jobs/submit
[API Mock — api-mock-cesga.onrender.com]
  Simula CESGA Finis Terrae III
        ↓ (en produccion real: sbatch → Slurm)
[CESGA FT3 — FUERA DEL SCOPE]
  Nodos GPU NVIDIA A100 + AlphaFold2
```

---

## 3. API Mock — Endpoints clave

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/proteins/` | GET | Catalogo de 22 proteinas precargadas |
| `/proteins/samples` | GET | 8 secuencias FASTA listas para usar |
| `/jobs/submit` | POST | Enviar secuencia FASTA, devuelve `job_id` |
| `/jobs/{job_id}/status` | GET | Estado: PENDING / RUNNING / COMPLETED |
| `/jobs/{job_id}/outputs` | GET | Resultados: PDB, pLDDT, PAE, datos biologicos |

**URL base:** `https://api-mock-cesga.onrender.com`
**Swagger:** `https://api-mock-cesga.onrender.com/docs`
**Nota:** Puede tardar ~30s si lleva tiempo inactiva (cold start de Render).

### Datos de salida de la API
- `pdb_file` — Estructura molecular en formato PDB/mmCIF
- `plddt_per_residue` — Confianza por aminoacido (0–100)
- `pae_matrix` — Matriz de error predicho (0–5)
- `biological_data` — Solubilidad, toxicidad, estructura secundaria
- `accounting` — Minutos GPU/CPU virtualizados del HPC
- `protein_metadata` — Datos reales UniProt/PDB (solo para las 22 proteinas del catalogo)

---

## 4. Criterios de evaluacion (en orden de prioridad)

### Prioridad 1 — Usabilidad y UX orientada al biologo (MAYOR PESO)
- Facilidad de uso para no bioinformaticos
- Mensajes de error claros, tooltips educativos
- Test clave: **"¿Podria usarlo un biologo sin abrir una terminal?"**
- Se valora integracion de IA (LLMs para explicaciones)

### Prioridad 2 — Visualizacion e interpretabilidad
- Visor 3D interactivo (Mol*, NGL Viewer o 3Dmol.js)
- Estructura coloreada por pLDDT (azul = alta confianza, naranja = inestable)
- Heatmap 2D de la matriz PAE con tooltips educativos
- Metricas biologicas presentadas de forma comprensible, no como lista de numeros crudos

### Prioridad 3 — Gestion del ciclo de vida del job
- Flujo PENDING → RUNNING → COMPLETED robusto
- El usuario debe saber que esta pasando en todo momento
- Manejo graceful de errores de red y estados intermedios

### Prioridad 4 — Integracion creativa de datos adicionales
- Solubilidad, toxicidad, estructura secundaria
- Accounting HPC (minutos GPU/CPU)
- Metadata UniProt/PDB
- Se valoran formas ingeniosas de presentarlos que aporten valor real

### Prioridad 5 — Viabilidad para produccion
- Codigo estructurado para conectarse al CESGA real con cambios minimos
- Contempla autenticacion, errores de red, estados de carga

---

## 5. Lo que NO se evalua

- Conectar al CESGA real o implementar AlphaFold2
- Perfeccion del codigo o completitud total
- Conocimiento biologico profundo
- Optimizacion de backend o bases de datos

---

## 6. Ejemplos de soluciones posibles (referencia visual)

| Tipo | Descripcion |
|---|---|
| **Portal estilo AlphaFold DB** | Visor Mol* central, panel lateral con metricas, descarga en un click. Inspirado en alphafold.ebi.ac.uk |
| **Dashboard de investigacion** | Multiples jobs en paralelo, comparacion de estructuras, historial |
| **Wizard paso a paso** | Flujo guiado para usuarios sin experiencia, tooltips educativos sobre pLDDT, PAE y FASTA |

---

## 7. Herramientas recomendadas

### Visualizacion 3D
- **Mol* (pdbe-molstar)** — Recomendado. El mismo que usa la AlphaFold Database oficial de EMBL-EBI
- **3Dmol.js** — Alternativa ligera, facil de embeber

### Visualizacion de datos
- **Plotly.js** — Para heatmap PAE y graficas de pLDDT

### IA opcional (valorado)
- LLMs via N8N / webhooks para explicaciones biologicas
- RAG para respuestas con documentacion institucional del CESGA
- Agentes para enviar peticiones y monitorizar jobs

---

## 8. Funcionalidades del dashboard ideal (segun documentacion)

```
┌─────────────────────────────────────────────────────────────┐
│  1. VISOR 3D INTERACTIVO (Mol*)                              │
│     - Rotacion fluida, zoom, seleccion de residuos           │
│     - Coloreado por pLDDT (azul/naranja)                     │
│     - Leyenda de confianza incluida                          │
├─────────────────────────────────────────────────────────────┤
│  2. METRICA pLDDT                                            │
│     - pLDDT medio global                                     │
│     - Fraccion de residuos por rango de confianza            │
│     - Avisos si hay regiones de baja confianza               │
├─────────────────────────────────────────────────────────────┤
│  3. HEATMAP PAE (Predicted Aligned Error)                    │
│     - Bloques azules en diagonal = dominios bien definidos   │
│     - Bloques amarillos = orientacion relativa incierta      │
│     - Tooltips educativos para usuarios sin experiencia      │
├─────────────────────────────────────────────────────────────┤
│  4. METADATOS CREATIVOS                                      │
│     - Indices de toxicidad y solubilidad                     │
│     - Contabilidad HPC (GPU minutes)                         │
│     - Metadata UniProt/PDB                                   │
├─────────────────────────────────────────────────────────────┤
│  5. DESCARGA                                                 │
│     - PDB, mmCIF, JSON de confianza, logs completos          │
│     - Export PDF del resultado (client-side)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Informacion tecnica clave sobre los datos

### pLDDT
- Valor 0–100 de confianza por aminoacido
- Almacenado en la columna B-factor del formato PDB (hack de DeepMind)
- Se activa en Mol* con el flag `alphafoldView: true`
- Azul oscuro (>90) = certeza atomica alta
- Naranja/amarillo (<50) = loops flexibles desordenados

### PAE Matrix (Predicted Aligned Error)
- Matriz cuadrada N×N (N = numero de residuos)
- Valores 0–5, ideal para representar como heatmap
- Bloques azules en diagonal = dominios bien definidos
- Bloques amarillos entre dominios = orientacion relativa incierta

### Flujo de carga del PDB en el navegador
```javascript
// Tecnica in-memory blob para evitar CORS y latencia
const blob = new Blob([data.pdb_file], { type: 'text/plain' });
const blobUrl = URL.createObjectURL(blob);
// Alimentar blobUrl directamente al motor Mol*
```

---

## 10. Demo segura para el pitch (anti-efecto demo)

La documentacion menciona una tecnica de "demo segura" para evitar dependencia de red durante el pitch:
- Shortcut oculto (ej. SHIFT + Click en Refrescar) inyecta un job maestro pre-cargado
- Usa `job_demo_segura` con datos excelentes pre-definidos
- El visor 3D carga el preset `1cbs` embebido sin llamadas de red
- Genera metricas perfectas instantaneamente

---

## 11. Notas estrategicas para ganar

1. **La UX es el jurado** — Un prototipo bello que un biologo entienda sin tutorial gana a un codigo perfecto sin cuidado en la UI
2. **Los tooltips educativos son puntos directos** — Explicar pLDDT y PAE en lenguaje de laboratorio es diferenciador
3. **La IA suma puntos en criterio 1** — LLM que explique la proteina en lenguaje natural es muy valorado
4. **El export PDF es toque "enterprise"** — Da sensacion de producto acabado sin coste de backend
5. **El visor 3D es obligatorio** — Sin Mol* funcionando no se pasa el criterio 2
