# Identidad de Marca — LocalFold

## Nota importante sobre el nombre

El reto oficial se llama **"LocalFold"** — nombre dado por los organizadores (GDG Santiago / Catedra Camelia). Para el hackathon, este nombre ya esta establecido en la documentacion publica. Sin embargo, para la presentacion y narrativa de marca del equipo, se puede adoptar un nombre propio como capa de identidad visual encima.

**Opciones:**
- Mantener **LocalFold** — reconocible, ya aparece en toda la documentacion del reto
- Adoptar **Solux** — identidad propia del equipo, mas memorable como marca

**Recomendacion:** Usar **LocalFold** como nombre del producto y **Solux** como nombre del equipo/estudio que lo construye. Ejemplo: *"Solux presents: LocalFold"*

---

## 1. Propuesta de valor central

> LocalFold democratiza el plegamiento de proteinas. Convierte el superordenador mas potente de Galicia en una herramienta que cualquier biologo puede usar sin abrir una terminal.

---

## 2. Jerarquia de marca

```
PROPOSITO
Eliminar la barrera tecnica entre los biologos y la IA de prediccion estructural.

VISION
Un mundo donde cualquier investigador puede predecir estructuras proteicas
con la misma facilidad que usa Google Scholar.

MISION
Construir la interfaz web mas intuitiva posible para el acceso al CESGA,
haciendo invisible la complejidad del HPC.

VALORES
- Accesibilidad sobre perfeccion tecnica
- Transparencia (el usuario siempre sabe que esta pasando)
- Soberania de datos (las secuencias no salen del cluster)
- Ciencia abierta

PERSONALIDAD
Sage + Magician — hace visible lo invisible, convierte datos complejos
en comprension intuitiva sin jerga tecnica.
```

---

## 3. Posicionamiento

**Para** investigadores y estudiantes de biologia/farmacia  
**que necesitan** predecir estructuras proteicas sin conocimientos de HPC,  
**LocalFold** es un portal web  
**que convierte** la potencia del superordenador CESGA en una experiencia de usuario accesible.  
**A diferencia de** ColabFold (privacidad), SSH bare-metal (curva de aprendizaje) o SaaS comerciales (coste y dependencia de terceros),  
**nosotros** mantenemos los datos dentro del cluster gallego con una interfaz de nivel Silicon Valley.

---

## 4. Arquetipo de marca

**Sage + Magician**

| Dimension | Descripcion |
|---|---|
| Deseo | Convertir lo complejo en comprensible |
| Estrategia | Hacer visible lo invisible |
| Voz | Experta pero accesible, nunca condescendiente |
| Ejemplos de referencia | AlphaFold DB (EMBL-EBI), Notion, Linear |

---

## 5. Identidad visual

### Paleta de color

| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| Primario | Azul CESGA | `#0A2463` | Headers, navegacion, elementos principales |
| Secundario | Cian biotech | `#3CEFFF` | Destacados, estados activos, datos |
| Acento positivo | Verde confianza | `#00C48C` | pLDDT alto, COMPLETED, exito |
| Acento alerta | Naranja inestable | `#FF8C42` | pLDDT bajo, RUNNING, advertencias |
| Fondo dark | Carbon lab | `#0D1117` | Fondo principal (dark mode) |
| Fondo card | Gris oscuro | `#161B22` | Tarjetas, paneles |
| Texto principal | Blanco suave | `#E6EDF3` | Texto primario |
| Texto secundario | Gris claro | `#8B949E` | Metadatos, labels |

> El esquema de colores intencionalmente refleja el sistema de coloreado pLDDT de AlphaFold (azul = alta confianza, naranja = inestable), creando coherencia entre la marca y la ciencia.

### Tipografia recomendada

| Uso | Fuente | Peso |
|---|---|---|
| Display / Hero | Inter o Space Grotesk | Bold 700 |
| Headings | Inter | Semibold 600 |
| Body / Contenido | Inter | Regular 400 |
| Codigo / Secuencias FASTA | JetBrains Mono | Regular 400 |
| Labels / UI | Inter | Medium 500 |

### Logo conceptual

**Tipo recomendado:** Combination mark (simbolo + wordmark)

**Simbolo:** Helix doble estilizada o estructura de ribbon proteico simplificada, en gradiente de azul a cian.

**Wordmark:** "LocalFold" en Inter Bold, con el "Local" en azul primario y "Fold" en cian.

**Variantes:**
- Version completa: simbolo + wordmark (uso en header, documentos)
- Version icono: solo el simbolo (favicon, app icon)
- Version monotono: blanco sobre fondo oscuro

---

## 6. Voz y tono

### Atributos de voz

```
CLARO
No somos: tecnicos, llenos de jerga HPC
Si somos: directos, comprensibles, usamos lenguaje de laboratorio

EXPERTO
No somos: superficiales, divulgadores excesivamente simples
Si somos: precisos, rigurosos, confiables cientificamente

ACCESIBLE
No somos: intimidantes, complejos, para ingenieros
Si somos: orientados al biologo, empáticos con quien no sabe de terminales

TRANSPARENTE
No somos: opacos sobre el proceso, "caja negra"
Si somos: siempre comunicando que esta pasando (PENDING/RUNNING)
```

### Tono por contexto

| Contexto | Tono | Ejemplo |
|---|---|---|
| Onboarding / intro | Motivador, claro | "Pega tu secuencia FASTA y deja que el CESGA haga el resto" |
| Estado PENDING | Tranquilizador | "Tu proteina esta en cola. Tiempo estimado: 2–5 minutos" |
| Estado RUNNING | Informativo | "AlphaFold esta calculando los pliegues. Procesando 342 residuos..." |
| Estado COMPLETED | Celebratorio | "Estructura lista. pLDDT medio: 87.3 — excelente confianza" |
| Errores | Empático, util | "Algo salio mal con la conexion. Tus datos estan seguros — intenta de nuevo" |
| Tooltips educativos | Docente, conciso | "pLDDT: confianza del modelo. >90 = muy fiable (azul). <50 = region flexible (naranja)" |

---

## 7. Mensajes clave (para el pitch)

### El problema (30 segundos)
> "AlphaFold2 es una de las mayores revoluciones cientificas del siglo. Pero usarlo requiere Linux, GPUs, 3 terabytes de datos y saber escribir scripts de superordenador. El 90% de los biologos estan excluidos de su propia herramienta."

### La solucion (30 segundos)
> "LocalFold es la interfaz que faltaba. Pegas tu secuencia, nosotros nos encargamos del resto. La potencia del CESGA Finis Terrae III, con la sencillez de una web."

### El diferenciador (15 segundos)
> "A diferencia de Google Colab, tus secuencias nunca salen de Galicia. A diferencia de las herramientas existentes, no necesitas saber nada de terminales."

### El impacto (15 segundos)
> "Este prototipo es la base del portal real que se desplegara en el CESGA. Tu codigo hoy, la herramienta de la ciencia manana."

---

## 8. Taglines

| Opcion | Tagline | Contexto de uso |
|---|---|---|
| Principal | *"Structure meets insight"* | Header de la app, presentaciones |
| Alternativa ES | *"La ciencia, sin la terminal"* | Pitch en espanol |
| Alternativa tecnica | *"AlphaFold. Sin el dolor."* | Audiencias tecnicas |
| Inspiracional | *"Tu codigo hoy. La herramienta de la ciencia manana."* | Slide final del pitch |

---

## 9. Aplicaciones de marca

### Pantalla principal (Hero)
- Fondo dark (`#0D1117`)
- Campo de texto FASTA prominente, con placeholder: `>mi_proteina\nMKTIIALSYIFCLVF...`
- Boton de submit en cian (`#3CEFFF`) con texto oscuro
- Subtitulo: *"Powered by CESGA Finis Terrae III + AlphaFold2"*

### Dashboard de resultados
- Visor 3D ocupa 60% del viewport
- Panel lateral con metricas (pLDDT, solubilidad, toxicidad)
- Heatmap PAE debajo del visor
- Botones de descarga al final

### Estados de job
- PENDING: reloj animado, color gris, texto tranquilizador
- RUNNING: barra de progreso animada en cian, logs simulados
- COMPLETED: check verde, transicion fluida al visor 3D
- FAILED: icono de alerta en naranja, mensaje de error util + boton reintentar

---

## 10. Referencias visuales

| Referencia | Por que | URL |
|---|---|---|
| AlphaFold Database | Referencia visual principal, mismo visor Mol* | alphafold.ebi.ac.uk |
| Linear | Dark mode, tipografia limpia, estados de estado claros | linear.app |
| Vercel Dashboard | Gestion de jobs y despliegues, UX clara | vercel.com |
