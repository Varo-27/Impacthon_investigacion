# MVP Sketch — LocalFold

3 pantallas principales. Flujo lineal: **Inicio → Estado del Job → Resultados**.

---

## PANTALLA 1 — Inicio / Envío de Secuencia

```
┌─────────────────────────────────────────────────────────────────┐
│  🧬 LocalFold                                      [ Mis Jobs ] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│          Predice la estructura 3D de tu proteína                │
│      Conectado al Supercomputador CESGA Finis Terrae III        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ >sp|P0CG47|UBQ_HUMAN Ubiquitin OS=Homo sapiens           │  │
│  │ MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLE...   │  │
│  │                                                           │  │
│  │                      [Pega tu secuencia FASTA aquí]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Recursos HPC:  [ GPUs: 1 ▼ ]  [ CPUs: 8 ▼ ]  [ RAM: 32GB ▼ ] │
│                                                                 │
│               [ 🚀  Predecir Estructura ]                       │
│                                                                 │
│  ── O prueba con una proteína del catálogo ──────────────────── │
│                                                                 │
│  [ Ubiquitin ]  [ Calmodulin ]  [ GFP ]  [ p53 ]  [ SOD1 ]    │
│  [ Insulin  ]   [ Myoglobin  ]  [ PCNA ]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Elementos clave:**
- Textarea monoespaciada para el FASTA (validación visual si falta el `>`)
- Presets de recursos con valores recomendados según tamaño de secuencia
- Chips/botones de proteínas del catálogo que autorrellanan el textarea
- Un solo CTA principal: "Predecir Estructura"

---

## PANTALLA 2 — Estado del Job (Polling)

```
┌─────────────────────────────────────────────────────────────────┐
│  🧬 LocalFold                                      [ Mis Jobs ] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Predicción en curso — Ubiquitin (76 aa)                       │
│                                                                 │
│   ●──────────────●──────────────○                              │
│  Enviado        Ejecutando    Completado                        │
│  (PENDING)      (RUNNING)     (pendiente)                       │
│                                                                 │
│  ┌─── Log del clúster CESGA ─────────────────────────────────┐  │
│  │ [12:00:25] Job encolado en Slurm. Esperando GPU...        │  │
│  │ [12:00:30] Nodo asignado: gpu-node-04 (NVIDIA A100)       │  │
│  │ [12:00:31] Contenedor Apptainer iniciado                  │  │
│  │ [12:00:32] Búsqueda de secuencias homólogas (MSA)...      │  │
│  │ [12:00:35] Predicción de estructura en curso... ████░░    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│   GPU: 1 × A100    CPU: 8 cores    RAM: 32 GB    ~10s restantes │
│                                                                 │
│   ⏳ Actualizando cada 3 segundos...                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Elementos clave:**
- Stepper de 3 pasos que avanza en tiempo real
- Caja de logs con fuente monoespaciada y scroll automático al final
- Chips de recursos que se solicitaron
- Polling automático cada 3s (sin que el usuario haga nada)
- Mensaje amigable si la API tarda en arrancar ("Calentando servidor...")

---

## PANTALLA 3 — Resultados

```
┌─────────────────────────────────────────────────────────────────┐
│  🧬 LocalFold                                      [ Mis Jobs ] │
├─────────────────────────────────────────────────────────────────┤
│  Ubiquitin — Homo sapiens  ·  UniProt P0CG47  ·  PDB: 1UBQ    │
├──────────────────────────────────┬──────────────────────────────┤
│                                  │  📊 Confianza (pLDDT)        │
│                                  │  ──────────────────────────  │
│                                  │  Media global:  71.7 / 100  │
│                                  │                              │
│                                  │  > 90 ██████ 13 residuos    │
│        [  VISOR 3D MOL*  ]       │  70–90 ████████ 29          │
│      (rotación / zoom / PDB)     │  50–70 ██████ 24            │
│        coloreado por pLDDT       │  < 50  ███ 10               │
│                                  │                              │
│                                  │  🗺 PAE Matrix               │
│                                  │  ┌────────────┐             │
│                                  │  │▓▓░░░░░░░░░░│ Azul = baja │
│                                  │  │░▓▓░░░░░░░░░│ incertid.   │
│                                  │  │░░▓▓▓░░░░░░░│             │
│                                  │  │░░░░▓▓▓░░░░░│             │
│                                  │  └────────────┘             │
├──────────────────────────────────┴──────────────────────────────┤
│  🧪 Datos Biológicos                                            │
│                                                                 │
│  Solubilidad: 79.8/100 ✅  │  Estabilidad: Estable ✅          │
│  Toxicidad: ⚠ Signal peptide detected                          │
│  Estructura 2ª: 23.7% hélice · 14.5% lámina β · 61.8% coil   │
│                                                                 │
│  💡 "Esta proteína muestra alta confianza estructural en la    │
│  mayoría de sus dominios. Las regiones naranja corresponden    │
│  a zonas típicamente desordenadas en proteínas reguladoras."   │
│                          ← Generado con IA                     │
├─────────────────────────────────────────────────────────────────┤
│  ⬇ PDB    ⬇ mmCIF    ⬇ JSON confianza    ⬇ Logs completos     │
└─────────────────────────────────────────────────────────────────┘
```

**Elementos clave:**
- Layout 2 columnas: visor 3D izquierda, métricas derecha
- Barra de histograma pLDDT con colores del estándar AlphaFold (azul→naranja)
- Heatmap PAE mínimo (puede ser Plotly/D3)
- Panel biológico: solubilidad, estabilidad, toxicidad, estructura secundaria
- Resumen en lenguaje natural generado por LLM
- Barra de descargas siempre visible abajo

---

## Flujo Completo

```
[Pantalla 1: Inicio]
    │
    │  Usuario pega FASTA + ajusta recursos + clic "Predecir"
    ▼
[Pantalla 2: Estado del Job]
    │
    │  Polling automático cada 3s
    │  PENDING ──► RUNNING ──► COMPLETED
    ▼
[Pantalla 3: Resultados]
    │
    ├── Visor 3D interactivo
    ├── Métricas pLDDT + PAE
    ├── Datos biológicos
    ├── Resumen LLM
    └── Descarga de ficheros
```

---

## Pantalla Extra (Could Have) — Mis Jobs / Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  🧬 LocalFold                                      [ Mis Jobs ] │
├─────────────────────────────────────────────────────────────────┤
│  Historial de predicciones                                      │
│  ┌──────────────┬──────────┬───────────┬───────────┬─────────┐  │
│  │ Proteína     │ Enviado  │ Estado    │ pLDDT med │ Acciones│  │
│  ├──────────────┼──────────┼───────────┼───────────┼─────────┤  │
│  │ Ubiquitin    │ 12:00    │ ✅ DONE   │ 71.7      │ [Ver]   │  │
│  │ mi_mutante   │ 11:45    │ ✅ DONE   │ 58.2      │ [Ver]   │  │
│  │ BRCA1_var    │ 11:30    │ ❌ FAILED │  —        │ [Retry] │  │
│  │ secuencia_X  │ 11:10    │ ⏳ RUNNING│  —        │ [Ver]   │  │
│  └──────────────┴──────────┴───────────┴───────────┴─────────┘  │
└─────────────────────────────────────────────────────────────────┘
```
