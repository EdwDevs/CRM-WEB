# Guía interna: dependencias por slice del store

## Store global (`js/store.js`)
Estructura tipada por forma de estado:
- `transactions`: movimientos financieros normalizados.
- `cards`: tarjetas y metadatos de cupo/pago.
- `goals`: objetivos de ahorro.
- `audit`: alertas y correcciones de consistencia.
- `viewDate`: mes activo para dashboard y gráficos.

## Dependencias de componentes
- `transactions`
  - Dashboard (`updateDashboard`, `updateDailyCapIndicator`).
  - Historial (`renderHistory`).
  - Estadísticas (`renderCharts`, `renderTrendChart`).
  - Modal de cuotas abierto (refresh posterior a carga).
- `cards`
  - Selectores de formulario (`populateCardSelects`).
  - Filtro por método (`populateMethodFilter`).
  - Sincronización de transacciones crédito por `cardId`.
- `goals`
  - Vista Objetivos (`renderGoals`).
- `audit`
  - Panel de auditoría de consistencia (`renderConsistencyAudit` y acciones de corrección).
- `viewDate`
  - KPIs mensuales, alertas presupuestales, gráficos de tendencia y categorías.

## Notas de sincronización offline
- La cola offline y caché local se mantienen como fuente de persistencia temporal.
- Al cargar/mezclar (`mergeOfflineQueueIntoTransactions`, `mergeOfflineQueueIntoCards`), se publica en el store con acciones (`setTransactions`, `setCards`).
- El render UI sucede por suscripción única al store para reducir divergencia entre secciones.
