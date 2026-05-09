# Guía interna del sistema visual

<!-- IMPORTANTE: esta guía es la fuente de verdad para construir vistas consistentes sin estilos inline ni variantes visuales aisladas. -->

Esta documentación define los patrones que deben seguir las vistas HTML del CRM. Su objetivo es que cada pantalla tenga una jerarquía reconocible, estados dinámicos predecibles y comportamiento móvil consistente.

## 1. Estructura estándar por vista

Toda vista en `views/` debe organizarse con una lectura de arriba hacia abajo:

1. **Contenedor de vista**: usa `tab-content` y `view-stack` para participar del sistema de pestañas y espaciado vertical.
2. **Cabecera de vista**: usa `.view-header` para título, descripción y acción principal.
3. **Resumen o card principal**: muestra el flujo prioritario de la vista; si aplica, marca la card con `.view-primary-card`.
4. **Contenido secundario**: agrupa detalles, filtros avanzados o gráficos adicionales en `.view-secondary-stack` y plegables.
5. **Estados dinámicos**: reserva estados vacíos, alertas y fallbacks cerca del contenido que controlan.

```html
<div id="view-ejemplo" class="tab-content view-stack">
    <!-- IMPORTANTE: .view-header debe ser la primera sección visible para orientar al usuario. -->
    <header class="view-header">
        <div>
            <h1 class="view-header__title">Nombre de la sección</h1>
            <p class="view-header__subtitle">Describe qué puede resolver el usuario en esta vista.</p>
        </div>
        <div class="view-header__actions">
            <button class="btn btn--primary" type="button">Acción principal</button>
        </div>
    </header>

    <!-- IMPORTANTE: la primera card debe contener el flujo de negocio más importante. -->
    <section class="card view-primary-card" aria-labelledby="seccion-principal-title">
        <div class="card-header">
            <h2 id="seccion-principal-title" class="card-title">Trabajo principal</h2>
        </div>
        <div class="card-body">
            Contenido de la sección.
        </div>
    </section>
</div>
```

### Reglas de jerarquía

- Usa **un solo** `<h1>` por vista dentro de `.view-header__title`.
- Usa títulos de card (`.card-title`) para subsecciones; no agregues títulos visuales con clases nuevas si `.card-title` resuelve el caso.
- Mantén las acciones primarias en `.view-header__actions` y las acciones secundarias dentro de `.card-actions`.
- No renombres IDs consumidos por JavaScript; si una sección se mueve, conserva sus IDs y agrega comentarios `IMPORTANTE` junto al nodo afectado.

## 2. Patrón de cards

`.card` es el contenedor estándar para bloques con borde, fondo elevado y padding del sistema. Debe usarse para formularios, tablas, resúmenes, gráficos y paneles funcionales.

### Anatomía recomendada

```html
<section class="card" aria-labelledby="card-balance-title">
    <!-- IMPORTANTE: .card-header alinea título y acciones sin márgenes inline. -->
    <div class="card-header">
        <div>
            <h2 id="card-balance-title" class="card-title">
                <i class="fas fa-wallet" aria-hidden="true"></i>
                Balance mensual
            </h2>
            <p class="card-subtitle">Resumen calculado con los movimientos del periodo actual.</p>
        </div>
        <div class="card-actions">
            <button class="btn btn--secondary btn--sm" type="button">Exportar</button>
        </div>
    </div>

    <!-- IMPORTANTE: .card-body delimita el contenido para evitar estructuras con padding duplicado. -->
    <div class="card-body">
        <p>Contenido, tabla, formulario o gráfico.</p>
    </div>
</section>
```

### Buenas prácticas

- Prefiere `.card-header`, `.card-title`, `.card-subtitle`, `.card-body` y `.card-actions` antes de crear clases nuevas.
- Usa iconos solo cuando ayuden a reconocer el tipo de contenido; marca iconos decorativos con `aria-hidden="true"`.
- Evita `style="..."`; extiende el sistema con clases reutilizables en CSS.
- Si la card contiene datos cargados por JS, deja el contenedor estable y alterna visibilidad con clases existentes como `hidden`.

## 3. Patrón de plegables

Los plegables reducen densidad inicial y deben usarse para contenido secundario: filtros avanzados, históricos, gráficos auxiliares o paneles de auditoría. El patrón estándar combina `<details>`, `.card` y `.collapsible-card`.

```html
<div class="view-secondary-stack">
    <!-- IMPORTANTE: data-force-collapsed mantiene cerrado el detalle secundario cuando se inicializa la vista. -->
    <details class="card collapsible-card" data-force-collapsed="true" data-secondary-section="true">
        <summary class="collapsible-card__summary card-header">
            <h2 class="card-title">Detalle avanzado</h2>
            <span class="card-subtitle">Opcional para la lectura inicial</span>
        </summary>

        <!-- IMPORTANTE: .collapsible-card__content separa el contenido expandido del summary accesible. -->
        <div class="collapsible-card__content">
            <p>Filtros, gráficos o información secundaria.</p>
        </div>
    </details>
</div>
```

### Reglas de uso

- Mantén abierta por defecto solo la sección que contiene el flujo principal; el resto debe usar `data-force-collapsed="true"` cuando no sea imprescindible al cargar.
- No metas botones críticos únicamente dentro de un plegable cerrado si el usuario necesita verlos al entrar.
- Usa `<summary>` como encabezado visible y accesible; evita reemplazarlo por un `div` con eventos manuales.
- Si hay gráficos dentro de un plegable, verifica que el renderizado responda al evento de apertura o al refresco existente.

## 4. Estados vacíos

Los estados vacíos deben explicar qué pasó, por qué la sección no tiene contenido y cuál es el siguiente paso recomendado. Usa `.empty-state` para componentes completos y `.section-empty-state` cuando el estado esté integrado en una tabla/lista legacy.

```html
<div class="empty-state" role="status">
    <!-- IMPORTANTE: el estado vacío debe ser accionable, no solo informar ausencia de datos. -->
    <span class="empty-state__icon" aria-hidden="true">
        <i class="fas fa-inbox"></i>
    </span>
    <strong class="empty-state__title">Sin registros todavía.</strong>
    <p class="empty-state__message">Crea el primer movimiento para activar métricas, filtros y reportes.</p>
    <button class="btn btn--primary btn--sm empty-state__action" type="button">Crear registro</button>
</div>
```

### Contenido recomendado

- **Título**: breve y específico (`Sin transacciones del periodo`, no `Vacío`).
- **Mensaje**: explica el criterio de ausencia (`No hay datos con los filtros actuales`).
- **Acción**: botón o enlace al flujo que resuelve el estado cuando exista una acción clara.
- **Accesibilidad**: usa `role="status"` para estados que aparecen tras carga o filtrado.

## 5. Alertas

Las alertas deben ser visibles, breves y asociadas a una acción o contexto concreto. En el dashboard existe una franja de alertas críticas (`.dashboard-alert-strip`) y una alerta presupuestal (`.budget-alert`) que sirven como referencia visual.

### Reglas de contenido

- Usa tono directo: qué ocurrió, impacto y acción sugerida.
- No mezcles alertas críticas con textos informativos largos; deriva el detalle a una card o plegable.
- Mantén los IDs dinámicos requeridos por JS cuando la alerta sea renderizada o actualizada desde scripts.
- Para alertas que aparecen/desaparecen, conserva un contenedor persistente y alterna `hidden` para evitar saltos de layout innecesarios.

```html
<section class="dashboard-alert-strip" aria-label="Alertas críticas">
    <!-- IMPORTANTE: conservar un contenedor estable evita saltos cuando JS muestra u oculta la alerta. -->
    <div id="budgetAlert" class="budget-alert hidden" role="alert">
        <div class="budget-alert-icon" aria-hidden="true">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="budget-alert-text">
            <div class="budget-alert-title">Presupuesto en riesgo</div>
            <div id="budgetAlertDesc" class="budget-alert-desc">Revisa las categorías con mayor consumo.</div>
        </div>
    </div>
</section>
```

## 6. Colores semánticos

Los colores del sistema viven en `styles/tokens.css` y deben consumirse por variables. No hardcodees colores en nuevas secciones salvo que estés agregando un token.

| Uso | Token principal | Token suave | Cuándo usarlo |
| --- | --- | --- | --- |
| Marca / acción primaria | `--primary` | `--primary-light` | CTA principal, foco visual, iconos principales |
| Éxito / ingreso | `--success` | `--success-light` | ingresos, confirmaciones, progreso positivo |
| Error / gasto / riesgo | `--danger` | `--danger-light` | gastos, errores, límites excedidos |
| Advertencia | `--warning` | `--warning-light` | presupuestos en riesgo, validaciones preventivas |
| Información | `--info` | `--info-light` | ayudas, métricas neutrales, acciones informativas |
| Crédito / deuda | `--credit` | `--credit-light` | tarjetas, cuotas, deuda o financiamiento |

### Reglas de aplicación

- Combina cada color semántico con su versión `*-light` para fondos de iconos o chips.
- Verifica contraste en modo claro y oscuro porque los tokens cambian con `[data-theme="dark"]`.
- Usa utilidades existentes como `icon-surface--success`, `icon-surface--danger`, `icon-surface--warning`, `icon-surface--info` o `icon-surface--credit` cuando apliquen.
- No uses rojo para todo lo negativo si el caso es preventivo; para riesgo no confirmado usa `--warning`.

## 7. Comportamiento mobile

El sistema mobile prioriza lectura vertical, acciones táctiles y eliminación de scrolls anidados.

### Reglas de layout

- `.main-wrapper` es el contenedor de scroll vertical; no agregues contenedores de pantalla completa con `overflow-y: auto` dentro de las vistas.
- `.view-header` pasa a layout vertical en pantallas pequeñas; por eso las acciones deben estar dentro de `.view-header__actions` para ocupar todo el ancho cuando corresponda.
- `.card-header` también puede apilar título y acciones; evita layouts que dependan de anchos fijos.
- Usa grids responsivos con `repeat(auto-fit, minmax(...))` o clases existentes; no fuerces columnas rígidas en mobile.
- Respeta el espacio de navegación inferior con los tokens y paddings existentes; no agregues elementos fijos nuevos sin validar safe area.

### Reglas táctiles y de contenido

- Botones y acciones deben ser fáciles de tocar; evita icon-only buttons sin etiqueta accesible.
- Los plegables secundarios deben iniciar cerrados para reducir desplazamiento inicial.
- Los estados vacíos deben caber en una pantalla móvil y ofrecer una acción clara.
- Evita tablas anchas sin contenedor o estrategia responsive; usa los wrappers existentes de tabla cuando aplique.

## 8. Checklist para nuevas secciones

Antes de abrir un PR con una nueva sección visual, valida lo siguiente:

- [ ] La vista inicia con `.view-header`, `.view-header__title` y `.view-header__subtitle`.
- [ ] La acción principal está en `.view-header__actions` o claramente integrada al flujo principal.
- [ ] El contenido prioritario usa `.card` y, si aplica, `.view-primary-card`.
- [ ] La card usa `.card-header`, `.card-title`, `.card-body` y `.card-actions` cuando corresponde.
- [ ] El contenido secundario está en `.view-secondary-stack` y/o `.collapsible-card`.
- [ ] Los plegables secundarios usan `data-force-collapsed="true"` cuando no deben abrirse al cargar.
- [ ] Cada lista, tabla o gráfico dinámico tiene un `.empty-state` o `.section-empty-state`.
- [ ] Las alertas usan tokens semánticos y contenedores persistentes para evitar saltos visuales.
- [ ] Los colores consumen variables de `styles/tokens.css`; no hay colores hardcodeados nuevos.
- [ ] La sección funciona en mobile sin columnas rígidas, scrolls anidados ni acciones inaccesibles.
- [ ] Los IDs usados por JavaScript se conservaron o se actualizó la dependencia correspondiente.
- [ ] Los cambios relevantes incluyen comentarios `IMPORTANTE` junto a dependencias de DOM, IDs o comportamiento crítico.
