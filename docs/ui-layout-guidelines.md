# Guía de patrón visual por vista

<!-- IMPORTANTE: esta guía define el sistema de diseño interno para evitar cabeceras, cards y acciones inconsistentes entre vistas. -->

## Estructura base de vista
Cada fragmento en `views/` debe iniciar con el contenedor `tab-content view-stack` y una cabecera común:

1. `.view-header`: agrupa el contexto de la pantalla y la acción principal.
2. `.view-header__title`: título corto, único y consistente.
3. `.view-header__subtitle`: explicación breve del alcance de la vista.
4. `.view-header__actions`: espacio reservado para la acción principal de negocio.

> IMPORTANTE: `.view-title`, `.view-subtitle` y `.view-actions` quedan como alias legacy en CSS, pero no deben usarse en nuevas vistas.

## Estructura base de tarjeta
Las secciones internas que usen `.card` deben componerse con clases reutilizables del sistema:

1. `.card-header`: fila superior de contexto y acciones de la tarjeta.
2. `.card-title`: título de la tarjeta; puede incluir un icono antes del texto.
3. `.card-subtitle`: ayuda breve o metadato debajo del título cuando aplique.
4. `.card-body`: contenedor del contenido principal cuando se necesite separar estructura.
5. `.card-actions`: grupo de botones o acciones secundarias dentro de una tarjeta.

> IMPORTANTE: los encabezados específicos como `.stats-card-head` o `.stats-section-title` solo permanecen como compatibilidad legacy; el estándar visual actual es `.card-header` + `.card-title`.

## Jerarquía de contenido
- `.view-primary-card`: primera card visible; contiene el flujo más importante de la vista.
- `.view-summary`: resumen compacto para KPIs o indicadores que no necesitan una card alta.
- `.view-secondary-stack`: pila de secciones secundarias, preferiblemente en `<details>` cerrados por defecto.
- `.section-empty-state`: estado vacío estándar para listas, tablas o gráficos sin datos.

## Regla de densidad inicial
Al entrar a una vista, debe verse una sola card principal abierta siempre que sea posible. Los detalles secundarios se colocan en plegables con `data-force-collapsed="true"` para que `initCollapsibleCards()` los cierre al montar la UI.

## Acción principal por vista
- Dashboard: `Arqueo de cuentas` o acceso rápido equivalente cuando aplique.
- Transacciones: `Guardar` dentro del formulario de transacción.
- Historial: `Aplicar filtros`; la exportación queda como acción de `.card-actions` en la tabla.
- Objetivos: `Nuevo objetivo`.
- Asistente: `Ejecutar auditoría`.

## Compatibilidad funcional
No se deben renombrar IDs usados por JavaScript (`saldoTotal`, `transactionForm`, `chartCategorias`, `transactionList`, etc.). Si una sección se mueve a un plegable, conserva los IDs internos y añade comentarios `IMPORTANTE` cuando el cambio proteja una dependencia del renderizado.
