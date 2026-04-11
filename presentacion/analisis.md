# Análisis estratégico — LocalFold

> **Esto no es un reto. Es una misión.**
> Un reto se gana el sábado. Una misión trasciende el hackathon.
> LocalFold existe porque hay un problema real que frena el progreso científico, y hay personas que sufren mientras ese progreso tarda.

---

## 1. Problema

Los investigadores en bioinformática que necesitan predecir estructuras proteicas con AlphaFold 2 se enfrentan a una barrera técnica severa: acceder al supercomputador CESGA FinisTerrae III requiere conocimientos de Linux, SLURM, scripting HPC y gestión manual de ficheros de output. Este proceso puede consumir días antes de obtener un resultado interpretable.

**Consecuencia directa:** investigadores con perfil biológico pero no informático quedan excluidos de una herramienta que podría acelerar significativamente su trabajo. El tiempo científico se desperdicia en infraestructura.

**Magnitud:** En España operan más de 50 grupos de investigación en bioinformática estructural. Todos ellos tienen acceso potencial al CESGA. Ninguno tiene hoy una interfaz como LocalFold.

---

## 2. Solución

LocalFold es una plataforma web que abstrae completamente la complejidad del HPC. El investigador sube una secuencia FASTA, selecciona los recursos de cómputo y recibe una predicción estructural completa con visualización 3D interactiva, métricas de confianza y análisis asistido por IA.

**El proceso completo:**
1. Pegar secuencia FASTA o subir fichero
2. Seleccionar preset de recursos (Alta / Intermedia / Baja fiabilidad)
3. LocalFold gestiona el job en CESGA automáticamente
4. Resultado: visor 3D con pLDDT coloreado, heatmap PAE, descarga PDB/JSON/LaTeX/PDF
5. ProteIA analiza la estructura y responde preguntas científicas en lenguaje natural

---

## 3. Propuesta de valor

| Para quién | Qué obtienen | Sin LocalFold |
|---|---|---|
| Investigador biólogo | Predicción estructural sin abrir terminal | Depende del departamento IT |
| Grupo de investigación | Workspace colaborativo con proyectos compartidos | Ficheros por email o Dropbox |
| Bioinformático avanzado | Acceso directo a PDB, JSON, LaTeX para pipelines | SSH + scripts manuales |

**Diferenciador clave frente a alternativas:**
- **AlphaFold Server (Google DeepMind):** no conecta con CESGA, limitado a 10 jobs/día, sin colaboración
- **ColabFold:** requiere Jupyter, sin interfaz, sin análisis IA integrado
- **LocalFold:** HPC real + UX accesible + ProteIA + colaboración en tiempo real

---

## 4. Propuesta de valor — ProteIA

ProteIA es el componente de mayor diferenciación. Es un asistente de IA especializado en proteínas integrado directamente en el visor de resultados. Puede:

- Interpretar scores pLDDT y PAE en términos biológicos
- Identificar regiones intrínsecamente desordenadas y su implicación funcional
- Sugerir experimentos de mutagénesis o validación experimental
- Responder preguntas en lenguaje natural sobre la estructura predicha
- Contextualizar los resultados con literatura científica relevante

**Por qué importa:** Un investigador sin experiencia en bioinformática estructural puede obtener una interpretación científica de calidad de su predicción sin necesidad de colaborar con un experto externo.

---

## 5. Mercado objetivo

**Primario:** Investigadores académicos en bioinformática, biología estructural y bioquímica en universidades y centros de investigación españoles con acceso al CESGA.

**Secundario:** Grupos de investigación en farmacéuticas y biotecnología que trabajan en diseño de proteínas, drug discovery o análisis de variantes patogénicas.

**Expansión potencial:** Cualquier institución europea con acceso a infraestructura HPC que quiera democratizar el uso de AlphaFold 2 entre sus investigadores.

---

## 6. Impacto real

LocalFold no hace nueva ciencia. No mejora AlphaFold. Lo que hace es **eliminar la fricción** entre un investigador y una herramienta que ya existe. El impacto no es el descubrimiento — es la velocidad a la que puede llegar.

**Y la velocidad en ciencia médica se traduce en vidas.**

### Dónde el impacto es más tangible
En enfermedades donde las proteínas mal plegadas son el mecanismo central — ELA, Alzheimer, Parkinson, Huntington. En España: ~800.000 personas con Alzheimer, ~4.000 nuevos casos de ELA al año. Los grupos que investigan estas enfermedades en la USC, CSIC o CiMUS son exactamente el usuario de LocalFold.

### Impacto concreto y medible
- **Tiempo:** cada predicción que antes requería días de configuración HPC, con LocalFold está lista en minutos
- **Acceso:** investigadores sin perfil técnico pueden usar AlphaFold 2 sin depender del departamento IT
- **Colaboración:** equipos multidisciplinares trabajando sobre los mismos resultados en tiempo real
- **Conocimiento:** ProteIA democratiza la interpretación estructural — ya no hace falta ser bioinformático para entender los resultados

### El techo real
El impacto a largo plazo depende de que CESGA y las instituciones adopten LocalFold en producción. Como prototipo demuestra que es posible y necesario. El siguiente paso es institucional — y ese paso, si se da, cambia cómo se hace ciencia en Galicia y en España.

---

## 7. Tecnología

| Componente | Tecnología | Rol |
|---|---|---|
| Frontend | React + Vite + Tailwind | Interfaz web |
| Autenticación | Firebase Auth (Google OAuth) | Acceso seguro |
| Base de datos | Firebase Firestore | Jobs, proyectos, usuarios |
| HPC Backend | CESGA FinisTerrae III | Cómputo AlphaFold 2 |
| Orquestación | n8n + webhooks | Pipeline de jobs |
| IA | Google Gemini (vía n8n) | ProteIA asistente |
| Visualización 3D | pdbe-molstar (Mol*) | Visor estructural |
| Exportación | jsPDF, html2canvas, LaTeX | Informes científicos |

**Punto técnico diferenciador:** La integración con CESGA es real. No es una simulación — los jobs se ejecutan en nodos GPU A100 del supercomputador más potente de España.

---

## 8. Posicionamiento de marca

- **Nombre:** LocalFold
- **Slogan:** *Despliega el futuro.*
- **Tono:** Científico pero accesible. Serio sin ser frío.
- **Arquetipo:** Sage + Magician — saber profundo que transforma.
- **Inspiración filosófica:** La visión de Demis Hassabis sobre la IA como instrumento para acelerar el entendimiento humano del universo. LocalFold no es una interfaz — es el acceso a ese entendimiento para quienes más lo necesitan.

---

## 9. Ventajas competitivas sostenibles

1. **Integración nativa con CESGA** — no replicable sin acuerdo institucional
2. **ProteIA especializado** — un asistente genérico no tiene el contexto estructural que tiene ProteIA
3. **Flujo end-to-end en una sola plataforma** — submit, tracking, visualización, análisis, exportación, colaboración
4. **Diseñado para el investigador**, no para el ingeniero

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| API CESGA inestable en demo | Job pre-lanzado antes de presentar; datos de fallback listos |
| Jurado no técnico no entiende proteínas | Narrativa centrada en enfermedades humanas, no en bioinformática |
| Otros grupos tienen producto similar | ProteIA + colaboración son únicos; formato presentación diferente |
| Cold start del servidor mock | Hacer petición de warm-up 2 min antes de presentar |
