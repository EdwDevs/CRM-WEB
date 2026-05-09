# Guía de patrón visual por vista

## Estructura base
Cada fragmento en `views/` debe iniciar con el contenedor `tab-content view-stack` y una cabecera común:

1. `.view-header`: agrupa el contexto de la pantalla y la acción principal.
2. `.view-title`: título corto, único y consistente.
3. `.view-subtitle`: explicación breve del alcance de la vista.
4. `.view-actions`: espacio reservado para la acción principal de negocio.

<!-- IMPORTANTE: esta guía evita que nuevas vistas introduzcan cabeceras o acciones inconsistentes. -->

## Jerarquía de contenido
- `.view-primary-card`: primera card visible; contiene el flujo más importante de la vista.
- `.view-summary`: resumen compacto para KPIs o indicadores que no necesitan una card alta.
- `.view-secondary-stack`: pila de secciones secundarias, preferiblemente en `<details>` cerrados por defecto.
- `.section-empty-state`: estado vacío estándar para listas, tablas o gráficos sin datos.

## Regla de densidad inicial
Al entrar a una vista, debe verse una sola card principal abierta siempre que sea posible. Los detalles secundarios se colocan en plegables con `data-force-collapsed="true"` para que `initCollapsibleCards()` los cierre al montar la UI.

## Acción principal por vista
- Dashboard: `Arqueo de cuentas`.
- Transacciones: `Guardar` dentro del formulario de transacción.
- Historial: `Aplicar filtros`; la exportación queda como detalle secundario.
- Objetivos: `Nuevo objetivo`.
- Asistente: `Ejecutar auditoría`.

## Compatibilidad funcional
No se deben renombrar IDs usados por JavaScript (`saldoTotal`, `transactionForm`, `chartCategorias`, `transactionList`, etc.). Si una sección se mueve a un plegable, conserva los IDs internos y añade comentarios `IMPORTANTE` cuando el cambio proteja una dependencia del renderizado.
