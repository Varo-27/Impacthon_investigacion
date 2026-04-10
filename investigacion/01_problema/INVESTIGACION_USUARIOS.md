# Investigación de Usuario — ¿A quién ayudamos y qué necesitan realmente?

Este documento profundiza en el perfil del investigador al que servimos,
sus flujos de trabajo reales, y qué funcionalidades de valor añadido
podrían marcar la diferencia en LocalFold frente a herramientas existentes.

---

## 1. Perfiles de Usuario (más granulares)

### Perfil A — El Biólogo Molecular / Bioquímico de laboratorio
- **Contexto:** Trabaja en laboratorio húmedo. Su día a día es cultivos,
  geles, secuenciación, PCR. Sabe leer un paper de estructura pero nunca
  ha usado una terminal Linux.
- **Qué quiere de LocalFold:** Pegar su secuencia, ver la proteína en 3D,
  entender si es fiable su estructura, descargar el PDB para presentarlo
  en reunión o incluirlo en una publicación.
- **Bloqueante actual:** Depende de un bioinformático del grupo solo para
  lanzar el job en el clúster. Puede tardar días en obtener resultados.

### Perfil B — El Investigador Clínico / Medicina Personalizada
- **Contexto:** Trabaja con muestras de pacientes (tumores, variantes
  genéticas raras). Necesita entender cómo una mutación específica
  modifica la función de una proteína para orientar el tratamiento.
- **Qué quiere de LocalFold:** Poder modelar la proteína mutada del
  paciente (secuencia no publicada, privada), comparar visualmente con la
  proteína sana, identificar si la mutación afecta a un sitio de unión
  conocido o un dominio funcional.
- **Bloqueante actual:** No puede subir datos a servidores de terceros
  (Google Colab, AlphaFold Server público) por normativa de privacidad
  médica (GDPR, normativa hospitalaria). El CESGA garantiza que los datos
  no salen del clúster institucional.

### Perfil C — El Investigador en Descubrimiento de Fármacos
- **Contexto:** Busca dianas terapéuticas, estudia si una proteína tiene
  "pockets" o cavidades donde podría encajar un fármaco (druggability).
- **Qué quiere de LocalFold:** Ver la estructura 3D de la diana, identificar
  cavidades superficiales, entender la estabilidad de la proteína
  (instability index), obtener el fichero PDB para pasarlo a herramientas
  de docking externas (AutoDock, Glide).
- **Bloqueante actual:** Necesita varias herramientas encadenadas: CESGA
  para predecir, PyMOL para visualizar, scripts Python para extraer métricas.
  Todo separado, todo manual, todo con curva de aprendizaje alta.

### Perfil D — El Estudiante de Máster / Doctorado
- **Contexto:** Primer o segundo año, aprendiendo a utilizar herramientas
  computacionales. Quiere hacer sus propios análisis sin depender eternamente
  del director de tesis.
- **Qué quiere de LocalFold:** Una interfaz que le enseñe mientras usa.
  Tooltips que expliquen qué es el pLDDT. Un flujo guiado (wizard) que
  no le haga perderse. Resultados que pueda exportar para su TFM.

---

## 2. Flujos de Trabajo Reales (¿cómo usan la estructura que obtenemos?)

Una vez que el investigador tiene la estructura predicha, la usa para:

### 2.1 Anotación Funcional de Proteínas
Identificar si la proteína tiene dominios o motivos conocidos comparando
su estructura con proteínas ya caracterizadas. Pregunta clave que se hacen:
*"¿A qué familia pertenece esta proteína? ¿Qué función podría tener?"*

### 2.2 Análisis de Mutaciones (Medicina Personalizada)
Modelan tanto la proteína sana como la versión con la mutación del paciente:
- ¿La mutación está en el sitio activo?
- ¿Cambia significativamente la estructura global?
- ¿Aumenta o reduce la estabilidad (instability index)?

### 2.3 Descubrimiento de Fármacos (Drug Discovery)
Usan la estructura 3D para hacer "virtual screening": buscar qué moléculas
pequeñas podrían encajar en los "bolsillos" de la proteína.
El PDB generado se importa directamente en herramientas de docking.

### 2.4 Validación de Experimentos
Usan la predicción como modelo inicial para resolver mapas de densidad
electrónica (rayos X) o datos de cryo-EM. Acelera enormemente el proceso
experimental.

### 2.5 Publicación Científica
Necesitan incluir figuras de estructura 3D en sus papers. Quieren una
imagen de la proteína coloreada, orientada de forma bonita y exportable.

---

## 3. Necesidades Identificadas → Funcionalidades Propuestas

Basado en los flujos reales de trabajo y la investigación sobre usabilidad:

### NECESIDAD 1: Interpretación del resultado sin conocer la jerga computacional
**Problema:** Los biólogos no saben qué significa un pLDDT de 72 sin contexto.
**Funcionalidad propuesta:**
- Texto explicativo automático adaptado al resultado:
  *"Tu proteína tiene alta confianza en el 60% de su estructura. Las regiones
  naranja probablemente sean zonas desordenadas, lo cual es biológicamente
  normal en proteínas de señalización."*
- Tooltips educativos en cada métrica (pLDDT, PAE, instability index).
- **Implementación:** LLM (GPT/Gemini) que genere un resumen en lenguaje
  natural del resultado a partir de los datos de la API.

### NECESIDAD 2: Análisis de Mutaciones (comparación sano vs. mutado)
**Problema:** Los investigadores clínicos necesitan comparar dos estructuras.
**Funcionalidad propuesta:**
- Formulario "Análisis de variante": permite introducir la secuencia original
  y la secuencia mutada, y ver ambas estructuras en paralelo.
- Resaltado automático de los residuos que cambian entre ambas.
- **Valor:** Directamente útil en medicina personalizada (Cátedra Camelia).

### NECESIDAD 3: Gestión de múltiples jobs / historial
**Problema:** Los investigadores envían docenas de secuencias a lo largo de
un proyecto. Necesitan poder comparar, retomar y organizar.
**Funcionalidad propuesta:**
- Dashboard tipo "mis predicciones": tabla con historial de jobs enviados,
  sus estados y acceso rápido a los resultados.
- Filtrado por nombre, fecha o estado.

### NECESIDAD 4: Compartir resultados con colaboradores
**Problema:** Un investigador quiere mostrar el resultado a su director o
un colega sin que tenga que instalar nada.
**Funcionalidad propuesta:**
- Botón "Compartir resultado": genera una URL pública con la vista del
  visor 3D + métricas de ese job específico.
- Vista de "solo lectura" sin necesidad de cuenta.

### NECESIDAD 5: Exportación útil para publicación
**Problema:** Necesitan figuras de calidad para papers. Los visores actuales
no siempre permiten exportar fácilmente.
**Funcionalidad propuesta:**
- Exportar imagen PNG/SVG de la estructura 3D en la orientación actual.
- Exportar el heatmap PAE como imagen.
- Descarga de PDB, mmCIF, JSON de confianza con un solo clic.

### NECESIDAD 6: Contextualización biológica automática
**Problema:** Si el investigador no conoce la proteína (ej. novel sequence),
no sabe qué función buscar ni a qué familia pertenece.
**Funcionalidad propuesta:**
- Enlace automático a UniProt si se detecta la proteína en el catálogo.
- Si no está en catálogo: usar un LLM para generar un contexto inicial
  basado en la secuencia (*"Esta secuencia tiene características de
  proteínas de la familia kinasa..."*).

### NECESIDAD 7: Advertencias claras sobre limitaciones del modelo
**Problema:** Los biólogos pueden sobre-interpretar una estructura predicha
y tomar decisiones basadas en regiones de baja confianza.
**Funcionalidad propuesta:**
- Banner automático si `plddt_mean < 50`: *"Atención: esta estructura tiene
  baja confianza global. Úsala solo como orientación inicial."*
- Resaltado visual de regiones IDR (intrínsecamente desordenadas).

---

## 4. Priorización de Funcionalidades (MoSCoW)

| Prioridad | Funcionalidad |
|---|---|
| **Must have** | Visor 3D con coloreado pLDDT |
| **Must have** | Heatmap PAE |
| **Must have** | Panel resumen de métricas en lenguaje claro |
| **Must have** | Flujo de job (PENDING → RUNNING → COMPLETED) |
| **Should have** | Explicación en lenguaje natural con LLM |
| **Should have** | Historial de jobs |
| **Should have** | Advertencias automáticas de baja confianza |
| **Could have** | Modo comparación (sano vs. mutado) |
| **Could have** | Compartir resultado por URL |
| **Could have** | Exportar imagen del visor |
| **Won't have (hackathon)** | Autenticación de usuarios real |
| **Won't have (hackathon)** | Conexión al CESGA real |

---

## 5. Conclusión: ¿Qué diferencia a LocalFold?

La diferencia no está en hacer mejores predicciones (eso lo hace AlphaFold).
Está en **traducir el resultado científico al lenguaje del investigador**.

Las herramientas actuales hablan el idioma del informático (JSONs, terminales,
ficheros PDB crudos). LocalFold hablará el idioma del biólogo: texto claro,
visuales intuitivos, alertas comprensibles y contexto biológico automático.
