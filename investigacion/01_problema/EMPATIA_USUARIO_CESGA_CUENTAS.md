# Empatía — El Investigador del CESGA y la Persistencia de Datos

Ponerse en el lugar del investigador técnico del CESGA cambia completamente
la conversación sobre cuentas y persistencia.

---

## Un día real de un investigador del CESGA

**Persona:** Alejandro, 38 años. Investigador en proteómica computacional.
Trabaja en el CiTIUS (USC). Tiene acceso al CESGA Finis Terrae III.

### Su flujo de trabajo habitual (sin Micafold):
```
08:30 — En casa. Se conecta al CESGA por SSH desde su portátil.
         Lanza 3 jobs de AlphaFold con un script de Slurm.
         $ sbatch predict_brca1.sh
         $ sbatch predict_sod1.sh
         $ sbatch predict_egfr.sh

09:00 — En la facultad. Mismo terminal, diferente máquina.
         $ squeue -u alejandro
         → Ve el estado de sus 3 jobs en la cola.

13:00 — Un job completó. Descarga el PDB por SCP a su portátil.
         Abre PyMOL (si está instalado). Analiza.
         Copia métricas manualmente a una hoja de Excel.

18:00 — En casa de nuevo. Quiere ver si los otros 2 completaron.
         SSH de nuevo. Los ficheros están en /home/alejandro/results/
         Descarga los PDB. Analiza.

Final del día — Tiene 3 PDBs en su portátil, 0 en su pc de la facultad,
         notas en un Excel, y ninguna forma de compartir fácilmente
         con su directora en Barcelona.
```

---

## Lo que Alejandro REALMENTE necesita de Micafold

### 1. Que reconozca que SOY YO

Para Alejandro, localStorage es **completamente inútil**.

- Trabaja desde 3 dispositivos: portátil, PC facultad, PC casa
- Su directora necesita acceder a los mismos resultados desde Barcelona
- Sus doctorandos trabajan con las mismas proteínas del grupo

**Lo que espera:** Que Micafold lo reconozca como él en cualquier dispositivo.
Y lo más importante: **ya tiene una cuenta** — su cuenta institucional de la USC/CSIC.

> **Insight crítico:** Alejandro no quiere crear una cuenta nueva.
> Quiere usar la que ya tiene. Cada universidade y OPIS en España usa
> un sistema de identidad institucional (LDAP, SSO, eduroam, SAML).
> El CESGA ya autentica a sus usuarios por este sistema.

---

### 2. Pegar su Job ID del CESGA (sin predecir desde cero)

Este es el flujo que más sentido tiene para Alejandro:

```
Alejandro ya lanzó sus jobs por SSH hace 2 horas.
Ahora abre Micafold en el navegador.

En vez de pegar una secuencia, hace clic en:
  [ Tengo un Job ID del CESGA ]

Introduce: cesga_job_487523

Micafold consulta la API → llama a GET /jobs/cesga_job_487523/status
→ Si está completo, muestra los resultados directamente
→ Si está corriendo, hace polling en tiempo real
```

**Por qué es perfecto para este usuario:**
- No duplica trabajo (ya calculó, no quiere calcular otra vez)
- Accede a sus resultados desde cualquier navegador sin instalar nada
- Micafold se convierte en su "panel de visualización" para el CESGA

---

### 3. Que su historial esté en el servidor, no en el navegador

```
Alejandro en su portátil: predice Ubiquitin → historial actualizado
Alejandro en PC facultad: abre Micafold → ve Ubiquitin en su historial
Alejandro en casa: su directora abre el link → ve exactamente lo mismo
```

Esto es imposible con localStorage. Punto.

**Implicación:** Para el usuario CESGA, el historial SIN cuentas reales
no tiene ningún valor. El localStorage es solo para el biólogo de laboratorio
que usa un único dispositivo personal.

---

## La solución correcta según el perfil

Esta pregunta revela que **los dos perfiles necesitan soluciones distintas**:

```
PERFIL BIÓLOGO DE LAB                    PERFIL INVESTIGADOR CESGA
─────────────────────────                ──────────────────────────
Un solo dispositivo                      3+ dispositivos
No tiene cuenta CESGA                    Ya tiene cuenta CESGA
localStorage es suficiente               Necesita sincronización real
Privacidad: datos en CESGA               Privacidad: sus jobs son suyos
Inicia desde FASTA                       Inicia desde Job ID o sube PDB
Quiere explicación en lenguaje simple    Quiere métricas exportables
```

---

## Decisión de producto para el hackathon

### Para el demo (hackathon):
Dos modos de entrada en la pantalla principal:

```
┌───────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┐  ┌──────────────────────────┐ │
│  │  🧬 Predecir desde FASTA   │  │  🔑 Tengo un Job ID      │ │
│  │                             │  │                          │ │
│  │  [textarea FASTA]           │  │  [ cesga_job_XXXXXX ]   │ │
│  │                             │  │                          │ │
│  │  → Para biólogos            │  │  → Para usuarios CESGA  │ │
│  └─────────────────────────────┘  └──────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

El historial se guarda en localStorage para la demo. En el pitch:

> "Para los investigadores del CESGA que ya tienen cuenta institucional,
> Micafold en producción se integra con el SSO de la USC/CSIC mediante
> SAML2 o eduroam. En ese caso el historial queda sincronizado en el
> clúster, accesible desde cualquier dispositivo. El biólogo sin cuenta
> CESGA usa el modo anónimo con persistencia local."

### Para producción (visión):
```
Biólogo sin cuenta CESGA:
   → Acceso libre + localStorage (como el demo)

Investigador con cuenta CESGA:
   → Login con cuenta institucional (SSO/LDAP)
   → Historial en base de datos del CESGA
   → Ve sus propios jobs de Slurm automáticamente
   → Puede compartir con colaboradores de su grupo
```

---

## Lo que cambia en el MVP al poner en el lugar de Alejandro

Al pensar como Alejandro, emergen 2 features nuevas que antes no estaban:

### ✅ Feature emergente A — "Tengo un Job ID"
Input alternativo en la landing para usuarios que ya calcularon en el CESGA.
Consulta el estado y carga los resultados sin predecir de nuevo.
**Tiempo hackathon:** ~45 min. Reutiliza todo el código de polling y resultados.

### ✅ Feature emergente B — "Sube tu PDB" (ya documentada)
El investigador que hizo su propia simulación MD puede subir el PDB
directamente al visor sin pasar por la API.
**Tiempo hackathon:** ~60 min.

---

## Conclusión

Para el CESGA user, el verdadero valor de Micafold no es predecir
(ya saben hacerlo por su cuenta) sino **visualizar, interpretar y compartir
lo que ya calcularon**, desde cualquier lugar, sin instalar nada.

**La frase que los convence:**
> "Tus jobs del CESGA, accesibles desde el navegador. Sin PyMOL,
> sin SCP, sin instalar nada. Pega tu job ID y listo."
