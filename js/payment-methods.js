// IMPORTANTE: configuración central de métodos/cuentas; mantener aquí las etiquetas y metadatos usados por formularios, filtros y reportes.
(function(){
'use strict';

const PAYMENT_METHODS = Object.freeze({
    debito_edward: Object.freeze({ label: 'Débito Edward', type: 'debit', owner: 'edward' }),
    debito_eliana: Object.freeze({ label: 'Débito Eliana', type: 'debit', owner: 'eliana' }),
    debito: Object.freeze({ label: 'Débito general / histórico', type: 'debit', owner: 'historico' }),
    efectivo: Object.freeze({ label: 'Efectivo', type: 'cash', owner: null }),
    nequi: Object.freeze({ label: 'Nequi', type: 'wallet', owner: null })
});

// IMPORTANTE: el orden define cómo aparecen los métodos en selects y filtros compartidos.
const PAYMENT_METHOD_ORDER = Object.freeze(['debito_edward', 'debito_eliana', 'debito', 'efectivo', 'nequi']);
const PAYMENT_METHOD_OPTIONS = Object.freeze(PAYMENT_METHOD_ORDER.map(value => Object.freeze({
    value,
    label: PAYMENT_METHODS[value].label
})));
// IMPORTANTE: `debito` representa saldos históricos/sin asignar y debe viajar junto a las cuentas nuevas en totales agregados.
const DEBIT_METHOD_VALUES = Object.freeze(PAYMENT_METHOD_ORDER.filter(value => PAYMENT_METHODS[value].type === 'debit'));
const DEBIT_TOTAL_FILTER_VALUE = 'debito_total';

function normalizePaymentMethodKey(method){
    return String(method || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function isDebitMethod(method){
    return PAYMENT_METHODS[normalizePaymentMethodKey(method)]?.type === 'debit';
}

function getPaymentMethodLabel(method){
    return PAYMENT_METHODS[normalizePaymentMethodKey(method)]?.label || method || '';
}

function getDebitOwner(method){
    const normalizedMethod = normalizePaymentMethodKey(method);
    return isDebitMethod(normalizedMethod) ? PAYMENT_METHODS[normalizedMethod].owner : null;
}

function isDebitTotalFilter(method){
    return method === DEBIT_TOTAL_FILTER_VALUE;
}

function matchesPaymentMethodFilter(method, filterValue){
    if(!filterValue || filterValue === 'all')return true;
    const normalizedMethod = normalizePaymentMethodKey(method);
    if(isDebitTotalFilter(filterValue)){
        // IMPORTANTE: el filtro "Débito total" incluye la cuenta histórica `debito` y las cuentas asignadas nuevas.
        return DEBIT_METHOD_VALUES.includes(normalizedMethod);
    }
    return normalizedMethod === filterValue;
}

function populatePaymentMethodSelect(select){
    if(!select)return;
    // IMPORTANTE: reconstruir opciones desde la configuración central evita divergencias entre origen y destino.
    select.innerHTML = '';
    PAYMENT_METHOD_OPTIONS.forEach(({ value, label }) => select.add(new Option(label, value)));
}

window.PAYMENT_METHODS = PAYMENT_METHODS;
window.PAYMENT_METHOD_ORDER = PAYMENT_METHOD_ORDER;
window.PAYMENT_METHOD_OPTIONS = PAYMENT_METHOD_OPTIONS;
window.DEBIT_METHOD_VALUES = DEBIT_METHOD_VALUES;
window.DEBIT_TOTAL_FILTER_VALUE = DEBIT_TOTAL_FILTER_VALUE;
window.normalizePaymentMethodKey = normalizePaymentMethodKey;
window.isDebitMethod = isDebitMethod;
window.getPaymentMethodLabel = getPaymentMethodLabel;
window.getDebitOwner = getDebitOwner;
window.isDebitTotalFilter = isDebitTotalFilter;
window.matchesPaymentMethodFilter = matchesPaymentMethodFilter;
window.populatePaymentMethodSelect = populatePaymentMethodSelect;
})();
