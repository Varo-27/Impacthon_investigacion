# Documento de Investigación: Problema y Usuarios - LocalFold

Este documento sirve como base estratégica para entender el propósito del producto. Se enfoca en delimitar el problema real de mercado, el público objetivo y la brecha tecnológica que LocalFold viene a solucionar.

## 1. ¿Para quién lo hacemos? (Arquetipo de Usuario)

Nuestro usuario principal es el **Investigador en Ciencias Biológicas y Biomédicas**, que abarca roles como:
* Biólogos moleculares y bioquímicos.
* Docentes e investigadores académicos.
* Científicos en empresas biotecnológicas o farmacéuticas (Research & Development).

**Sus características y puntos de dolor (Pain points):**
* Son expertos en biología, genética y comportamiento celular, pero **no** suelen tener formación técnica avanzada en informática (HPC, línea de comandos de Linux, sistemas de colas como Slurm).
* Necesitan predecir rápidamente las estructuras 3D de secuencias nuevas, alteradas o experimentales para estudiar enfermedades, desarrollar fármacos o diseñar tratamientos de medicina personalizada (ej: Cátedra Camelia).
* Sufren el "Cuello de botella tecnológico": para usar herramientas punteras, dependen enormemente de la ayuda de bioinformáticos, lo cual retrasa la investigación científica.

## 2. ¿Por qué lo hacemos? (El Problema y la Propuesta de Valor)

La Inteligencia Artificial (especialmente AlphaFold2 y ColabFold) ha revolucionado la biología prediciendo cómo se pliegan las proteínas con una precisión casi equivalente a métodos de laboratorio presenciales (como rayos X o microscopía crioelectrónica), los cuales tardan años y son carísimos.

Sin embargo, a pesar de la existencia de este software abierto, su **accesibilidad es bajísima**:
1. **Coste Hardware:** Ejecutar las predicciones por cuenta propia requiere GPUs muy potentes (ej. NVIDIA A100) y hasta 3 TB de almacenamiento solo para alojar las bases de datos genéticas.
2. **Coste Software/Usabilidad:** Requiere instalar herramientas pesadas, interactuar en consola y enviar peticiones a clústeres a ciegas.
3. **Privacidad de las secuencias:** Muchos investigadores tienen secuencias *secuenciadas* no publicadas por motivos de patente o privacidad médica (ej. muestras clínicas de pacientes tumorales); no pueden subirlas a servidores públicos de internet.

**Nuestra justificación (Por qué):** 
Queremos democratizar esta potente tecnología. Queremos construir un "puente" visual e intuitivo entre la mente del biólogo y el músculo del Supercomputador FT3 del CESGA. Lo hacemos para acelerar los tiempos de descubrimiento científico, garantizando la privacidad dentro del clúster institucional.

## 3. ¿Cómo se está resolviendo actualmente? (Estado del Arte)

A fecha de hoy, un investigador que requiere modelar una secuencia tiene opciones muy limitadas y defectuosas:

### A. AlphaFold Database Pública (EMBL-EBI)
* **Cómo funciona:** Dispone de más de 200 millones de estructuras ya procesadas en una interfaz web fácil de usar.
* **Por qué falla:** Solo sirve para secuencias conocidas. Si el biólogo encuentra una mutación nueva o diseña una proteína de laboratorio distinta, la base de datos pública no sirve de nada, ya que esos datos no están "precomputados".

### B. Ejecución Propia en Superordenadores (CESGA / HPC)
* **Cómo funciona:** La institución tiene la infraestructura y el AlphaFold instalado mediante Apptainer.
* **Por qué falla:** El investigador debe redactar a mano *slurm scripts (sbatch)*, estimar los recursos, enviar a la cola su fichero por consola y monitorizar rezando para que no haya un error críptico o caiga la sesión. Además de tener que usar visores externos (Mol*, PyMol) para interpretar largos JSONs de salidas (pLDDT y PAE Matrix) tras su ejecución, complicando el análisis técnico.

### C. Google Colab (Ej. ColabFold)
* **Cómo funciona:** Notebooks en línea que permiten predecir proteínas pequeñas y medianas gratuitamente en la nube de Google.
* **Por qué falla:** Sesiones que pueden cerrarse automáticamente rompiendo el trabajo; problemas de privacidad médica rigurosos (se está mandando información privada de investigación al entorno gcloud público estadounidense); y falta de potencia ilimitada y garantizada al estar sometido a tiers gratuitos en la nube publica.

---

## Conclusión Ejecutiva
Existe un vacío entre la "capacidad técnica" y la "accesibilidad científica". La necesidad no es hacer *mejor* el plegamiento de proteínas, sino **hacerlo utilizable**. **LocalFold** resuelve esto siendo la "última milla" que provee de una Experiencia de Usuario excelente, con una curva de aprendizaje cero y visuales interpretables, manteniendo al mismo tiempo toda la potencia del Supercomputador CESGA protegido por detrás.
