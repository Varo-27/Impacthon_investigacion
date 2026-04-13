# Análisis de Competencia — Neurosnap AlphaFold2

**URL analizada:** https://neurosnap.ai/service/AlphaFold2  
**Fecha de análisis:** Abril 2026  
**Propósito:** Entender cómo el mercado actual resuelve el problema que aborda Micafold.

---

## 1. ¿Qué es Neurosnap?

Plataforma SaaS comercial de bioinformática que ofrece +100 herramientas
científicas ejecutadas en la nube, sin instalación, sin línea de comandos.
Su servicio AlphaFold2 es uno de sus productos estrella.

> *"Proudly supporting 50,000+ scientists worldwide, including 7,000+ leading
> biotech and global biopharma organizations."*

Son un competidor directo maduro con 250,000+ jobs procesados y +100 citas
académicas. No son un hackathon — son un negocio real.

---

## 2. Funcionalidades del Servicio AlphaFold2 en Neurosnap

### Inputs aceptados
| Input | Obligatorio | Descripción |
|---|---|---|
| Secuencia de aminoácidos | ✅ Sí | Raw sequence o FASTA |
| MSA (Multiple Sequence Alignment) | ❌ Opcional | Puede generarse automáticamente |
| Template estructural | ❌ Opcional | Se puede detectar automáticamente |

### Opciones de configuración avanzada
- **Model Type:** ptm, multimer-v1, multimer-v2, multimer-v3
- **MSA Mode:** mmseqs2 (rápido), single_sequence, custom MSA
- **Template Mode:** detección automática, sin templates, template propio
- **Use Amber:** refinamiento post-predicción (mejora calidad geométrica)
- **Pairing modes:** unpaired+paired, paired, unpaired (para complejos)
- **Recycling numbers:** controla iteraciones internas del modelo

### Outputs / Resultados
- Visualización 3D interactiva de la estructura plegada
- Métricas de confianza: **pLDDT** y **PAE** con gráficos interactivos
- Para **complejos proteína-proteína**: métricas adicionales:
  - `ipSAE` — Interfaz PAE score
  - `LIS` — Ligand interaction score
  - `pDockQ` y `pDockQ2` — Calidad del docking
- MSA utilizada disponible para descarga
- Descarga completa: estructura, MSA, métricas en JSON
- Múltiples modelos rankeados por confianza (no uno solo)

### Soporte para casos de uso avanzados
- ✅ Monómeros (proteína individual)
- ✅ Complejos / Multímeros (proteína-proteína)
- ✅ API programática para automatización
- ✅ Pipelines: encadenamiento de herramientas

---

## 3. Flujo de Uso

```
1. Login en Neurosnap (requiere cuenta)
2. Seleccionar herramienta: AlphaFold2
3. Dar nombre al job (solo organizativo)
4. Introducir secuencia + configurar opciones
5. Revisar coste estimado en créditos
6. Submit → ejecución en nube
7. Notificación cuando termina
8. Ver resultados: visualizaciones + descargas
```

---

## 4. Modelo de Negocio / Pricing

Sistema de **créditos de cómputo** (compute credits). Los créditos se
consumen según el tiempo de ejecución del job.

| Plan | Precio/mes | Créditos | Jobs paralelos | Prioridad |
|---|---|---|---|---|
| **Free** | $0 | 1 crédito | 2 | Baja |
| **Budget** | $6.99 | 7 créditos | 7 | Baja |
| **Standard** | $13.99 | 14 créditos | 14 | Media |
| **Academic** | $24.99 | 25 créditos | 30 | Media |
| **Professional** | $79.99 | 60 créditos | 60 | Alta |
| **Enterprise** | Custom | Ilimitado | Ilimitado | Máxima |

**Limitación importante:** Todas los planes limitan el plegamiento de proteínas
a un máximo de **5.000 residuos** (suficiente para la mayoría de casos).

Los créditos **no caducan** al final del ciclo de facturación.

---

## 5. Propuesta de Valor de Neurosnap

1. **Sin instalación**: todo en el navegador.
2. **Sin código**: interfaz gráfica para cualquier científico.
3. **Confidencialidad**: datos no compartidos con terceros.
4. **IP del usuario**: los resultados pertenecen al cliente.
5. **API disponible** para usuarios avanzados.
6. **Ecosistema completo**: +100 herramientas encadenables (docking,
   anotación, solubilidad, toxicidad, diseño de anticuerpos...).

---

## 6. Puntos Débiles de Neurosnap (Oportunidades para Micafold)

| Debilidad Neurosnap | Oportunidad Micafold |
|---|---|
| **Requiere registro y pago** — ni siquiera la prueba gratuita es completamente libre (1 solo crédito) | Micafold es de acceso **directo y gratuito** para la comunidad investigadora del CESGA/USC |
| **Servidor externo en Delaware, USA** — datos salen del país e institución | Micafold ejecuta **dentro del CESGA** (infraestructura gallega/española). Cumple GDPR y normativa hospitalaria |
| **Interfaz orientada a técnicos** — muchas opciones avanzadas (MSA mode, pairing, recycling) confunden a biólogos sin perfil computacional | Micafold apuesta por **UX radical para el biólogo**: presets simples, tooltips educativos, cero jerga técnica |
| **Sin contexto educativo** — no explica qué significa el pLDDT al usuario no experto | Micafold puede incluir **resumen en lenguaje natural con LLM** que traduzca el resultado a biología |
| **Orientado al mercado global/comercial** | Micafold está **integrado con el ecosistema institucional** (USC, CiTIUS, CAMELIA) |
| **Opciones complejas exportadas al usuario** | Micafold simplifica la experiencia: 1 input, 1 botón, resultados claros |

---

## 7. Herramientas Similares en el Ecosistema Neurosnap (Contexto de Mercado)

Neurosnap ofrece además herramientas relacionadas que nos indican qué
flujos de trabajo son populares entre los investigadores:

- **Predición de estructura:** AlphaFold2, Boltz-1, Boltz-2, Chai-1, IntelliFold
- **Docking molecular:** ColabDock, LightDock, DiffDock-L
- **Predicción de mutaciones:** ProSST Mutation Effect Prediction
- **Solubilidad y expresión:** NetSolP, SoDoPE
- **Toxicidad:** eTox, ToxinPred, ADMET-AI
- **Diseño de anticuerpos:** DiffAb, AntiFold, Immune Builder

> **Insight:** Los investigadores no solo predicen estructuras —
> también quieren saber si la proteína es soluble, tóxica, si hace
> docking con fármacos, y si una mutación la destabiliza. Micafold
> puede integrar algunas de estas métricas directamente desde la API del
> CESGA (la API Mock ya devuelve solubilidad, toxicidad y estructura secundaria).

---

## 8. Conclusión: Posicionamiento de Micafold vs. Neurosnap

Neurosnap es la **solución comercial global**. Micafold no compite con
ellos en escala ni en número de herramientas.

Micafold compite en **3 dimensiones clave**:

```
Neurosnap                      Micafold
─────────────────────────────────────────────────
Global / comercial      →      Institucional / CESGA
Requiere pago           →      Gratuito (clúster propio)
Datos en USA            →      Datos en Galicia (GDPR)
Opciones técnicas       →      UX para el biólogo
Herramienta genérica    →      Integrado con CAMELIA/USC
Sin explicaciones AI    →      Resumen en lenguaje natural
```

**Nuestro nicho:** El investigador de la USC o institución gallega que
maneja secuencias sensibles (clínicas, de patente, no publicadas) y necesita
la potencia del CESGA con la simplicidad de una web moderna.
