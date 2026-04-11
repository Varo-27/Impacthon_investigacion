# Plan de Mejora — Sistema de Sync JobsList

## Cambios

### 1. Intervalo adaptativo (fijo 30s → 2s si hay activos, parado si no)

En `JobsList.jsx`, reemplazar el `setInterval` fijo por uno que se recalcula cada vez que cambia la lista de jobs.

**Logica:**
```
jobs.some(j => j.status === "PENDING" || j.status === "RUNNING")
  → setInterval(refresh, 2000)
  → clearInterval cuando ya no haya activos
```

El `useEffect` que gestiona el intervalo debe declarar `jobs` como dependencia para que se re-evalúe cada vez que Firestore actualiza la lista via `onSnapshot`.

---

### 2. Polling paralelo (`for...of` → `Promise.all`)

En `refreshCesgaStatuses`, cambiar el bucle secuencial a paralelo:

```js
// Antes — secuencial, bloquea en cold-start
for (const job of pending) {
  await fetch(...)
}

// Despues — paralelo, todos los jobs se consultan a la vez
await Promise.all(pending.map(job => fetch(...)))
```

---

### 3. Eliminar el boton Sync del UI

Con polling reactivo a 2s el boton no aporta nada al usuario.

- Eliminar el boton `<button onClick={handleRefresh}>Sync</button>` del header
- Mantener el handler `handleRefresh` unicamente para el shortcut `Shift+Click` (demo segura)
- El texto del footer `auto-sync cada 30s` cambia a `auto-sync en tiempo real`

---

## Archivos afectados

- `src/pages/JobsList.jsx` — unico archivo a modificar

## Orden de implementacion

1. `Promise.all` en `refreshCesgaStatuses` — 5 min, sin riesgo
2. Intervalo adaptativo — 10 min, sustituye el `useEffect` del interval actual
3. Quitar boton Sync del JSX — 2 min
