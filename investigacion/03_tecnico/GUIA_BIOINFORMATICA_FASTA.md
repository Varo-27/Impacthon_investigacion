# Guía Avanzada de Bioinformática Estructural para Desarrolladores (Proyecto LocalFold)

Para tomar buenas decisiones arquitectónicas y de experiencia de usuario (UX) en LocalFold, es necesario comprender la terminología, el contexto biológico y los entresijos técnicos de la predicción de estructuras. Este documento es un manual detallado ('Deep Dive') sobre los pilares científicos del proyecto.

---

## 1. El Dogma Central y el Origen de los Datos

Para entender al usuario, debes entender de dónde saca la información.

### El Dogma Central de la Biología Molecular
ADN ➔ ARN ➔ Proteína.
1. **ADN (Genoma):** El disco duro. Usa un alfabeto de 4 letras (`A, T, G, C`).
2. **ARN (Transcriptoma):** La copia de trabajo temporal (`A, U, G, C`).
3. **Proteína (Proteoma):** Las "máquinas" que hacen el trabajo celular. Usan un alfabeto de 20 letras (Aminoácidos).

### ¿Por qué esto es relevante para la UX?
Muchos usuarios (especialmente estudiantes o clínicos) consiguen la secuenciación de un paciente y obtienen un gen (ADN). AlphaFold **solo** predice estructuras de Proteínas. Si un usuario pega ADN en un modelo de proteínas, la red neuronal intentará plegarlo asumiendo que la 'A' es Alanina, la 'T' es Treonina, etc., produciendo basura silente. LocalFold debe interceptar este error en el frontend.

---

## 2. Los 20 Aminoácidos y el Texto FASTA

Cada letra en una secuencia FASTA representa una molécula (aminoácido) con propiedades químicas únicas. El LLM y las métricas de la API se basan en esto.

*   **Hidrofóbicos (le huyen al agua):** `A, V, I, L, M, F, Y, W`. Suelen esconderse en el *centro* de la proteína 3D.
*   **Hidrofílicos (aman el agua, polares/cargados):** `R, K, D, E, S, T, N, Q`. Suelen estar en la *superficie*.
*   **Especiales:** `C` (Cisteína, forma enlaces fuertes que estabilizan la estructura), `G` (Glicina, da flexibilidad), `P` (Prolina, rompe hélices y da rigidez).

### Anatomía Estricta del Formato FASTA

El formato fue inventado en 1985 por William Pearson ('FastA' = Fast All).

#### A. La Línea de Cabecera (Header Line)
Comienza inexcusablemente por el símbolo "mayor que" (`>`). Lo que sigue es información libre, pero en bases de datos serias (como UniProt) sigue un estándar:

```text
>sp|P0CG47|UBQ_HUMAN Ubiquitin OS=Homo sapiens OX=9606 GN=UBB PE=1 SV=2
```
*Desglose (Ideal para parsear e infundir metadatos en la interfaz):*
*   `sp`: Base de datos (Swiss-Prot).
*   `P0CG47`: **Accession Number (ID Único)**. Muy útil para enlazar con UniProt.
*   `UBQ_HUMAN`: Nombre mnemotécnico.
*   `Ubiquitin`: Nombre real de la proteína.
*   `OS=Homo sapiens`: Organismo (*Species*).

#### B. La Línea de Secuencia
Texto compuesto por caracteres ASCII (normalmente A-Z).
*Reglas oficiales que casi nadie cumple a la perfección:*
*   Las líneas deberían cortarse a los 60 u 80 caracteres (salto de línea `\n`).
*   Los caracteres válidos proteicos son: `A C D E F G H I K L M N P Q R S T V W Y`.
*   A veces aparecen letras ambiguas: `B` (N o D), `Z` (Q o E), `X` (Cualquier aminoácido). AlphaFold2 *odia* estas letras ambiguas y en un sistema real suele fallar o reemplazarlas arbitrariamente.

#### C. Variantes y Ensuciamiento Común (Edge Cases)
Los biólogos copian secuencias de PDFs, excels o bases de datos como GenBank.

1.  **FASTA Ensuciado por GenBank (NCBI):**
    ```text
    1 mkkfllvlll alcvascsqg nlsledrki
    ```
    *(Números y espacios que deben ser purgados).*
2.  **Multi-FASTA:**
    Un archivo con varios bloques `>header \n secuencia`. AlphaFold2 clásico sólo corre un monómero (cadena simple) o un multímero explícito. Si pasamos un string con varios `>` a la API mockeada, fallará o cogerá solo lo que entienda.

---

## 3. ¿Cómo funciona AlphaFold por detrás? (Lo que causa la "cola" de trabajos)

Es importante entender por qué un cálculo en el CESGA tarda (PENDING -> RUNNING).

1.  **Fase 1: Búsqueda del MSA (Multiple Sequence Alignment):** Es la fase más lenta. El CESGA coge tu secuencia de 300 letras y busca en una base de datos local de *trillones* de secuencias (tamaño >2 Terabytes) para encontrar proteínas similares a nivel evolutivo. Tarda minutos.
2.  **Fase 2: Búsqueda de Templates (Plantillas en PDB):** Busca trozos de proteínas ya conocidas que se parezcan.
3.  **Fase 3: Inferencia GPU:** Las Redes Neuronales (Evoformer y Structure Module) ejecutan sus cálculos geométricos en las tarjetas NVIDIA A100. Tarda segundos o minutos dependiendo de la longitud de los aminoácidos.

Dado esto, **una UX excelente debe informar de esta lenta progresión**. No es un fallo del sistema, es ciencia HPC en curso.

---

## 4. Métricas de Confianza: Entendiendo The Math (pLDDT y PAE)

AlphaFold no es un motor físico, es un motor estocástico de predicción.

### pLDDT (Predicted Local Distance Difference Test)
Predice su confianza sobre el *Backbone* (el "chasis" de la proteína) **átomo a átomo, residuo a residuo**.

*   Mide de **0 a 100**.
*   **0-50 (Muy Baja Confianza):** Significa "Región Intrínsecamente Desordenada" (IDR). En la realidad biológica, este trozo de proteína es equivalente a un trozo de hilo flotando en agua, no tiene forma constante. Es vital explicarle al biólogo que un valor rojo/naranja *NO significa que la IA ha fallado*, significa que *la biología nos dice que esa parte es un espagueti*.
*   **70-90 (Alta):** El chasis es fiable.
*   **>90 (Muy Alta):** Sirve para diseñar medicamentos precisos contra esa zona.

### PAE (Predicted Aligned Error) o "Matriz de Incertidumbre Relacional"
Pensemos en articulaciones. El pLDDT mide cómo están tu húmero y tu radio. El PAE determina si AlphaFold sabe cómo está el codo.

*   Si tienes una Proteína de Dominio A y Dominio B unidos por un hilo flexible.
*   AlphaFold hace perfecto el Dominio A (pLDDT > 90). Y el Dominio B (pLDDT > 90).
*   Pero AlphaFold **no tiene ni idea** de si el Dominio A está encima, debajo, o a la izquierda del Dominio B, porque el hilo es flexible.
*   **La Matriz Heatmap:** Plotea (Residuo X contra Residuo Y). Si el color es *Azul* u Oscuro (Error Cercano a 0), AlphaFold *sí* confía en la posición de X respecto a Y. Si es Rojo / Claro (Error > 15-30 Ångströms), no hay posición fija.

---

## 5. El "Secreto" del Pipeline: AlphaFold vs Metadatos Extendidos

Es vital para el diseño del producto (y para explicárselo al Protein Copilot) entender que **AlphaFold directamente NO calcula la solubilidad ni la toxicidad**. 

### Lo que devuelve la Red Neuronal pura (AlphaFold2)
Si ejecutas la IA pura de DeepMind, solo genera métricas geométricas:
1. **Archivo PDB:** Las coordenadas 3D de los átomos.
2. **pLDDT:** La confianza estructural átomo a átomo.
3. **Matriz PAE:** La matriz de incertidumbre relacional descrita arriba.

### Lo que devuelve el CESGA (Pipeline Completo)
En un superordenador científico, el FASTA no pasa solo por AlphaFold, pasa por una cadena de montaje:
1. **Paso 1 (La forma):** AlphaFold genera el modelo 3D.
2. **Paso 2 (Bioquímica Clásica):** Un programa algorítmico clásico (no IA, sino fórmulas matemáticas como *ProtParam*) lee las letras de la secuencia y calcula:
   - **Solubilidad:** Basada en cuántas letras "hidrofóbicas" vs "hidrofílicas" hay.
   - **Índice de Inestabilidad:** Basado en patrones frágiles de aminoácidos.
3. **Paso 3 (Farmacología):** El modelo se cruza con bases de datos toxicológicas (como *ToxinPred*) para generar las **Alertas de Toxicidad**.

**Por qué esto es importante para LocalFold:**
Nuestra API (Mock) unifica todo este pipeline complejo en un solo JSON. Por eso el Protein Copilot (n8n + Gemini) es tan "listo": porque recibe métricas geométricas (AlphaFold) combinadas con física predictiva (Pipeline CESGA), permitiéndole razonar no solo sobre la "forma" de la proteína, sino sobre cómo se comportará en un tubo de ensayo real.

---

## 6. Algoritmos Clave para el Frontend (Implementación JS)

Para construir la "UX Mágica y Tolerante a Fallos", este es el pseudo-código (o lógica JavaScript) para procesar del textarea:

### Función: `normalizeFasta(rawText)`
```javascript
export function normalizeFasta(rawText) {
  let text = rawText.trim();
  
  // 1. Si no hay entrada
  if (!text) return { error: "Secuencia vacía" };

  // 2. ¿Tiene header? Si no, se lo inventamos.
  if (!text.startsWith(">")) {
    text = ">Secuencia_Usuario\n" + text;
  }

  // 3. Separar en bloques (por si es Multi-FASTA)
  const lines = text.split('\n');
  let header = "";
  let sequenceParts = [];
  let isFirstSequence = true;
  let hasMultipleFastas = false;

  for (let line of lines) {
    if (line.startsWith(">")) {
      if (!isFirstSequence) {
        hasMultipleFastas = true;
        break; // Nos quedamos solo con la primera cadena
      }
      header = line;
      isFirstSequence = false;
    } else {
      // 4. Limpieza dura de la secuencia:
      // Quitar números, espacios, asteriscos, tabulaciones y pasar a Mayúsculas
      let cleanLine = line.replace(/[\d\s\*]/g, '').toUpperCase();
      sequenceParts.push(cleanLine);
    }
  }

  const cleanSequence = sequenceParts.join('');

  // 5. Validaciones científicas
  // Proteínas de < 15 aminoácidos a veces colapsan los modelos locales/mock
  if (cleanSequence.length < 15) return { error: "Demasiado corta (<15 aa)" };
  
  // Detección de ADN/ARN (Problema de biología celular 101)
  const isDna = /^[ATCGU]+$/.test(cleanSequence) || 
                (cleanSequence.match(/[ATCGU]/g)?.length / cleanSequence.length > 0.90);
  
  // Detección de Aminoácidos ilegales (X, B, Z, J, O, U)
  const hasAlienChars = /[^ACDEFGHIKLMNPQRSTVWY]/.test(cleanSequence);

  let warnings = [];
  if (hasMultipleFastas) warnings.push("Detectadas múltiples secuencias. Solo se ha utilizado la primera.");
  if (isDna) warnings.push("ATENCIÓN: Esto parece una secuencia de ADN/ARN. AlphaFold requiere secuencias de Proteínas (Aminoácidos).");
  if (hasAlienChars) warnings.push("Advertencia: Hay caracteres que no corresponden a los 20 aminoácidos estándar. Esto puede influir en la predicción.");

  return {
    header: header,
    sequence: cleanSequence,
    warnings: warnings,
    length: cleanSequence.length,
    fa_ready_string: `${header}\n${cleanSequence}`
  };
}
```

### Extracción Activa: Usos para el LLM y la Interfaz
Con un parseador robusto en el frontend, en cuanto el usuario pega un FASTA válido de UniProt:
1.  Extraemos el nombre del organismo.
2.  Extraemos el nombre de la proteína.
3.  Calculamos la masa aproximada (longitud * peso promedio).
4.  *Magic UX:* Podemos hacer un renderizado inmediato del nombre de la proteína encima del textarea que diga: `"Ubiquitin detectada (Homo Sapiens). Longitud: 76 aa."` Esto da feedback instantáneo de que LocalFold 'entiende' al investigador The user immediately feels confident.

Esta es toda la teoría de dominio bioinformático y estructural necesaria para dominar el desarrollo del portal y plantear arquitecturas solventes de cara a las 48 horas del Hackathon.
