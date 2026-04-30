(function (global) {
  'use strict';

  function toFiniteNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseTxDate(tx) {
    if (!tx || typeof tx.fecha !== 'string') return null;
    const parts = tx.fecha.split('-').map(Number);
    if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
    const y = parts[0];
    const m = parts[1] - 1;
    const d = Number.isFinite(parts[2]) ? parts[2] : 1;
    const date = new Date(y, m, d);
    if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
    return date;
  }

  function isCompleteTx(tx) {
    const amount = toFiniteNumber(tx?.monto);
    return !!tx && !!tx.tipo && !!tx.fecha && amount !== null && amount >= 0;
  }

  function computeMonthlyMetrics(transactions, viewDate) {
    const baseDate = viewDate instanceof Date ? viewDate : new Date();
    const vm = baseDate.getMonth();
    const vy = baseDate.getFullYear();
    const monthTransactions = (transactions || []).filter(tx => {
      if (!isCompleteTx(tx) || tx.pendingDelete) return false;
      const date = parseTxDate(tx);
      return !!date && date.getMonth() === vm && date.getFullYear() === vy;
    });

    const income = monthTransactions
      .filter(tx => tx.tipo === 'ingreso' && !tx.esCredito)
      .reduce((sum, tx) => sum + Number(tx.monto), 0);
    const expenses = monthTransactions
      .filter(tx => tx.tipo === 'gasto' || tx.tipo === 'credito')
      .reduce((sum, tx) => sum + Number(tx.monto), 0);
    const cashFlow = income - expenses;
    const savingsRate = income > 0 ? (cashFlow / income) * 100 : 0;

    return { income, expenses, cashFlow, savingsRate, monthTransactions };
  }

  function computeTrend6M(transactions, viewDate) {
    const baseDate = viewDate instanceof Date ? viewDate : new Date();
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const metrics = computeMonthlyMetrics(transactions, d);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('es-CO', { month: 'short' }),
        income: metrics.income,
        expense: metrics.expenses,
        flow: metrics.cashFlow
      });
    }
    return out;
  }

  function computeDebtSnapshot(cards, debtMap) {
    const totalDebt = Object.values(debtMap || {}).reduce((s, v) => s + Number(v || 0), 0);
    const cardsWithDebt = Object.values(debtMap || {}).filter(v => Number(v || 0) > 0).length;
    return { totalDebt, cardsWithDebt, cardCount: (cards || []).length };
  }

  function buildAuditInsights(params) {
    const { transactions, viewDate, cards, debtMap, formatMoney } = params || {};
    const money = typeof formatMoney === 'function' ? formatMoney : (v) => `${v}`;
    const month = computeMonthlyMetrics(transactions, viewDate);
    const trend6 = computeTrend6M(transactions, viewDate);
    const debt = computeDebtSnapshot(cards, debtMap);

    const avgExpense = trend6.reduce((s, m) => s + m.expense, 0) / Math.max(trend6.length, 1);
    const avgIncome = trend6.reduce((s, m) => s + m.income, 0) / Math.max(trend6.length, 1);
    const coverageMonths = avgExpense > 0 ? month.income / avgExpense : 0;
    const trendDelta = trend6.length > 1 ? trend6[trend6.length - 1].flow - trend6[0].flow : 0;

    // IMPORTANTE: salida estándar para dashboard/estadísticas/auditoría, evita cálculos divergentes entre vistas.
    const insights = [
      {
        title: 'Lectura financiera del mes',
        badge: 'Análisis',
        badgeClass: '',
        body: `Ingresos: ${money(month.income)} · Gastos + crédito: ${money(month.expenses)} · Flujo neto: ${money(month.cashFlow)} · Ahorro: ${month.savingsRate.toFixed(1)}%.`,
        meta: month.cashFlow >= 0
          ? 'Positivo: mantén disciplina de gasto y fortalece fondo de reserva.'
          : 'Negativo: revisar gastos variables y priorizar reducción de salidas no esenciales.'
      },
      {
        title: 'Tendencia y proyección (6 meses)',
        badge: 'Proyección',
        badgeClass: '',
        body: `Ingreso promedio 6M: ${money(avgIncome)} · Gasto promedio 6M: ${money(avgExpense)} · Deuda actual: ${money(debt.totalDebt)}.`,
        meta: trendDelta >= 0
          ? `Mejora de flujo acumulada: ${money(trendDelta)}. Proyección favorable si mantienes el ritmo actual.`
          : `Deterioro de flujo acumulado: ${money(trendDelta)}. Se recomienda plan de ajuste para próximos 60-90 días.`
      },
      {
        title: 'Cobertura operativa estimada',
        badge: 'Riesgo',
        badgeClass: coverageMonths < 1 ? 'audit-badge--danger' : '',
        body: `Cobertura con ingresos del mes sobre gasto promedio: ${coverageMonths.toFixed(2)} meses.`,
        meta: coverageMonths >= 1
          ? 'Cobertura aceptable. Objetivo sugerido: 2-3 meses.'
          : 'Cobertura baja. Prioriza colchón de liquidez y reducción de deuda rotativa.'
      }
    ];

    return { insights, month, trend6, debt, coverageMonths, avgExpense, avgIncome };
  }

  global.FinanceEngine = {
    computeMonthlyMetrics,
    computeTrend6M,
    computeDebtSnapshot,
    buildAuditInsights,
    parseTxDate,
    isCompleteTx
  };
})(window);
