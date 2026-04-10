# Decisión de Arquitectura — Persistencia de Datos y "Cuentas"

## El dilema

Si queremos historial de jobs y proyectos, el usuario necesita algún tipo
de identidad. Hay 3 caminos posibles. Solo uno es viable en un hackathon.

---

## Opción 1 — Cuentas reales (Backend + Auth)

### Qué conlleva:
```
Base de datos (PostgreSQL / MongoDB)
    ↓
API propia (Node/FastAPI/Express)
    ↓
Auth sistema (JWT, sesiones, OAuth)
    ↓
Endpoints: POST /register, POST /login, GET /users/:id/jobs
    ↓
Frontend: formularios de login, gestión de tokens, rutas protegidas
```

### Tiempo estimado: **12-16 horas de trabajo** (3-5 días reales de depuración)

### Veredicto para el hackathon: 🔴 DESCARTADO (TRAMPA MORTAL)
- **Ahorro masivo de horas:** Intentar programar Login/Registro + DB nos consumiría 16 horas del Hackathon. Ese tiempo debe invertirse en UX e IA (lo que realmente puntúa).
- **Fricción en la demo:** Un login roto destruye una demo. Además, obligar al investigador a registrarse *antes* de probar la web rompe la conversión.
- **La magia del 'Link Stateless':** No tener sistema de cuentas cerrado (Users) significa que cualquier persona que reciba un enlace (ej: `/results/abc123`) puede acceder y ver los resultados en milisegundos pidiendo la data masiva al CESGA, sin "Crear Cuenta". Es una ventaja competitiva brutal para la demo.
---

## Opción 2 — Solo localStorage (sin identidad)

### Qué conlleva:
- Al completar un job → guardarlo en `localStorage` del navegador
- Si el usuario cierra el navegador → los datos siguen ahí
- Si limpia el navegador o cambia de dispositivo → se pierde todo

### Tiempo estimado: **1-2 horas**

### Veredicto: 🟡 FUNCIONA pero tiene limitaciones visibles
- Suficiente para el hackathon y la demo
- El jurado lo verá y lo entenderá como una simplificación consciente
- En producción real esto hay que reemplazarlo

---

## Opción 3 — ID de sesión anónima (el equilibrio óptimo) ✅

### Concepto:
Cuando el usuario abre LocalFold por primera vez, el sistema genera
automáticamente un **ID único de sesión** (UUID) y lo guarda en localStorage.

```
Primera visita → se genera: "lf_session_8f3a9c2d-4b1e-11ee..."
→ guardado en localStorage["localfold_session_id"]
→ nunca se borra a menos que el usuario limpie datos del navegador
```

Todos los jobs de ese usuario se asocian a ese ID.

### Qué consigue:
- ✅ Historia persistente entre sesiones (mientras no limpien el navegador)
- ✅ Se puede "compartir el historial" vía URL: `/dashboard?s=8f3a9c2d`
- ✅ Cero backend adicional — todo en localStorage
- ✅ En producción, este ID se puede migrar a una cuenta real sin cambiar la UX
- ✅ Da la sensación de "tu espacio personal" sin auth real

### Cómo se ve para el usuario:
```
Primera visita:
  LocalFold crea tu espacio personal...
  ID: lf_8f3a9c2d (guardado en tu navegador)
  [ Tu historial está guardado aquí automáticamente ]

Visitas siguientes:
  Bienvenido de vuelta — tienes 5 predicciones guardadas
```

### Tiempo estimado: **2-3 horas** (incluyendo el dashboard de historial)

### Veredicto: 🟢 ESTA ES LA SOLUCIÓN CORRECTA PARA EL HACKATHON

---

## Estructura de datos en localStorage

```json
{
  "localfold_session_id": "lf_8f3a9c2d-4b1e-11ee-a4f2-0242ac120002",

  "localfold_jobs": [
    {
      "job_id": "cesga_abc123",
      "protein_name": "Ubiquitin",
      "protein_organism": "Homo sapiens",
      "plddt_mean": 71.7,
      "solubility_score": 79.8,
      "stability_status": "stable",
      "status": "COMPLETED",
      "submitted_at": "2026-04-11T10:30:00Z",
      "completed_at": "2026-04-11T10:30:10Z",
      "project": "TFM 2026",
      "notes": ""
    }
  ],

  "localfold_projects": [
    { "id": "proj_1", "name": "TFM 2026", "color": "#4f8ef7" },
    { "id": "proj_2", "name": "Lote Abril", "color": "#22c55e" }
  ]
}
```

---

## El "Truco" Arquitectónico de Almacenamiento Cero

Para implementar la funcionalidad de **"Compartir por URL"** y **"Cargar Historial"** sin tener una base de datos pesada (y sin costes), nos aprovechamos del diseño REST del CESGA simulado:

1. **LocalFold NO guarda PDBs ni matrices PAE pesadas.** Solo guardamos IDs de texto diminutos en el `localStorage` (ej: `cesga_abc123`).
2. **Las URLs de compartir no llevan datos:** El enlace `localfold.es/results/cesga_abc123` solamente le pasa el ID a la otra persona.
3. **Carga en Tiempo Real (Just-In-Time):** Cuando el investigador 2 abre el enlace, el frontend React coge el ID de la URL y hace un `GET /jobs/cesga_abc123/outputs` a la API. Toda la data masiva descarga desde el servidor institucional (mock) directamente a la RAM del navegador del investigador 2.

**Ventajas para la solución del Hackathon:**
- Storage / Databases propias necesarias: Ninguna.
- Complejidad Backend propia añadida: Cero.
- Delegación de datos masivos al pipeline primario (CESGA).

---

## Lo que SÍ se puede personalizar sin cuentas

Con esta solución, el usuario puede:
- ✅ Ver su historial de predicciones al volver al día siguiente
- ✅ Agrupar jobs en proyectos con nombres personalizados
- ✅ Añadir notas a cada predicción
- ✅ Compartir un resultado concreto vía URL
- ✅ Exportar todo su historial como JSON (backup manual)

Lo que NO puede hacer sin cuentas reales:
- ❌ Acceder a su historial desde otro dispositivo/navegador
- ❌ Compartir su espacio completo con un colaborador
- ❌ El admin ver estadísticas de uso agregadas

---

## Para el pitch — visión de cuentas en producción

Al presentar al jurado, mencionar:

> "En el hackathon usamos almacenamiento local del navegador para el
> historial de predicciones. En la versión de producción conectada al
> CESGA real, cada investigador tendría una cuenta institucional (SSO
> con la cuenta USC/CSIC) y su historial estaría sincronizado en el
> clúster. El ID de sesión actual migra directamente a esa cuenta."

SSO institucional (Single Sign-On) = el investigador se loguea con
su cuenta de la USC/CSIC. Sin registros extra. Implementación en
producción: 1-2 semanas con Keycloak o similar (ya tienen en las universidades).

---

## Diagrama: ahora vs producción

```
HACKATHON (ahora):

Usuario → LocalFold Frontend → localStorage (historial)
                             → API Mock CESGA (predicciones)

PRODUCCIÓN:

Usuario → Login SSO (cuenta USC) → LocalFold Frontend
                                 → Backend propio (historial en DB)
                                 → CESGA real (predicciones reales)
```

---

## Decisión final

| Aspecto | Hackathon | Producción |
|---|---|---|
| Identidad | ID anónimo en localStorage | SSO institucional (USC/CSIC) |
| Persistencia | localStorage del navegador | Base de datos en CESGA |
| Historial | Por dispositivo/navegador | Sincronizado en cualquier lugar |
| Proyectos | Agrupados en localStorage | Carpetas en DB con permisos |
| Backend | Ninguno propio | FastAPI + PostgreSQL |
| Tiempo impl. | 2-3 horas | 1-2 semanas |
