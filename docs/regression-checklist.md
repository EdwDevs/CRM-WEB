# Checklist de regresión manual

## Flujos críticos

### 1) Auditoría de consistencia
- Abrir **Cupos y Deudas** y ejecutar **Ejecutar auditoría**.
- Verificar que se listan inconsistencias con badge y sugerencia.
- Aplicar correcciones, confirmar modal y validar recarga de datos.
- Repetir auditoría para validar disminución de issues.

### 2) Estadísticas y proyección
- Ir a **Estadísticas** con datos cargados y validar render de charts.
- Cambiar a un mes sin movimientos y validar fallback:
  - Tendencia y comparación ingresos/gastos.
  - Distribución y top categorías.
- Confirmar KPIs sin errores de consola.

### 3) Historial
- Filtrar por tipo, método y rango de fechas.
- Editar una transacción desde historial y validar persistencia.
- Eliminar una transacción y verificar refresco de tabla.

### 4) Sincronización online/offline
- Simular modo offline, crear/editar/eliminar transacciones.
- Confirmar mensajes de cola offline en toasts/indicador.
- Restaurar conexión y verificar que la cola se sincroniza.
- Validar que no quedan registros `pendingSync`.

## Panel debug local
- En `localhost` confirmar visualización del panel debug.
- Navegar entre vistas y verificar eventos `switchView`.
- Ejecutar auditoría y confirmar eventos `runConsistencyAudit`.
- Abrir estadísticas y validar eventos `renderCharts` + fallbacks cuando aplique.
