// IMPORTANTE: módulo temporal de charts extraído de index.html durante la refactorización progresiva.
// IMPORTANTE: estas funciones siguen globales porque VIEW_CONFIG y paneles plegables las invocan directamente.
(function(){
'use strict';

function toNumber(value){
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:0;
}

function escapeHtml(value){
    return String(value??'')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
}

function getStatsDataSnapshot(){
    const state=window.AppStore?.getState?.()||{};
    return {
        // IMPORTANTE: usar AppStore cuando esté disponible evita pedir datos nuevos a Firebase para calcular insights.
        transactions:Array.isArray(state.transactions)?state.transactions:(Array.isArray(transactions)?transactions:[]),
        cards:Array.isArray(state.cards)?state.cards:(Array.isArray(cardsList)?cardsList:[]),
        goals:Array.isArray(state.goals)?state.goals:(Array.isArray(goals)?goals:[]),
        viewDate:state.viewDate instanceof Date?state.viewDate:(currentViewDate instanceof Date?currentViewDate:new Date())
    };
}

function resolveInsightCardName(tx,cards){
    if(tx?.cardId){
        const card=cards.find(item=>item.id===tx.cardId);
        if(card)return card.name;
    }
    return tx?.cardName||tx?.metodoPago||'';
}

function calculateInsightDebtByCard(dataTransactions,cards){
    const debtMap={};
    cards.forEach(card=>{ debtMap[card.name]=0; });

    dataTransactions.forEach(tx=>{
        const amount=toNumber(tx?.monto);
        if(tx?.tipo==='pago_tarjeta'){
            if(debtMap[tx.tarjetaDestino]!==undefined)debtMap[tx.tarjetaDestino]-=amount;
            return;
        }
        if(tx?.tipo!=='credito'&&!tx?.esCredito)return;
        const cardName=resolveInsightCardName(tx,cards);
        if(!cardName||debtMap[cardName]===undefined)return;

        const totalDebt=toNumber(tx.totalDeuda)||amount;
        const installments=Math.max(1,toNumber(tx.cuotas)||1);
        const paid=Math.max(0,toNumber(tx.cuotasPagadas));
        const pending=Math.max(0,installments-paid);
        debtMap[cardName]+=tx.valorCuotaManual&&toNumber(tx.valorCuotaManual)>0
            ? toNumber(tx.valorCuotaManual)*pending
            : (totalDebt/installments)*pending;
    });

    return debtMap;
}

function buildGoalInsight(goalsData){
    if(!goalsData.length){
        return {
            icon:'fas fa-bullseye',
            label:'Objetivos',
            value:'Sin metas',
            detail:'Crea una meta para medir avance de ahorro.',
            tone:'neutral'
        };
    }

    const totalTarget=goalsData.reduce((sum,goal)=>sum+toNumber(goal.target),0);
    const totalSaved=goalsData.reduce((sum,goal)=>sum+toNumber(goal.saved),0);
    const progress=totalTarget>0?(totalSaved/totalTarget)*100:0;
    const upcoming=goalsData
        .map(goal=>({goal,deadline:goal.deadline?new Date(`${goal.deadline}T00:00:00`):null}))
        .filter(item=>item.deadline&&!Number.isNaN(item.deadline.getTime()))
        .sort((a,b)=>a.deadline-b.deadline)[0];
    const upcomingText=upcoming?`Próxima: ${escapeHtml(upcoming.goal.name)} (${upcoming.deadline.toLocaleDateString('es-CO',{month:'short',day:'numeric'})}).`:'Sin fecha próxima configurada.';

    return {
        icon:'fas fa-bullseye',
        label:'Objetivos',
        value:`${progress.toFixed(1)}%`,
        detail:`${formatMoney(totalSaved)} de ${formatMoney(totalTarget)}. ${upcomingText}`,
        tone:progress>=75?'positive':(progress>=35?'warning':'neutral')
    };
}

function buildStatsInsights(params){
    const {monthly,categoryTotals,transactions:txs,cards,goals}=params;
    const sortedCategories=Object.entries(categoryTotals).sort(([,a],[,b])=>b-a);
    const topCategory=sortedCategories[0];
    const debtMap=calculateInsightDebtByCard(txs,cards);
    const totalDebt=Object.values(debtMap).reduce((sum,value)=>sum+toNumber(value),0);
    const totalQuota=cards.reduce((sum,card)=>sum+toNumber(card.quota),0);
    const availableQuota=cards.reduce((sum,card)=>sum+(toNumber(card.quota)-toNumber(debtMap[card.name])+toNumber(card.ajusteDisponible)),0);
    const utilization=totalQuota>0?(totalDebt/totalQuota)*100:0;
    const cashFlow=monthly.income-monthly.expenses;

    return [
        {
            icon:cashFlow>=0?'fas fa-arrow-trend-up':'fas fa-arrow-trend-down',
            label:'Flujo del mes',
            value:formatMoney(cashFlow),
            detail:`Ingresos ${formatMoney(monthly.income)} · gastos ${formatMoney(monthly.expenses)}.`,
            tone:cashFlow>=0?'positive':'danger'
        },
        {
            icon:'fas fa-layer-group',
            label:'Categoría líder',
            value:topCategory?escapeHtml(topCategory[0]):'Sin gastos',
            detail:topCategory?`${formatMoney(topCategory[1])} · ${monthly.expenses>0?((topCategory[1]/monthly.expenses)*100).toFixed(1):'0.0'}% del gasto mensual.`:'Registra gastos para detectar concentración.',
            tone:topCategory?'neutral':'warning'
        },
        {
            icon:'fas fa-credit-card',
            label:'Tarjetas',
            value:cards.length?`${utilization.toFixed(1)}% usado`:'Sin tarjetas',
            detail:cards.length?`Deuda ${formatMoney(totalDebt)} · disponible ${formatMoney(availableQuota)}.`:'Agrega tarjetas para evaluar cupo disponible.',
            tone:utilization>=80?'danger':(utilization>=55?'warning':'positive')
        },
        buildGoalInsight(goals)
    ];
}

function renderStatsInsights(monthly,categoryTotals){
    const grid=document.getElementById('statsInsightsGrid');
    const empty=document.getElementById('statsInsightsEmpty');
    if(!grid)return;

    const snapshot=getStatsDataSnapshot();
    const hasAnyData=snapshot.transactions.length>0||snapshot.cards.length>0||snapshot.goals.length>0;
    const insights=buildStatsInsights({
        monthly,
        categoryTotals,
        transactions:snapshot.transactions,
        cards:snapshot.cards,
        goals:snapshot.goals
    });

    grid.innerHTML=insights.map(insight=>`
        <article class="stats-insight-card stats-insight-card--${insight.tone}" role="listitem">
            <span class="stats-insight-card__icon" aria-hidden="true"><i class="${insight.icon}"></i></span>
            <div class="stats-insight-card__body">
                <span class="stats-insight-card__label">${insight.label}</span>
                <strong class="stats-insight-card__value">${insight.value}</strong>
                <p>${insight.detail}</p>
            </div>
        </article>`).join('');
    if(empty)empty.classList.toggle('hidden',hasAnyData);
}

function renderTrendChart(){
    const trendCanvas=document.getElementById('chartTendencias');
    const barCanvas=document.getElementById('chartIngresosGastos');
    const canRenderTrend=trendCanvas&&!isCanvasInsideClosedCollapsible(trendCanvas);
    const canRenderBar=barCanvas&&!isCanvasInsideClosedCollapsible(barCanvas);
    if(!canRenderTrend&&!canRenderBar)return;

    const snapshot=getStatsDataSnapshot();
    const trend=FinanceEngine.computeTrend6M(snapshot.transactions,snapshot.viewDate);
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

function renderCharts(){
    const c=document.getElementById('chartCategorias');
    const snapshot=getStatsDataSnapshot();
    const canRenderCategory=c&&!isCanvasInsideClosedCollapsible(c);
    const ct={};
    const vm=snapshot.viewDate.getMonth();
    const vy=snapshot.viewDate.getFullYear();
    const monthly=FinanceEngine.computeMonthlyMetrics(snapshot.transactions,snapshot.viewDate);
    const monthlyIncome=monthly.income;
    const monthlyExpenses=monthly.expenses;
    const daysInMonth=new Date(vy, vm+1, 0).getDate();
    monthly.monthTransactions.forEach(t=>{
        const m=parseFloat(t.monto);
        if(t.tipo==='gasto'||t.tipo==='credito'){
            const n=t.categoria||'Otros';
            ct[n]=(ct[n]||0)+m;
        }
    });

    renderStatsInsights(monthly,ct); // IMPORTANTE: insights superiores usan el mismo ciclo/hook de VIEW_CONFIG que los charts existentes.

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
                    <span>${escapeHtml(name)}</span>
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

if(window.AppStore?.subscribe){
    AppStore.subscribe((nextState,prevState)=>{
        if(nextState.cards===prevState.cards&&nextState.goals===prevState.goals)return;
        const monthly=FinanceEngine.computeMonthlyMetrics(nextState.transactions||[],nextState.viewDate);
        const categoryTotals={};
        monthly.monthTransactions.forEach(tx=>{
            if(tx.tipo!=='gasto'&&tx.tipo!=='credito')return;
            const category=tx.categoria||'Otros';
            categoryTotals[category]=(categoryTotals[category]||0)+toNumber(tx.monto);
        });
        // IMPORTANTE: re-render solo de insights; los gráficos completos siguen dependiendo de los hooks existentes de VIEW_CONFIG/renderCharts().
        renderStatsInsights(monthly,categoryTotals);
    });
}

// IMPORTANTE: compatibilidad temporal con hooks globales de vistas hasta completar la migración sin inline JS.
window.renderTrendChart=renderTrendChart;
window.renderCharts=renderCharts;
})();
