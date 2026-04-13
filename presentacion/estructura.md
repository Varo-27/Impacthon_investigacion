# Micafold — Guión Impacthon 2026

> **P1** = storyteller/narrador | **P2** = demo driver | **5 minutos** | Solux

---

### [ANTES DE EMPEZAR]
*[P1 deja un sobre en la mesa del jurado mientras entran. Con una sonrisa:]*

> *"Esto es un soborno. Abridlo cuando os lo diga."*

---

### [0:00 – 0:50] APERTURA
*[P1. Pausa de 2 segundos antes de hablar. Sin mirar slides. Voz tranquila, casi íntima.]*

> *"En 2020 se abrió un sobre que llevaba décadas esperando.*
> *Cincuenta años de ciencia, miles de investigadores, millones de horas.*
> *Y en ese momento, una IA lo había resuelto todo.*
>
> *Hoy tres millones de investigadores en ciento noventa países usan lo que salió de ese sobre.*
> *Porque detrás de cada proteína hay una enfermedad,*
> *y detrás de cada enfermedad hay una persona que espera una respuesta.*
>
> *Nosotros nos preguntamos cuántas de esas respuestas siguen atrapadas*
> *porque el cómputo que las libera no llega a quien las busca.*
>
> *Una IA abrió esa puerta. Pero hay mil puertas más.*
> *Y casi nadie tiene llave."*

---

### [0:50 – 1:15] LA BRECHA
*[Tono cambia. Más cercano, casi conversacional.]*

> *"Imaginad que sois biólogos. Tenéis la secuencia, tenéis la hipótesis, tenéis años de trabajo detrás. Y existe la máquina que puede dároslo todo — está aquí, en Galicia, en el CESGA.*
>
> *Tenéis que dominar Linux, SSH, SLURM, módulos de entorno, scripts en Bash, APIs REST, la arquitectura de FinisTerrae III..."*

*(pausa — mira al jurado)*

> *"El biólogo que podría curar una enfermedad rara... se queda en el formulario de acceso.*
>
> *Ese sobre que os dejamos — abridlo."*

*[4 segundos de silencio — jurado abre, escanea QR → pantalla roja en sus móviles]*
*[P1 no dice nada. Deja que lo lean.]*

> *"Eso es lo que ve hoy un investigador. Una puerta cerrada.*
>
> *Eso no es un problema técnico. Es un problema de diseño.*
> *Y los problemas de diseño tienen soluciones de diseño."*

*(giro hacia la pantalla — P2 da un paso al frente)*

> *"Les presentamos Micafold."*

---

### [1:15 – 1:45] REVEAL

> *"OmicaFold no es una interfaz para AlphaFold. Es la puerta de entrada a toda la computación científica del CESGA — para cualquier investigador, sin importar su perfil técnico.*
>
> *Y dentro del visor, un asistente construido con n8n que no responde en genérico — responde sobre la proteína que tienes delante, ahora mismo.*
>
> *Eso cambia lo que significa entender un resultado."*

---

### [1:45 – 3:45] DEMO EN VIVO *(P2 conduce, P1 narra)*

**UX — criterio 1:**
> *"Entro, selecciono AlphaFold2, pego mi secuencia, envío. Nada de terminales. Nada de scripts."*

**Ciclo de vida — criterio 3:**
> *"Estado en tiempo real: cola, ejecutándose, completado. Firebase sincroniza sin recargar."*

**Visualización + pLDDT + PAE — criterio 2:**
*(proteína rotando en pantalla — pausa deliberada)*

> *"pLDDT: confianza residuo a residuo. Azul — alta confianza. Naranja — donde AlphaFold duda. Esa duda es información.*
>
> *PAE heatmap: error entre pares de residuos. Esta zona fuera de la diagonal... aquí hay una interacción que merece atención."*

**ProteIA / n8n — criterio 4:**
*(abre ProteIA junto al visor)*

> *"ProteIA está aquí, dentro del visor, con contexto completo de lo que estoy viendo.*
> *Le pregunto: '¿Qué significan las regiones de baja confianza en esta estructura?'"*

*(espera la respuesta — silencio)*

> *"ProteIA no responde en genérico. Responde sobre esta proteína, este resultado, ahora.*
> *ProteIA no reemplaza al investigador. Le devuelve tiempo para investigar."*

---

### [3:45 – 4:00] CREDENCIAL TÉCNICA *(P2, 15 segundos)*

> *"React, Firebase, pdbe-molstar, n8n. API oficial del reto — la misma infraestructura CESGA que usaría en producción. Desplegable hoy."*

---

### [4:00 – 5:00] CIERRE *(P1)*
*[Sin mirar slides. De pie. Contacto visual directo.]*

> *"Muchas puertas llevan décadas cerradas. La ciencia está. La infraestructura está.*
>
> *Solo faltaba quien fabricara la llave."*

*(pausa — un paso hacia el jurado)*

> *"Abrid otra vez el móvil."*

*[Pantalla verde: ACCESO CONCEDIDO — 5 segundos de silencio]*

> ***"Micafold. Despliega el futuro."***

*(Silencio. No decir gracias.)*

---

> **Sobre:** tarjeta con QR dentro. Pantalla roja al escanear → verde al cierre por timer local (90s). Reverso con screenshot impreso como fallback. Si falla WiFi: *"Si el WiFi funcionara como nuestro servidor..."*
