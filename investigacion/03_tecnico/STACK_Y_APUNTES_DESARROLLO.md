# Stack Tecnológico y Apuntes de Desarrollo — LocalFold

Este documento define el stack técnico recomendado para el proyecto, basado
íntegramente en lo que los documentos del reto mencionan de forma explícita
o implícita.

---

## 1. Lo que dicen los documentos del reto

### Frontend (mencionado explícitamente)

| Tecnología | Fuente | Observación |
|---|---|---|
| **React / SPA** | Guía de API, Contextualización | Arquitectura recomendada por los propios organizadores. |
| **Mol\*** | Guía de API, Enunciado | **Visor 3D recomendado principal**. Es el mismo que usa AlphaFold DB oficial de EMBL-EBI. |
| **NGL Viewer** | Enunciado del reto | Alternativa a Mol\*. |
| **3Dmol.js** | Guía de API, Enunciado | Alternativa **ligera** al Mol\*, fácil de embeber. |
| Heatmap 2D (PAE) | Guía de API | No se especifica librería, pero es una visualización obligatoria. Candidatas: Plotly.js, D3.js. |

### Backend propio (¿lo necesitamos?)

Los documentos dejan claro que el backend simulador ya está desplegado y es público:

> *"Sin autenticación requerida — todos los endpoints son públicos"*

Esto significa que **no es necesario construir un backend propio** desde cero
para el hackathon. El frontend conecta directamente a la API MOCK del CESGA.

Si se desea un backend auxiliar propio (p.ej. para guardar historial de jobs,
autenticación mínima o actuación de proxy), puede ser algo ligero.

### IA / LLMs (mencionado como valor añadido)

> *"Se valora el uso de herramientas de IA que se puedan integrar en el frontend.
> LLMs como apoyo para elaborar más explicaciones online, agentes para enviar
> peticiones al CESGA en un futuro, etc."*

| Uso sugerido | Ejemplo concreto |
|---|---|
| Asistente conversacional | Explicar al usuario qué significa su resultado (pLDDT, PAE) |
| Generación de FASTA | A partir del nombre de la proteína, generar la secuencia |
| Agentes (MCP) | Orquestar peticiones automáticas a la API |

---

## 2. Stack Propuesto (tomando la base de los documentos)

### Frontend
```
React (SPA)          → Framework UI principal (mencionado en docs)
Vite                 → Build tool moderno, rápido
Mol* (molstar)       → Visor 3D molecular (recomendación explícita del reto)
Plotly.js / D3.js    → Heatmap de la PAE Matrix
```

### Consumo de la API Mock
```
fetch nativo / axios → Llamadas REST a https://api-mock-cesga.onrender.com
Polling              → GET /jobs/{id}/status cada ~3s hasta COMPLETED
```

### Auth e Historial de Jobs — Supabase ✅ (DECISIÓN OFICIAL)
```
Supabase (BaaS open-source)
  → Auth anónima automática al entrar (sin email ni contraseña)
  → Upgrade opcional a Google OAuth en 1 clic
  → PostgreSQL para guardar metadatos de jobs
  → Row Level Security: cada usuario solo ve sus jobs
  → Región EU (Frankfurt) — cumple GDPR y alineado con valores CESGA
  → Self-hostable en producción en el clúster del CESGA propio
```

**Por qué NO Firebase:**
- Firestore es NoSQL — nuestros datos son tabulares/relacionales
- Datos en servidores Google USA (problema para contexto institucional español)
- No self-hostable — imposible llevarlo al CESGA real en producción
- Supabase permite SQL estándar para queries complejas de historial

**Schema en Supabase:**
```sql
CREATE TABLE jobs (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   uuid REFERENCES auth.users ON DELETE CASCADE,
  job_id    text NOT NULL,
  protein_name text,
  plddt_mean   float,
  solubility   float,
  status       text DEFAULT 'COMPLETED',
  created_at   timestamptz DEFAULT now()
);

-- Solo el dueño puede ver sus jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own jobs" ON jobs
  USING (auth.uid() = user_id);
```

**Código React (auth anónima al entrar):**
```javascript
// Al arrancar la app — login invisible sin pedir nada al usuario
const { data } = await supabase.auth.signInAnonymously()

// El usuario quiere guardar su historial permanentemente:
await supabase.auth.signInWithOAuth({ provider: 'google' })
// → el historial anónimo migra automáticamente a su cuenta real
```

### IA / LLMs (diferenciación)
```
Gemini Flash 2.0 → Protein Copilot (explicación en lenguaje natural)
                 → Chat contextual con datos del job actual
```

### Despliegue rápido (para el hackathon)
```
Vercel / Netlify     → Deploy del frontend en minutos, con URL pública
```

---

## 3. Flujo de Datos — Cómo Conecta Todo

Tal como se describe en los documentos:

```
Investigador (Navegador)
    │
    │  Pega secuencia FASTA
    ▼
Frontend  (React SPA)
    │
    │  POST /jobs/submit
    ▼
API Mock CESGA  (https://api-mock-cesga.onrender.com)
    │
    │  Retorna job_id  →  PENDING → RUNNING → COMPLETED
    ▼
Frontend hace polling  (GET /jobs/{id}/status cada 3s)
    │
    │  Al COMPLETED:  GET /jobs/{id}/outputs
    ▼
Frontend renderiza:
    ├── Mol* / 3Dmol.js  →  Visor 3D (PDB coloreado por pLDDT)
    ├── Heatmap          →  PAE Matrix
    └── Panel resumen    →  pLDDT medio, solubilidad, toxicidad, accounting HPC
```

---

## 4. Endpoints Clave de la API (referencia rápida)

| Método | Endpoint | Qué hace |
|---|---|---|
| `GET` | `/health` | Verificar que la API está activa |
| `GET` | `/proteins/` | Listar las 22 proteínas del catálogo |
| `GET` | `/proteins/samples` | 8 secuencias FASTA listas para copiar |
| `GET` | `/proteins/{id}` | Detalles + `fasta_ready` de una proteína |
| `POST` | `/jobs/submit` | Enviar un job de predicción |
| `GET` | `/jobs/{id}/status` | Estado del job (PENDING/RUNNING/COMPLETED/FAILED) |
| `GET` | `/jobs/{id}/outputs` | Resultados: PDB, pLDDT, PAE, metadatos biológicos |
| `GET` | `/jobs/{id}/accounting` | Consumo ficticio de recursos HPC |
| `GET` | `/jobs/` | Listado de todos los jobs enviados |

---

## 5. Campos de Salida Críticos (outputs a visualizar)

### Confianza estructural
- `plddt_per_residue` → Array de floats, uno por aminoácido. Colorear modelo 3D.
- `plddt_mean` → Indicador global de calidad.
- `plddt_histogram` → Distribución en 4 rangos: `very_high / high / medium / low`.
- `pae_matrix` → Matriz NxN. Renderizar como heatmap 2D.
- `mean_pae` → Error medio global.

### Datos biológicos (diferenciación)
- `solubility_score` (0–100) → ¿La proteína se disuelve en agua?
- `instability_index` → <40 estable, >40 inestable.
- `toxicity_alerts` → Lista de alertas de riesgo.
- `secondary_structure_prediction` → % hélice / lámina beta / coil.

### Accounting HPC (storytelling científico)
- `cpu_hours`, `gpu_hours`, `memory_gb_hours` → Lo que "habría costado" en el CESGA real.

---

## 6. Apuntes de Desarrollo — Consideraciones Clave

1. **Cold-start de la API:** Si no ha recibido peticiones en 15+ minutos, el
   primer request tarda ~30s (servidor gratuito en Render). El frontend debe
   manejar esto mostrando un "Calentando servidor..." amigable.

2. **FASTA format obligatorio:** El campo `fasta_sequence` DEBE comenzar por `>`
   o la API devuelve un error 422. Validar en frontend antes de enviar.

3. **Proteínas del catálogo vs. sintéticas:** Solo las 22 proteínas del catálogo
   devuelven `protein_metadata` real (UniProt, PDB). Las demás devuelven
   `protein_metadata: null` con datos sintéticos. Comunicarlo al usuario.

4. **Polling:** El job pasa por PENDING (~5s) → RUNNING (~5-10s) → COMPLETED.
   Implementar polling con intervalo de 3s y límite de reintentos.

5. **Visor 3D:** El fichero PDB viene como string en `structural_data.pdb_file`.
   Hay que pasarlo al visor como un string o blob, no como URL.

6. **Recursos hardware del submit:** Los docs recomiendan:
   - Proteína pequeña (<100 aa): `gpus: 0, cpus: 4, memory_gb: 8`
   - Proteína mediana: `gpus: 1, cpus: 8, memory_gb: 32`
   - Proteína grande (>300 aa): `gpus: 2-4, cpus: 16-32, memory_gb: 64-128`

7. **Renderizado del PAE Heatmap:** AlphaFold devuelve los datos crudos matemáticos (`pae_matrix`: array 2D bidimensional), NO una foto. Para generar el Heatmap en React usaremos `react-plotly.js`.
   - Eje Z: pasamos el array directamente.
   - Plot type: `heatmap`.
   - Colorscale: Invertida (bajos errores = color fuerte/azul, alto error = color claro/rojo).
   - Ejemplo de código rápido:
     ```javascript
     <Plot
       data={[{
         z: data.pae_matrix,
         type: 'heatmap',
         colorscale: 'RdBu',
         reversescale: true
       }]}
       layout={{ title: 'Error Espacial Predicho (PAE)' }}
     />
     ```
