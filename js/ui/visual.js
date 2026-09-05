// IMPORTANTE: módulo temporal de UI visual extraído de index.html durante la refactorización progresiva.
// IMPORTANTE: estas funciones se exponen en window porque aún existen onclick inline y hooks globales en vistas HTML.
(function(){
'use strict';

// IMPORTANTE: escape local para no depender del escapeHtml global de app.js (que carga después de este módulo).
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}

function renderDebugPanel(){
    if(!debugState.enabled)return;
    let panel=document.getElementById('debugPanel');
    if(!panel){ panel=document.createElement('section'); panel.id='debugPanel'; document.body.appendChild(panel); }
    const recentErrorCount=debugState.lastErrors.length;
    panel.className=`debug-panel${debugState.expanded?'':' debug-panel--collapsed'}`;
    // IMPORTANTE: el panel debug debe iniciar colapsado y no ser intrusivo para QA visual.
    panel.innerHTML=debugState.expanded
        ? `<div class="debug-panel__head"><button class="debug-panel-toggle" type="button" aria-expanded="true" title="Colapsar debug local"><span aria-hidden="true">🐞</span><span class="debug-panel__badge">${recentErrorCount}</span><span>Debug local</span></button><span>${currentViewDate.toISOString().slice(0,10)}</span></div><div class="debug-panel__body"><div>Tx: ${transactions.length} · Cards: ${cardsList.length} · Cola: ${offlineQueue.length}</div><div class="debug-section-title"><strong>Eventos</strong></div><ul class="debug-panel__list">${debugState.lastEvents.map(e=>`<li><code>${e.type}</code> · ${e.at.slice(11,19)}</li>`).join('')||'<li>Sin eventos</li>'}</ul><div class="debug-section-title"><strong>Errores</strong></div><ul class="debug-panel__list">${debugState.lastErrors.map(e=>`<li>${escapeHtml(e.scope)}: ${escapeHtml(e.message)}</li>`).join('')||'<li>Sin errores</li>'}</ul></div>`
        : `<button class="debug-panel-toggle" type="button" aria-expanded="false" title="Abrir debug local"><span aria-hidden="true">🐞</span><span class="debug-panel__badge">${recentErrorCount}</span></button>`;
    panel.querySelector('.debug-panel-toggle')?.addEventListener('click',toggleDebugPanel);
}

function initCollapsibleCards(){
    const cards=document.querySelectorAll('.collapsible-card');
    cards.forEach(card=>{
        if(card.dataset.bound==='1')return;
        card.dataset.bound='1';
        // IMPORTANTE: las secciones secundarias marcadas por vista arrancan cerradas aunque el HTML sea reutilizado.
        if(card.dataset.forceCollapsed==='true')card.open=false;
        // IMPORTANTE: al expandir, forzar resize evita charts cortados tras abrir panel plegado.
        card.addEventListener('toggle',()=>{
            if(!card.open)return;
            setTimeout(()=>{
                if(card.querySelector('#chartTendencias, #chartIngresosGastos')){
                    renderTrendChart();
                }
                if(card.querySelector('#chartCategorias, #chartTopCategorias')){
                    renderCharts();
                }
                if(chartInstance)chartInstance.resize();
                if(trendChartInstance)trendChartInstance.resize();
                if(trendBarChartInstance)trendBarChartInstance.resize();
                if(topCategoriesChartInstance)topCategoriesChartInstance.resize();
            },120);
        });
    });
}

function renderReminders(){
    const cont=document.getElementById('remindersContainer');
    if(!cont)return;
    const today=new Date();
    today.setHours(0,0,0,0);
    
    const reminders=[];
    
    Object.keys(globalDeudaPorTarjeta).forEach(card=>{
        if(globalDeudaPorTarjeta[card]>0){
            const cardData=cardsList.find(c=>c.name===card);
            const paymentDay=cardData?.diaPago?parseInt(cardData.diaPago):15;
            
            // Lógica corregida: Buscar fecha real basada en los créditos
            const cardCredits = transactions.filter(t => 
                t.tipo === 'credito' && 
                t.esCredito && 
                resolveCreditCardName(t) === card && 
                (t.cuotasPagadas || 0) < (t.cuotas || 1)
            );

            let nextPaymentDate = null;
            // IMPORTANTE: crédito cuya cuota se paga próximamente; permite abrir el pago en 1 toque desde el recordatorio.
            let nextDueCredit = null;

            if (cardCredits.length > 0) {
                // Obtener todas las próximas fechas de pago
                const dates = cardCredits.map(cred => {
                    if (cred.proximaFechaPago) {
                        const parts = cred.proximaFechaPago.split('-');
                        return new Date(parts[0], parts[1] - 1, parts[2]);
                    } else {
                        // Si no hay fecha guardada, usar el default de este mes
                        let d = new Date(today.getFullYear(), today.getMonth(), paymentDay);
                        // Si hoy ya pasó el día de pago y no se ha pagado (no tiene proximaFechaPago), 
                        // técnicamente está vencido o es hoy, así que dejamos esa fecha para que salga alerta.
                        return d;
                    }
                });
                // Ordenar y tomar la más antigua (la deuda más próxima)
                const ordered=dates.map((d,i)=>({d,i})).sort((a,b)=>a.d-b.d);
                nextPaymentDate = ordered[0].d;
                nextDueCredit = cardCredits[ordered[0].i];
            }

            // Fallback si algo falla
            if (!nextPaymentDate) {
                nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
                if(nextPaymentDate < today){
                    nextPaymentDate = new Date(today.getFullYear(), today.getMonth()+1, paymentDay);
                }
            }

            const daysUntilPayment=Math.ceil((nextPaymentDate-today)/(1000*60*60*24));
            
            reminders.push({
                title:`Pago ${card}`,
                cardName:card,
                debtLabel:formatMoney(globalDeudaPorTarjeta[card]),
                desc:`Deuda actual: ${formatMoney(globalDeudaPorTarjeta[card])}`,
                date:nextPaymentDate,
                daysUntil:daysUntilPayment,
                // IMPORTANTE: datos para pagarCuota() en 1 toque desde el recordatorio del Panel.
                dueCredit:nextDueCredit
            });
        }
    });

    // IMPORTANTE: mantener visible solo información urgente; no mostrar pagos a más de 1 día.
    const urgentReminders=reminders.filter(r=>r.daysUntil<2);
    if(urgentReminders.length===0){cont.innerHTML='';cont.classList.add('hidden');return;}
    cont.classList.remove('hidden');
    
    const getReminderStatus=r=>r.daysUntil<0?'vencido':(r.daysUntil===0?'hoy':'mañana');
    const resumen=urgentReminders.map(r=>`${r.title}: ${r.daysUntil<0?`vencido ${Math.abs(r.daysUntil)}d`:getReminderStatus(r)}`).join(' · ');
    const chipTone=urgentReminders.some(r=>r.daysUntil<=0)?'reminder-bell-chip--danger':'reminder-bell-chip--warning';
    const detailItems=urgentReminders.map(r=>{
        const status=getReminderStatus(r);
        const dateLabel=r.date.toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric'});
        // IMPORTANTE: botón "Pagar" abre pagarCuota() directamente; el pago pasa de 3 superficies anidadas a 1 toque.
        const credit=r.dueCredit;
        const cuotaNum=credit?(credit.cuotasPagadas||0)+1:0;
        const cuotaTotal=credit?.cuotas||1;
        const montoCuota=credit?((credit.totalDeuda||credit.monto)/cuotaTotal):0;
        const safeCardNameBtn=escapeHtml(r.cardName.replace(/'/g,"\\'"));
        const payAction=credit
            ? `<button class="btn btn--primary btn--sm reminder-popover__pay" type="button" onclick="pagarCuota('${escapeHtml(credit.id)}',${cuotaNum},${montoCuota},'${safeCardNameBtn}')"><i class="fas fa-calendar-check" aria-hidden="true"></i> Pagar</button>`
            : '';
        return `<div class="reminder-popover__item reminder-popover__item--${status}">
            <div class="reminder-popover__header">
                <strong>${escapeHtml(r.cardName)}</strong>
                <span class="reminder-popover__status">${escapeHtml(status)}</span>
            </div>
            <div class="reminder-popover__meta"><i class="fas fa-calendar-day"></i> ${escapeHtml(dateLabel)}</div>
            <div class="reminder-popover__meta"><i class="fas fa-credit-card"></i> Deuda actual: ${escapeHtml(r.debtLabel)}</div>
            ${payAction?`<div class="reminder-popover__actions">${payAction}</div>`:''}
        </div>`;
    }).join('');
    // IMPORTANTE: details mantiene la campanita compacta y revela únicamente el detalle urgente al tocarla.
    cont.innerHTML=`<details class="reminder-bell-chip ${chipTone}">
            <summary title="${escapeHtml(resumen)}" aria-label="Recordatorios de pago urgentes">
                <i class="fas fa-bell"></i>
                <span>${urgentReminders.length}</span>
            </summary>
            <div class="reminder-popover" role="list" aria-label="Detalle de pagos urgentes">
                ${detailItems}
            </div>
         </details>`;
}

// IMPORTANTE: compatibilidad temporal con HTML inline y VIEW_CONFIG hasta eliminar handlers globales.
window.renderDebugPanel=renderDebugPanel;
window.initCollapsibleCards=initCollapsibleCards;
window.renderReminders=renderReminders;
})();
