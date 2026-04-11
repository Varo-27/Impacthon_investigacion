# Migracion de modelo relacional a Firestore

## Objetivo

Traducir el modelo actual a una base de datos NoSQL en Firestore sin perder funcionalidades:

- crear proyectos colaborativos
- invitar usuarios a proyectos
- guardar jobs de prediccion
- asociar cada job a un proyecto
- permitir que un job cambie de proyecto en el futuro
- mantener la experiencia actual de listado, detalle, sync y visor

Firestore no se modela con joins ni claves foraneas estrictas. La solucion correcta es mezclar:

- documentos embebidos para datos de lectura frecuente
- referencias por ID para relaciones
- duplicacion controlada de algunos campos para evitar consultas complejas

## Colecciones propuestas

### `projects`

Un documento por proyecto.

Campos recomendados:

- `name`: nombre visible del proyecto
- `description`: descripcion opcional
- `ownerId`: uid del creador
- `memberIds`: array de uids para consultas rapidas
- `members`: array de objetos con datos de visualizacion
- `createdAt`: timestamp
- `updatedAt`: timestamp opcional

Ejemplo:

```json
{
  "name": "Estudio de ubiquitina",
  "description": "Proyecto para analizar variantes de UBC",
  "ownerId": "uid_123",
  "memberIds": ["uid_123", "uid_456"],
  "members": [
    {
      "uid": "uid_123",
      "email": "owner@demo.com",
      "displayName": "Ana",
      "role": "owner"
    },
    {
      "uid": "uid_456",
      "email": "user@demo.com",
      "displayName": "Luis",
      "role": "member"
    }
  ],
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `jobs`

Un documento por prediccion enviada.

Campos recomendados:

- `userId`: uid del usuario que lanza el job
- `projectId`: id del proyecto actual, opcional
- `projectName`: snapshot del nombre del proyecto, opcional pero muy util
- `cesgaJobId`: id externo del job en la API CESGA
- `proteinName`: nombre legible de la secuencia
- `status`: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`
- `fastaContent`: secuencia FASTA normalizada
- `createdAt`: timestamp
- `updatedAt`: timestamp opcional
- `projectHistory`: opcional, para auditar movimientos entre proyectos

Ejemplo:

```json
{
  "userId": "uid_123",
  "projectId": "proj_999",
  "projectName": "Estudio de ubiquitina",
  "cesgaJobId": "job_abc",
  "proteinName": "Ubiquitina",
  "status": "RUNNING",
  "fastaContent": ">sp|...",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "projectHistory": [
    {
      "projectId": "proj_111",
      "changedAt": "2026-04-11T10:00:00Z",
      "changedBy": "uid_123"
    },
    {
      "projectId": "proj_999",
      "changedAt": "2026-04-11T12:00:00Z",
      "changedBy": "uid_456"
    }
  ]
}
```

### `invitations`

Un documento por invitacion enviada.

Campos recomendados:

- `projectId`: proyecto destino
- `projectName`: snapshot del nombre del proyecto
- `fromUid`: uid de quien invita
- `fromEmail`: email de quien invita
- `fromDisplayName`: nombre de quien invita
- `toEmail`: email del destinatario
- `status`: `pending`, `accepted`, `declined`
- `createdAt`: timestamp
- `respondedAt`: timestamp opcional

Ejemplo:

```json
{
  "projectId": "proj_999",
  "projectName": "Estudio de ubiquitina",
  "fromUid": "uid_123",
  "fromEmail": "owner@demo.com",
  "fromDisplayName": "Ana",
  "toEmail": "user@demo.com",
  "status": "pending",
  "createdAt": "serverTimestamp"
}
```

## Regla de modelado

### Proyectos y miembros

La verdad final de la membresia debe vivir en `projects.members`.

`invitations` solo representa el flujo de invitacion. Cuando una invitacion se acepta, se agrega el usuario al array `members` del proyecto.

Para consultas mas faciles, conviene mantener tambien `memberIds`.

### Jobs y proyectos

Cada job apunta a un solo proyecto con `projectId`.

- si no tiene proyecto, el campo puede no existir
- si pertenece a un proyecto, guarda el id de ese proyecto
- si el job cambia de proyecto, se actualiza `projectId`

Si quieres preservar trazabilidad, añade `projectHistory`.

## Como funciona la relacion en Firestore

No hay joins.

Las consultas se resuelven asi:

- mis proyectos: `projects` filtrado por `memberIds array-contains uid`
- jobs de un proyecto: `jobs where projectId == id`
- mis jobs: `jobs where userId == uid`
- invitaciones pendientes: `invitations where toEmail == email and status == pending`

## Movimiento de jobs entre proyectos

Si un job puede cambiar de proyecto, la operacion debe ser un update del documento del job.

Opcion minima:

- actualizar `projectId`
- actualizar `projectName` si se usa snapshot

Opcion recomendada:

- actualizar `projectId`
- actualizar `projectName`
- append en `projectHistory`

Esto permite que:

- el job desaparezca del proyecto anterior automaticamente
- aparezca en el nuevo proyecto automaticamente
- la vista global de jobs siga viendolo por `userId`

## Flujo funcional actual

### Crear proyecto

1. Se crea el documento en `projects`.
2. Se guarda el creador dentro de `members`.
3. Se rellena `memberIds` con el uid del creador.

### Invitar usuario

1. Se crea una invitacion en `invitations`.
2. El buzon la lee por `toEmail`.
3. Si el usuario acepta, se actualiza el proyecto con `arrayUnion`.
4. Se marca la invitacion como `accepted`.

### Enviar FASTA

1. Se llama a la API CESGA.
2. Se crea un documento en `jobs`.
3. Si el envio viene desde un proyecto, se añade `projectId`.
4. Opcionalmente se guarda `projectName` como snapshot.

### Sync de estado

1. Se listan jobs desde Firestore.
2. Solo se sincronizan los que no estan en estado terminal.
3. Se consulta la API CESGA por cada job activo.
4. Si cambia el estado, se actualiza el documento en Firestore.

## Que hay que hacer para implementarlo

### 1. Modelo de datos en Firestore

La estructura real quedaria asi:

- `projects/{projectId}`
- `jobs/{jobId}`
- `invitations/{invitationId}`

No hace falta crear subcolecciones para el caso actual. Con el volumen y la funcionalidad que teneis, la coleccion plana es mas simple y suficiente.

### 2. Conexiones entre colecciones

Las relaciones quedarian asi:

- `jobs.projectId -> projects.id`
- `jobs.userId -> auth uid`
- `invitations.projectId -> projects.id`
- `invitations.toEmail -> email del usuario`
- `projects.members[].uid -> auth uid`

Flujo practico:

- crear proyecto: escribe en `projects`
- invitar usuario: escribe en `invitations`
- aceptar invitacion: actualiza `projects.members` y `invitations.status`
- enviar FASTA: escribe en `jobs`
- mover job de proyecto: actualiza `jobs.projectId`

### 3. Cambios en frontend

#### `SubmitFasta.jsx`

Hay que permitir que el job se cree con un `projectId` editable o seleccionable antes de enviar.

Cambios concretos:

- mantener la lectura del `projectId` por query param
- añadir selector de proyecto si el usuario quiere reasignar antes de lanzar
- al crear el job, guardar tambien `projectName` como snapshot opcional
- si el job puede moverse despues, crear una accion de reasignacion

#### `JobsList.jsx`

Debe seguir mostrando todos los jobs del usuario, pero ahora con soporte para cambio de proyecto.

Cambios concretos:

- seguir consultando por `userId`
- leer `projectName` para no depender siempre de lookup a `projects`
- si `projectId` cambia, la tarjeta del job debe mostrar el nuevo proyecto automaticamente
- si se añade boton de mover, usar `updateDoc(jobRef, { projectId, projectName, updatedAt })`

#### `ProjectDetail.jsx`

Debe seguir listando jobs por `projectId`, pero hay que contemplar que un job pueda salir o entrar de otro proyecto.

Cambios concretos:

- mantener la query `where("projectId", "==", id)`
- si el job cambia de proyecto, desaparece de aqui y aparece en el nuevo automaticamente
- el sync sigue igual, solo sobre jobs que pertenecen al proyecto actual

#### `Projects.jsx`

Aqui vive la logica de membresia e invitaciones.

Cambios concretos:

- al crear proyecto, guardar `memberIds` ademas de `members`
- al aceptar invitacion, actualizar `members` y `memberIds`
- al invitar, seguir creando documento en `invitations`

#### `RAGAssistant.jsx` y `Sidebar.jsx`

Tienen que seguir viendo bien los proyectos y jobs del usuario.

Cambios concretos:

- proyectos: filtrar por `memberIds array-contains uid` o mantener el filtro por `members`
- jobs: no cambia la base del filtro, sigue siendo `userId`
- si queres que el buscador no falle tras mover jobs, conviene usar `projectName` como respaldo

### 4. Cambios de backend / reglas Firestore

Si la app usa Firestore directamente desde el frontend, hay que ajustar reglas de seguridad.

Reglas que deberian existir conceptualmente:

- un usuario solo puede leer sus jobs
- un usuario solo puede leer proyectos donde es miembro
- un usuario solo puede crear y editar jobs propios
- un usuario solo puede modificar proyectos donde es owner o miembro con permiso
- invitaciones solo visibles para el destinatario o el emisor segun el caso

### 5. Indices de Firestore

Para que no falle el rendimiento, probablemente haran falta indices compuestos:

- `jobs`: `userId + status`
- `jobs`: `projectId + status` si se filtra asi en el futuro
- `invitations`: `toEmail + status`
- `projects`: `members + createdAt` si se hace busqueda avanzada

### 6. Migracion de datos existentes

Si ya hay datos cargados, la migracion deberia seguir este orden:

1. crear `memberIds` en todos los proyectos existentes
2. rellenar `projectName` en jobs que tengan `projectId`
3. asegurar que todos los jobs tengan `userId`, `status` y `createdAt`
4. normalizar invitations antiguas a `pending|accepted|declined`
5. revisar jobs sin `projectId` y decidir si quedan sueltos o se asignan a un proyecto por defecto

### 7. Orden recomendado de implementacion

1. adaptar el modelo de Firestore
2. actualizar reglas de seguridad
3. actualizar creacion de projects/jobs/invitations
4. actualizar lecturas de jobs por proyecto y por usuario
5. añadir movimiento de jobs entre proyectos
6. añadir migracion de datos viejos

## Lo que conviene cambiar antes de escalar

1. Guardar `memberIds` ademas de `members`.
2. Guardar `projectName` en `jobs` como snapshot opcional.
3. Añadir `projectHistory` si necesitais auditoria.
4. Si se va a mover jobs entre proyectos, hacer una UI de reasignacion basada en `updateDoc`.
5. Si un proyecto se renombra, decidir si solo cambia `projects.name` o si tambien se propaga a `jobs.projectName`.

## Propuesta de indice mental

- `projects`: lectura por usuario y por id
- `jobs`: lectura por usuario, por proyecto y por estado
- `invitations`: lectura por correo y por estado

## Resumen de impacto por archivo actual

- [frontend/src/pages/Projects.jsx](../frontend/src/pages/Projects.jsx): crear proyecto, invitar, aceptar/rechazar invitaciones, guardar membresia
- [frontend/src/pages/SubmitFasta.jsx](../frontend/src/pages/SubmitFasta.jsx): crear jobs y asociarlos a proyecto
- [frontend/src/pages/JobsList.jsx](../frontend/src/pages/JobsList.jsx): listar jobs del usuario y sincronizar estados
- [frontend/src/pages/ProjectDetail.jsx](../frontend/src/pages/ProjectDetail.jsx): listar jobs de un proyecto y sincronizar estados
- [frontend/src/components/Sidebar.jsx](../frontend/src/components/Sidebar.jsx): contador de invitaciones pendientes
- [frontend/src/pages/RAGAssistant.jsx](../frontend/src/pages/RAGAssistant.jsx): referencias a jobs y proyectos del usuario

## Implementacion minima viable

Si quereis una version pequena primero, haced esto:

- guardar `members` y `memberIds` en projects
- guardar `projectId` en jobs
- guardar `projectName` en jobs como snapshot opcional
- permitir `updateDoc` para mover jobs de proyecto
- dejar `invitations` como flujo de acceso

Con eso ya funciona la migracion sin necesidad de redisenar todo el frontend.

## Conclusion

La migracion correcta no intenta copiar una base relacional tal cual. En Firestore conviene guardar:

- la entidad principal como documento
- la relacion como un campo ID
- los datos de lectura frecuente como campos duplicados controlados

En vuestro caso, eso significa:

- proyectos en `projects`
- jobs en `jobs`
- invitaciones en `invitations`
- membresia real en `projects.members`
- asociacion de jobs a proyectos en `jobs.projectId`
- cambio de proyecto de un job mediante `updateDoc`

