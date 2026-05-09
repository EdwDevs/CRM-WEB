// IMPORTANTE: módulo temporal de charts extraído de index.html durante la refactorización progresiva.
// IMPORTANTE: estas funciones siguen globales porque VIEW_CONFIG y paneles plegables las invocan directamente.
(function(){
'use strict';

function renderTrendChart(){
    const trendCanvas=document.getElementById('chartTendencias');
    const barCanvas=document.getElementById('chartIngresosGastos');
    const canRenderTrend=trendCanvas&&!isCanvasInsideClosedCollapsible(trendCanvas);
    const canRenderBar=barCanvas&&!isCanvasInsideClosedCollapsible(barCanvas);
    if(!canRenderTrend&&!canRenderBar)return;

    const trend=FinanceEngine.computeTrend6M(transactions,currentViewDate);
    const l=trend.map(t=>t.label);
    const i=trend.map(t=>t.income);
    const g=trend.map(t=>t.expense);

    // IMPORTANTE: Chart.js necesita canvas visible para medir correctamente; no inicializar si el details está cerrado.
    if(canRenderTrend){
        if(trendChartInstance)trendChartInstance.destroy();
        trendChartInstance=new Chart(trendCanvas,{type:'line',data:{labels:l,datasets:[{label:'Ing',data:i,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.1)',fill:true},{label:'Gas',data:g,borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.1)',fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}}}});
    }
    // IMPORTANTE: Chart.js necesita canvas visible para medir correctamente; no inicializar si el details está cerrado.
    if(canRenderBar){
        if(trendBarChartInstance)trendBarChartInstance.destroy();
        trendBarChartInstance=new Chart(barCanvas,{type:'bar',data:{labels:l,datasets:[{label:'Ingresos',data:i,backgroundColor:'rgba(16,185,129,0.6)',borderColor:'#10b981',borderWidth:1},{label:'Gastos',data:g,backgroundColor:'rgba(239,68,68,0.6)',borderColor:'#ef4444',borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{x:{stacked:false},y:{beginAtZero:true}}}});
    }
}

function renderCharts(){const c=document.getElementById('chartCategorias'); const canRenderCategory=c&&!isCanvasInsideClosedCollapsible(c); const ct={},vm=currentViewDate.getMonth(),vy=currentViewDate.getFullYear(); const monthly=FinanceEngine.computeMonthlyMetrics(transactions,currentViewDate); let monthlyIncome=monthly.income; let monthlyExpenses=monthly.expenses; const daysInMonth=new Date(vy, vm+1, 0).getDate(); monthly.monthTransactions.forEach(t=>{ const m=parseFloat(t.monto); if(t.tipo==='gasto'||t.tipo==='credito'){ const n=t.categoria||'Otros';ct[n]=(ct[n]||0)+m;}});
    const hasMonthlyTransactions=monthly.monthTransactions.length>0;
    const hasCategoryData=Object.keys(ct).length>0;
    const categoryFallback=document.getElementById('fallbackCategoryChart');
    const statsEmptyState=document.getElementById('statsEmptyState');
    // IMPORTANTE: el estado vacío principal evita que Estadísticas muestre un canvas en blanco cuando no hay movimientos del mes.
    if(statsEmptyState) statsEmptyState.classList.toggle('hidden', hasMonthlyTransactions);
    if(c)c.classList.toggle('hidden', !hasCategoryData);
    if(categoryFallback)categoryFallback.classList.toggle('hidden', !hasMonthlyTransactions || hasCategoryData);
    if(!hasCategoryData&&chartInstance){chartInstance.destroy();chartInstance=null;}
    // IMPORTANTE: Chart.js necesita canvas visible y datos reales para medir correctamente; no inicializar si el details está cerrado.
    if(canRenderCategory&&hasCategoryData){ if(chartInstance)chartInstance.destroy(); chartInstance=new Chart(c,{type:'doughnut',data:{labels:Object.keys(ct),datasets:[{data:Object.values(ct),backgroundColor:['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6']}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right'}}}}); }
    const avgDaily=daysInMonth>0?monthlyExpenses/daysInMonth:0;
    const savingsRate=monthlyIncome===0?0:((monthlyIncome-monthlyExpenses)/monthlyIncome)*100;
    const balance=monthlyIncome-monthlyExpenses;
    const prevDate=new Date(vy, vm-1, 1);
    const prevTotals=calculateMonthlyTotals(prevDate);
    const prevBalance=prevTotals.income-prevTotals.expenses;
    const variation=balance-prevBalance;
    const variationPercent=prevBalance===0?(balance===0?0:null):Math.abs((variation/prevBalance)*100);
    const variationLabel=variation===0?'→':(variation>0?'▲':'▼');
    const variationSign=variation>0?'+':'-';
    const variationValue=document.getElementById('kpiMonthlyVariation');
    const variationDetail=document.getElementById('kpiMonthlyVariationDetail');
    const dailyAverageEl=document.getElementById('kpiDailyAverage');
    const savingsRateEl=document.getElementById('kpiSavingsRate');
    if(dailyAverageEl)dailyAverageEl.textContent=formatMoney(avgDaily);
    if(savingsRateEl)savingsRateEl.textContent=`${savingsRate.toFixed(1)}%`;
    if(variationValue)variationValue.textContent=`${variationLabel} ${variation===0?'':variationSign}${formatMoney(Math.abs(variation))}`;
    if(variationDetail){
        const percentText=variationPercent===null?'N/A':`${variationPercent.toFixed(1)}%`;
        variationDetail.textContent=`${percentText} vs mes anterior`;
        variationDetail.style.color=variation===0?'var(--text-muted)':(variation>0?'var(--success)':'var(--danger)');
    }

    const topList=document.getElementById('topCategoriasList');
    const topCanvas=document.getElementById('chartTopCategorias');
    const sortedEntries=Object.entries(ct).sort(([,a],[,b])=>b-a);
    if(topList){
        if(sortedEntries.length===0){
            // IMPORTANTE: el ranking de categorías también entrega una acción cuando no hay gastos para evitar un bloque dinámico vacío.
            topList.innerHTML=renderEmptyState({icon:'fas fa-ranking-star',title:'Sin categorías para mostrar.',message:'Crea una transacción de gasto para construir el ranking del mes.',actionLabel:'Crear transacción',actionOnclick:'goToAddTransaction()'});
        }else{
            const totalExpenses=monthlyExpenses||1;
            topList.innerHTML=sortedEntries.slice(0,5).map(([name,value])=>`
                <div class="top-category-item">
                    <span>${name}</span>
                    <span class="top-category-amount">${formatMoney(value)} · ${((value/totalExpenses)*100).toFixed(1)}%</span>
                </div>`).join('');
        }
    }
    const topFallback=document.getElementById('fallbackTopChart');
    const canRenderTop=topCanvas&&!isCanvasInsideClosedCollapsible(topCanvas);
    if(topCanvas&&sortedEntries.length){
        topCanvas.classList.remove('hidden');
        if(topFallback)topFallback.classList.add('hidden');
        // IMPORTANTE: Chart.js necesita canvas visible para medir correctamente; no inicializar si el details está cerrado.
        if(canRenderTop){
            if(topCategoriesChartInstance)topCategoriesChartInstance.destroy();
            const topLabels=sortedEntries.slice(0,5).map(([name])=>name);
            const topValues=sortedEntries.slice(0,5).map(([,value])=>value);
            topCategoriesChartInstance=new Chart(topCanvas,{type:'bar',data:{labels:topLabels,datasets:[{label:'Gasto',data:topValues,backgroundColor:'rgba(79,70,229,0.6)',borderColor:'#4f46e5',borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}});
        }
    }else if(topCanvas){
        topCanvas.classList.add('hidden');
        if(topFallback)topFallback.classList.remove('hidden');
        if(topCategoriesChartInstance){topCategoriesChartInstance.destroy(); topCategoriesChartInstance=null;}
    }
    logEvent('renderCharts',{target:'estadisticas',categories:sortedEntries.length,hasCategoryData});
}

// IMPORTANTE: compatibilidad temporal con hooks globales de vistas hasta completar la migración sin inline JS.
window.renderTrendChart=renderTrendChart;
window.renderCharts=renderCharts;
})();
