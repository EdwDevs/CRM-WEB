// IMPORTANTE: módulo temporal de transacciones extraído de index.html durante la refactorización progresiva.
// IMPORTANTE: estas funciones se exponen en window porque view-transacciones.html mantiene onchange/onclick inline.
(function(){
'use strict';

function handleTipoChange(){
    // IMPORTANTE: la vista de transacciones es lazy-load; validar nodos evita romper scripts globales.
    if(!document.getElementById('tipo')||!document.getElementById('categoria'))return;
    const t=document.getElementById('tipo').value;
    const cc=document.getElementById('creditConfig');
    const pc=document.getElementById('divPagoTarjeta');
    const mp=document.getElementById('metodoPagoDiv');
    const md=document.getElementById('metodoDestinoDiv');
    const cat=document.getElementById('categoria');
    const categoryContext=document.getElementById('categoriaContextDiv');
    cc.classList.add('hidden');
    pc.classList.add('hidden');
    mp.classList.remove('hidden');
    md.classList.add('hidden');
    if(categoryContext)categoryContext.classList.remove('hidden');
    if(t==='credito'){
        cc.classList.remove('hidden');
        mp.classList.add('hidden');
        syncCreditPaymentDateField(true);
    }else if(t==='pago_tarjeta'){
        pc.classList.remove('hidden');
        if(categoryContext)categoryContext.classList.add('hidden');
    }else if(t==='transferencia'){
        md.classList.remove('hidden');
        if(categoryContext)categoryContext.classList.add('hidden');
    }
    cat.innerHTML='<option value="">Seleccione...</option>';
    document.getElementById('subcategoriaDiv').classList.add('hidden');
    if(t==='pago_tarjeta')cat.add(new Option('Abono Tarjeta','pago_tc'));
    else if(t==='transferencia')cat.add(new Option('Transferencia','transferencia'));
    else{
        const g=t==='credito'?'gasto':t;
        if(categorias[g]){
            Object.keys(categorias[g]).forEach(k=>{cat.add(new Option(categorias[g][k].icon+' '+k.toUpperCase().replace(/_/g,' '),k));});
        }
    }
}

function preSubmit(){
    const t=document.getElementById('tipo').value;
    const m=parseCurrencyInput(document.getElementById('monto').value);
    if(!Number.isFinite(m)||m<=0){alert('Monto inválido');return;}
    const d={tipo:t,monto:m,categoria:document.getElementById('categoria').value,subcategoria:document.getElementById('subcategoria').value||'',miembro:document.getElementById('miembro').value,descripcion:document.getElementById('descripcion').value,fecha:document.getElementById('fecha').value,timestamp:firebase.firestore.FieldValue.serverTimestamp()};
    if(t==='credito'){
        const tc=document.getElementById('tarjetaCredito').value;
        const c=parseInt(document.getElementById('cuotas').value);
        const pagadasRaw=parseInt(document.getElementById('cuotasPagadas').value);
        const valorCuotaManualStr=document.getElementById('valorCuotaManual').value;
        const valorCuotaManual=parseCurrencyInput(valorCuotaManualStr);
        const cardData=findCardById(tc);
        const cardName=cardData?.name||'';
        if(!c||c<=0){showToast('Completa cuotas válidas','error');alert('Completa cuotas válidas');return;}
        const manualPaymentDate=document.getElementById('creditoFechaPago').value;
        const resolvedPaymentDate=manualPaymentDate||getDefaultCreditPaymentDate(tc, d.fecha);
        if(!resolvedPaymentDate){
            showToast('Define una fecha de pago válida','error');
            return;
        }
        d.cardId=tc;
        d.cardName=cardName;
        d.esCredito=true;
        d.cuotas=c;
        d.totalDeuda=m;
        if(!Number.isNaN(valorCuotaManual) && valorCuotaManual > 0){
            d.valorCuotaManual=valorCuotaManual;
        }
        d.fechaPrimerPago=resolvedPaymentDate;
        d.proximaFechaPago=resolvedPaymentDate;
        const pagadas=Number.isNaN(pagadasRaw)?0:Math.min(Math.max(pagadasRaw,0),c);
        d.cuotasPagadas=pagadas;
        tempTransactionData=d;
        document.getElementById('modalTarjeta').textContent=cardName;
        document.getElementById('modalCuotas').textContent=c;
        document.getElementById('modalTotalDeuda').textContent=formatMoney(m);
        const cuotaCalculada = (d.valorCuotaManual !== undefined) ? d.valorCuotaManual : (m/c);
        document.getElementById('modalValorCuota').textContent=formatMoney(cuotaCalculada) + (d.valorCuotaManual !== undefined ? ' (Manual)' : ' (Automática)');
        document.getElementById('creditModal').style.display='flex';
    }else{
        if(t==='pago_tarjeta'){
            d.metodoPago=document.getElementById('metodoPago').value;
            d.tarjetaDestino=document.getElementById('tarjetaDestinoPago').value;
        }else{
            d.metodoPago=document.getElementById('metodoPago').value;
            if(t==='transferencia')d.metodoDestino=document.getElementById('metodoDestino').value;
        }
        saveTransaction(d);
    }
}

let isSavingTransaction=false;
async function saveTransaction(d){
    // IMPORTANTE: guardia anti-reentrada para evitar doble submit/guardado duplicado.
    if(isSavingTransaction)return;
    isSavingTransaction=true;
    const monto=Number(d?.monto);
    if(!isValidPositiveAmount(monto)){
        isSavingTransaction=false;
        showToast('Monto inválido','error');
        return;
    }
    d.monto=monto;
    const btn=document.getElementById('btnSubmitText');
    const shouldReturnToQuota = returnToQuotaModal;
    const wasEditing = Boolean(editingTransactionId);
    if(btn)btn.classList.add('is-loading');
    try{
        let result=null;
        if(editingTransactionId){
            result=await enqueueOrExecute({
                entity: 'transactions',
                action: 'update',
                payload: { id: editingTransactionId, data: d }
            });
        } else {
            result=await enqueueOrExecute({
                entity: 'transactions',
                action: 'add',
                payload: { data: d }
            });
        }
        cancelEdit();
        // IMPORTANTE: si la persistencia ya fue aceptada (online u offline), un fallo de refresco no debe marcar "Error al guardar".
        try{
            await loadTransactions();
        }catch(refreshError){
            console.error('Refresh post-save failed:', refreshError);
            registerDebugError('saveTransaction:refresh', refreshError);
            showToast('Guardado, pero no se pudo refrescar la vista de inmediato.', 'warning');
        }
        if(!result?.queued){
            showToast(wasEditing?'Actualizado':'Guardado','success');
        }
    }catch(e){
        console.error(e);
        registerDebugError('saveTransaction:enqueueOrExecute', e);
        showToast('Error al guardar. Verifica tu conexión.', 'error');
    }finally{
        if(btn)btn.classList.remove('is-loading');
        isSavingTransaction=false;
        if(shouldReturnToQuota){
            returnToQuotaModal=false;
            openQuotaModal();
        }
    }
}

function cancelEdit(){editingTransactionId=null; returnToQuotaModal=false; document.getElementById('transactionForm').reset(); document.getElementById('formTitle').textContent='Nueva Transacción'; document.getElementById('btnCancelar').classList.add('hidden'); document.getElementById('btnSubmitText').textContent='Guardar'; handleTipoChange();}

// IMPORTANTE: compatibilidad temporal con HTML inline de transacciones hasta reemplazar onchange/onclick por listeners.
window.handleTipoChange=handleTipoChange;
window.preSubmit=preSubmit;
window.saveTransaction=saveTransaction;
window.cancelEdit=cancelEdit;
})();
