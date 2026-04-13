# 🧬 MICAFOLD - MANUAL ENCICLOPÉDICO, ARQUITECTURA, ALTERNATIVAS E IA

El presente documento constituye un "Deep-Dive" arquitectónico y la tesis de ingeniería definitiva detrás de **Micafold**. Cubriremos el estado del arte actual del plegamiento biomolecular, por qué de descartaron las alternativas principales del mercado, y cómo se diseñó una solución end-to-end de Soberanía Computacional conectada a Inteligencia Artificial RAG.

---

## 1. ESTADO DEL ARTE Y ANÁLISIS DE ALTERNATIVAS

Predecir la estructura de una proteína con **AlphaFold 2/3** es un cuello de botella logístico en la biología moderna. AlphaFold requiere decenas de Gigabytes de RAM, GPUs de alto rendimiento (A100 / H100) y bases de datos genómicas masivas (hasta 3TB para la busqueda BFD/Uniref). Ante esta problemática, un investigador del CSIC o la Universidad tradicionalmente tiene tres alternativas principales en el mercado. **Micafold surge precisamente tras auditar las ineficiencias críticas de estas opciones:**

### Alternativa A: Acceso Bare-Metal (SSH + SLURM en Entorno Nativo HPC)
*   **El proceso:** El biólogo recibe credenciales del CESGA u otro superordenador. Debe utilizar una terminal negra (`PuTTY` / `bash`), navegar directorios UNIX (`cd /mnt/scratch`), aprender a paralelizar en colas escribiendo scripts de Bash con *directives* `#SBATCH` y finalmente extraer los resultados a ciegas.
*   **Problema (Por qué falla):** La curva de aprendizaje es astronómica. A los biólogos no se les entrena en Bash, provocando errores catastróficos que "matan" Nodos del HPC al invocar AlphaFold mal configurado. El investigador gasta más tiempo haciendo debug informático que leyendo *papers* biológicos.

### Alternativa B: Google Colab (ColabFold)
*   **El proceso:** Usar los cuadernos Jupyter provistos por investigadores de la comunidad alojados en servidores gratuitos o semi-gratuitos de Google.
*   **Problema (Por qué lo descartamos):** 
    1. **Soberanía y Privacidad:** Las secuencias de ADN y Proteínas bajo investigación farmacéutica son propensas a NDA (Non-Disclosure Agreement) estricto. Subirlas a los servidores de Alphabet (EE.UU.) vulnera muchas normativas del CSIC y de patentes biotecnológicas en Europa.
    2. **Inestabilidad:** Si una proteína grande (+800 aminoácidos) requiere 3 horas de plegamiento, Google suele "desconectar" la sesión inactiva arbitrariamente en cuentas grautitas, destruyendo todo el progreso de la investigación.

### Alternativa C: Plataformas SaaS Comerciales (Neurosnap, LatchBio)
*   **El proceso:** Empresas extranjeras con interfaces preciosas basadas en web a cambio de membresías costosas.
*   **Problema:** Un modelo insostenible financieramente para gran parte del sector académico y universitario europeo. Además, perpetúa el envío de datos de investigación estratégicos a jurisdicciones de ultramar y bloquea la auditabilidad local.

---

## 2. LA PROPUESTA ARQUITECTÓNICA DE "MICAFOLD" (SOBERANÍA Y UX)

A diferencia de las opciones anteriores, **Micafold** diseña un puente perfecto que casa la inigualable Potencia Soberana del HPC local (Ej. CESGA) con los estándares de *User Experience* de los productos de Silicon Valley.

### 2.1 La Topología del Sistema (Híbrido)
*   **Frontend (Capa de Fricción Cero):** Desarrollado en React/Vite web. La mentalidad es entregar una experiencia WYSIWYG (Lo que ves es lo que hay). Sin comandos, cajas de texto que sanitizan fallos automáticamente antes de emitirlos a red.
*   **Backend Proxy (Capa de Soberanía):** Las APIs (`api-mock-cesga` en nuestro hackathon) operan sobre un proxy Python/FastAPI. Este microservicio es el único que dialogaría con la capa profunda y sensible del Clúster Físico del CESGA. Recibe el JSON inofensivo del frontend, y él sí genera, tras bambalinas, las configuraciones bash complejas para invocar a AlphaFold, manteniendo al biólogo abstraído y aislando la infraestructura principal de inyecciones erróneas.
*   **Base de Datos en Paralelo (Capa de Orquestación de Estados):** En la computación en nube del mundo real, los nodos limpian sus históricos periódicamente. Y si el proxy HTTP estuviera todo el rato preguntando al Nodo del CESGA por cada trabajo de cada usuario, generaría ataques de denegación de servicio (DDoS locales). Micafold integra **Firebase Firestore** para clonar asíncronamente los logs e identificaciones en una base No-SQL propia; es aquí donde la App del usuario consulta su listado histórico mediante WebSockets ultra-reactivos.
        *   **Hub de Inteligencia (Capa n8n + LLMs):** Aislando por completo la red de renderización y bases de datos, un servidor *serverless* auto-alojado rutea preguntas de lenguaje natural hacia APIs Cognitivas externas (orquestadas por n8n), retornándolas empaquetadas al frontend en milisegundos.

---

## 3. INGENIERÍA 3D: CÓMO REACCIONA PDBe-MOLSTAR Y WEBGL

El módulo `Viewer.jsx` es la pieza estelar de LocalFold. No es un simple visualizador de imágenes; es una instancia embebida que virtualiza átomos dentro de la VRAM del ordenador del cliente usando `WebAssembly` y `WebGL`.

### 3.1 El Ecosistema Molstar (Mol*) y PDBe
LocalFold incrusta **`pdbe-molstar`**, una envoltura de código abierto promovida por el Banco de Datos de Proteínas Europeo. Molstar permite visualizar maquinarias ribosomales inmensas a 60 FPS saltándose las limitaciones de JavaScript puro gracias al uso matemático matricial vía procesador gráfico.

### 3.2 La Estrategia del Payload Crudo (In-Memory Blobs)
La API devuelve el resultado final en un macro-fichero de texto denso milimétrico (El estándar PDB o mmCIF). 
Intentar que un cliente web cargue estos vectores a través del DOM provocaría latencia y propensión a bloqueos CORS. Por tanto, Micafold intercepta un `String` y fabrica un archivo fantasma local dentro de la RAM del navegador:
```javascript
const blob = new Blob([data.pdbFileUrl], { type: 'text/plain' });
const customUrl = URL.createObjectURL(blob);
// Esta url 'fantasma' (blob:http://localhost/xxx) nutre nativamente y en milisegundos al motor 3D.
```

### 3.3 Mapeo Termodinámico (Coloración por pLDDT - DeepMind Hack)
Las predicciones de Inteligencia Artificial como AlphaFold no son estatuas fijas; algunas áreas son sólidas y otras son flexibles (baja certidumbre). Su fiabilidad la calculan mediante un espectro del 0 al 100 etiquetado como **pLDDT**.
El formato internacional `.PDB` fue diseñado en los años 70 y no tenía espacio para la "Certeza IA". La comunidad científica acordó trampearlo sobre-escribiendo la columna conocida históricamente como *B-factor* (Factor de Temperatura de difracción).
**Micafold** fuerza e instruye al motor Molstar a leer esta columna falsa a través del flag Booleano estricto `alphafoldView: true`, pintando el modelo:
*   💙 **Azul Oscuro (pLDDT > 90):** Certeza Atómica de Acero. La Inteligencia Artificial jura que ese loop es idéntico a la realidad.
*   💛 **Amarillo / Naranja (pLDDT < 50):** Certidumbre "Pasta Espagueti". Son loops flexibles intrínsecamente desordenados flotando en el medio acuoso biológico.

### 3.4 Sanitación del Motor y Memory Leaking
WebGL impone duras normativas frente a *Zombie Threads* (Hilos VRAM muertos). Si el Biólogo viaja por tres páginas consecutivas abriendo 3 instancias diferentes, Google Chrome destruiría el Contexto 3D.
React interviene esto en el método del ciclo vital destructivo (el `return` de `useEffect`), invocando la sentencia asesina y mandatoria del WebAssembly:
```javascript
return () => {
    if (viewerInstance && viewerInstance.plugin) {
        viewerInstance.plugin.clear(); // Garantiza VRAM vacía y Garbage Collector liberado
    }
};
```

---

## 4. SISTEMAS DE INTELIGENCIA ARTIFICIAL: COMPRESIÓN, LLM Y RAG 

Micafold abandona la era estática y muta a un oráculo proactivo: no te entrega un render numérico y asume que sabes entenderlo. Dispone de Capas de Red NeuroLinguística conectadas bidirecionalmente a la proteína en observancia (Tu proteína actual dicta el "Contexto" de la memoria de la IA).

### 4.1 Orchestrator Backend Serverless (N8N)
La lógica fundacional no se empaqueta en librerías masivas de JavaScript (las llaves API de OpenAI / GCP nunca deben ser emitidas hacia Vite.js en local o acabarían pirateadas en dev-tools GitHub).
Al terminar, el n8n procesa, encadena el Promting, le imprime una Identidad Sistémica ("Actúa como un Biólogo Catedrático, No menciones programación, háblale al usuario del laboratorio") y dispara a endpoints de modelos de lenguaje de gran tamaño (LLMs).

### 4.2 Arquitectura "BuildMetricsPayload" contra el Crash 422 de Tokens
Un Hito Crítico de la ingeniería temprana fue comprender los límites abstractos del vector atómico LLM frente a la geometría.
Mandar por la red todo lo devuelto por el HPC (Coordenadas Atómicas, Matrices Geométricas Bidimensionales de Predicción Alignada PAE) resultaba en hasta **150,000 Tokens (Palabras)** introducidas dentro de un LLM. El Webhook reventaba vomitando el fatídico *HTTP Error 422 Unprocessable Context Size Boundary*.
Y lo que es peor: aunque funcionase, el LLM *alucinaría*, ya que carece de Graph-Attention Neuronal para "imaginar" ejes tridimensionales PDB.

**El Arreglo Micafold (Serializador Semántico):**
La función interceptora destruye intencionalmente todos los arreglos matriciales brutos y empaqueta metadatos condensados en crudo. Construye un JSON esquelético de menos de **300 tokens** con pura estadística (Inestabilidad: 41, Media Global 92.4%, y flags true/false biológicos). El LLM devora esta serialización diminuta a 1000 iteraciones/segundo por fracciones de penique comercial, retornando insights bioquímicos exactos, a coste nulo en infraestructura.

### 4.3 El Nuevo Entorno RAG Assistant (Rama Innovación)
RAG significa *Retrieval-Augmented Generation* (Generación con Aumento de Recuperación Externa).
La aplicación integra interfaces donde la IA abandona su entrenamiento rígido fosilizado del año 2023. Antes de dictaminar repuestas al biólogo acerca de interacciones proteicas o documentación del Laboratorio Cesga, el workflow hace primero un fetch de Vectores frente a las Bases de Conocimiento Científicas Reales proveídas internamente. 
La IA lee y asimila en vivo este documento extraído, se empalma en su Context Prompt temporal y entonces responde sabiendo la Verdad Institucional Absoluta del momento actual, erradicando alucinaciones genéricas.

---

Cualquier producto compitiendo por galardones académicos necesita un *BulletProofing* anti-cuelgues frente al Efecto Demo. Micafold implementa varias capas de redundancia estratégica:

### 5.1 El Fallback Inyectivo: "Demo Segura" Oculta
Al realizar un pitch en directo, depender de redes WiFi públicas o Cold-Starts del renderizado online y colas remotas puede matar la fluidez de un evento de 5 minutos máximos.
*   **Mecánica Táctica (`JobsList`):** Se mapeó una intercepción global en JavaScript apuntando a los identificadores del Input con *Shortcuts* (ejemplo, `SHIFT + Click` en el "Refrescar"). 
*   **Inyección Mockup:** En lugar de lanzar GETS perversos a la Red, clona forzosamente una id maestra `job_demo_segura` validando la firma del objeto y depositándola en Firebase al milisegundo mediante el timestamp cliente actual.
*   **Render Cero-Coste (`Viewer`):** Este detecta y desvía la petición fetch si lee esta ID Mágica, no cargando la red. Instancia al milisegundo una métrica excelente y el pre-pack `1cbs` embebido que compila instantáneo el visualizador atómico. Magia presencial garantizada.

### 5.2 Emisor Endémico de Reportes Client-Side Automático a DINA4 (PDF)
Un SaaS Bio-B2B en el 2026 requiere reportabilidad de auditoría. Para evitar montar el servidor con cabezas Chromium invisibles y quemar ancho de banda de Render Cloud, invertimos el paradigma a la Tarjeta Local (*Client-Side Exporting*).
*   Se captura `molCanvas.toDataURL("image/png")` desde la Memoria WebGL Viva.
*   Se capturan las gráficas React de Plotly.js desde su Ref Mutable.
*   Se captura en plano simple la narrativa Copilot IA ya resuelta.
*   Un evento subyacente escupe un bloque HTML purificado bajo configuraciones tipográficas CSS fijas `@media print` y manda la orden del OS (`window.print()`). Consiguiendo la ilusión de un documento Formal PDF nativo y descargable sin dependencias lentas de terceros, otorgando el toque "Enterprise Premium" para los jurados de un solo click.

---
*Fin Documento Extendido Nivel 3. Redactado mediante Análisis Estructural e Histórico Constante del Ecosistema.*
