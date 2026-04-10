# Formatos de Entrada Aceptados — FastaInput

El campo de secuencia es el punto de entrada principal de la app. Los
usuarios van a pegar desde muchas fuentes distintas (UniProt, papers,
Excel, terminales) con formatos inconsistentes. La app debe aceptarlos
todos y normalizarlos internamente antes de enviar a la API.

---

## 1. Formatos y vías de entrada

El usuario puede introducir la secuencia a través de dos mecanismos:
1. **Pegar texto** en el `<textarea>`
2. **Subida de archivo (Drag & Drop / Input file):** Seleccionando un fichero físico.

### 🚀 Código de inyección de archivos
Gracias a la API nativa del navegador, sea cual sea la extensión (`.fasta, .fa, .txt, .seq`), extraeremos el texto en el frontend instantáneamente sin coste de servidor:

```javascript
const handleFileUpload = (evento) => {
  const archivo = evento.target.files[0];
  const lector = new FileReader();
  
  lector.onload = (e) => {
    const textoPuro = e.target.result;
    // Se inyecta el texto en el flujo de validación estándar
    setTextareaValue(textoPuro);
    validarYNormalizar(); 
  };
  lector.readAsText(archivo);
};
```

---

## 2. Formatos que el usuario puede pegar/subir

### ✅ FASTA estándar con header (formato esperado por la API)
```
>sp|P0CG47|UBQ_HUMAN Ubiquitin OS=Homo sapiens
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYN
IQKESTLHLVLRLRGG
```

### ✅ FASTA con header mínimo
```
>mi_proteina
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG
```

### ⚠️ Secuencia cruda sin header (error 422 en la API)
```
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG
```
→ **Solución:** Detectar si no empieza por `>`, añadir `>sequence\n` automáticamente.

### ⚠️ FASTA multilínea con saltos de línea en la secuencia
```
>proteina
MQIFVKTLTGK
TITLEVEPSDT
IENVKAKIQDKE
```
→ La API acepta este formato sin problemas. No requiere normalización.

### ⚠️ Secuencia con espacios internos (copiada de un paper o Excel)
```
MQIFV KTLTG KTITL EVESP SDTIE NVKAK
```
→ **Solución:** Eliminar todos los espacios de la secuencia antes de enviar.

### ⚠️ Secuencia con números de línea (copiada de GenBank/NCBI)
```
        1 mqifvktltg ktitleveps dtienvkaki qdkegippdq qrlifagkql
       51 edgrtlsdyn iqkestlhlv lrlrgg
```
→ **Solución:** Strip de dígitos y espacios, convertir a mayúsculas.

### ⚠️ Secuencia en minúsculas
```
>proteina
mqifvktltgktitlevepsdtienvkakiqdkegippdqqrlifagkqledgrtlsdyn
```
→ **Solución:** Convertir a mayúsculas antes de enviar.

### ⚠️ FASTA con múltiples secuencias (multi-FASTA)
```
>proteina_1
MQIFVKTLTGKTITLEVEPSDTIE...
>proteina_2
MVLSPADKTNVKAAWGKVGAHAGE...
```
→ **Comportamiento:** La API del CESGA solo procesa una secuencia por job.
→ **Solución:** Detectar múltiples `>` y avisar al usuario:
  *"Se han detectado múltiples secuencias. Por ahora solo procesamos una.
  Se usará la primera: proteina_1."*

### ⚠️ Secuencia con caracteres inválidos (X, *, -, B, Z, U)
```
>proteina
MQIFVKTLTGK*TITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDG-RTLSDY
```
- `*` = stop codon (secuencia de ADN traducida)
- `-` = gap en alineamientos
- `X` = aminoácido desconocido
- `B`, `Z` = aminoácidos ambiguos
- `U` = selenocisteína (raro)

→ **Solución:** Detectar y avisar con un banner warning (no bloquear):
  *"⚠ Se han detectado caracteres no estándar (* - X). Es posible que la
  predicción sea menos precisa."*

### ⚠️ Secuencia de ADN en vez de proteína
```
>gen_humano
ATGCAAATTTTTGTCAAGACTCTTACCGGAAAGACCATCAC...
```
→ Los nucleótidos (A, T, G, C) no son aminoácidos.
→ **Solución:** Detectar si >80% de los caracteres son A/T/G/C y mostrar:
  *"Parece que has pegado una secuencia de ADN. Esta herramienta acepta
  secuencias de aminoácidos (proteínas). ¿Quieres traducirla primero?"*

---

## 2. Tabla de normalización

| Caso | Detección | Acción |
|---|---|---|
| Sin header `>` | `!input.trim().startsWith('>')` | Añadir `>sequence\n` automáticamente |
| Minúsculas | `/[a-z]/` en la secuencia | `.toUpperCase()` |
| Espacios en secuencia | `/\s/` en líneas de secuencia | `.replace(/\s/g, '')` |
| Números de línea (GenBank) | `/^\s*\d+/m` | Strip de números y espacios |
| Multi-FASTA | Contar ocurrencias de `>` | Avisar + usar solo la primera |
| Caracteres no estándar | `/[*\-XBZUxbzu]/` | Warning visual, no bloquear |
| Secuencia de ADN | `>80%` de caracteres en `ATGC` | Warning + sugerencia |
| Vacío | `input.trim() === ''` | Deshabilitar botón submit |
| Muy corta (<10 aa) | longitud de secuencia | Warning: mínimo recomendado |
| Muy larga (>100.000 chars) | longitud total | Error: límite de la API |

---

## 3. Lógica de Validación (pseudocódigo)

```
función normalizarFASTA(inputRaw):

  texto = inputRaw.trim()

  // 1. Vacío
  si texto === '' → retornar { error: 'empty' }

  // 2. Multi-FASTA → tomar solo la primera
  si texto.contarOcurrencias('>') > 1:
    texto = tomarPrimeraSecuencia(texto)
    mostrarAviso('multi_fasta')

  // 3. Sin header → añadir uno genérico
  si no texto.startsWith('>'):
    texto = '>sequence\n' + texto

  // 4. Separar header y secuencia
  líneas = texto.split('\n')
  header = líneas[0]
  secuencia = líneas.slice(1).join('')

  // 5. Limpiar la secuencia
  secuencia = secuencia
    .replace(/\s/g, '')        // quitar espacios
    .replace(/\d/g, '')        // quitar números (GenBank)
    .toUpperCase()             // normalizar a mayúsculas

  // 6. Validaciones de contenido
  si secuencia.length < 10 → mostrarAviso('too_short')
  si secuencia.length > 100000 → retornar { error: 'too_long' }
  si esDNA(secuencia) → mostrarAviso('dna_detected')
  si tieneCaracteresRaros(secuencia) → mostrarAviso('unusual_chars')

  // 7. Reconstruir FASTA limpio
  fastaFinal = header + '\n' + secuencia

  retornar { fasta: fastaFinal, avisos: [...] }
```

---

## 4. UX de los avisos (no bloquear, informar)

Los avisos deben aparecer **debajo del textarea**, no como popups bloqueantes:

```
┌───────────────────────────────────────────────────────────────┐
│ >sequence                                                     │
│ MQIFVKTLTGKTITLEVEPSDTIENVKAK...                              │
└───────────────────────────────────────────────────────────────┘
⚠  No encontramos header en tu secuencia. Hemos añadido uno
   automáticamente. Puedes personalizarlo editando la primera línea.

ℹ  Secuencia de 76 aminoácidos detectada — tamaño pequeño.
   Predicción estimada: ~10 segundos.
```

**Errores que sí bloquean el botón Submit:**
- Secuencia vacía
- Secuencia >100.000 caracteres
- Secuencia de ADN (hasta que el usuario confirme o corrija)

**Avisos que no bloquean (solo informan):**
- Header añadido automáticamente
- Multi-FASTA reducida a la primera secuencia
- Caracteres no estándar detectados
- Secuencia muy corta

---

## 5. Fuentes habituales de las secuencias y sus formatos

| Fuente | Formato típico | Problema habitual |
|---|---|---|
| **UniProt** | FASTA estándar con `>sp|...` | Ninguno — formato limpio |
| **NCBI/GenBank** | Numerado + espacios | Números y espacios en la secuencia |
| **Papers PDF** | Variable | Saltos de línea, guiones, espacios |
| **Excel** | Crudo sin header | Sin `>`, posibles espacios |
| **Laboratorio propio** | Crudo o con ID personalizado | Sin header o formato casero |
| **AlphaFold DB** | FASTA estándar | Ninguno |
| **Colaborador por email** | Cualquier formato | Todo lo anterior |
