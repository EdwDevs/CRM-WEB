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

function isDebitMethod(method){
    return PAYMENT_METHODS[method]?.type === 'debit';
}

function getPaymentMethodLabel(method){
    return PAYMENT_METHODS[method]?.label || method || '';
}

function getDebitOwner(method){
    return isDebitMethod(method) ? PAYMENT_METHODS[method].owner : null;
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
window.isDebitMethod = isDebitMethod;
window.getPaymentMethodLabel = getPaymentMethodLabel;
window.getDebitOwner = getDebitOwner;
window.populatePaymentMethodSelect = populatePaymentMethodSelect;
})();
