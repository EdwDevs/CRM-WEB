(function (global) {
  'use strict';

  const initialState = {
    transactions: [],
    cards: [],
    goals: [],
    audit: { issues: [], corrections: [], lastRunAt: null },
    viewDate: new Date()
  };

  let state = { ...initialState };
  const listeners = new Set();

  function getState() {
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function emit(prevState) {
    listeners.forEach((listener) => listener(state, prevState));
  }

  // IMPORTANTE: acciones explícitas para evitar mutaciones directas dispersas y mantener consistencia UI/cache.
  function setTransactions(transactions) {
    const prevState = state;
    state = { ...state, transactions: Array.isArray(transactions) ? transactions : [] };
    emit(prevState);
  }

  function setCards(cards) {
    const prevState = state;
    state = { ...state, cards: Array.isArray(cards) ? cards : [] };
    emit(prevState);
  }

  function setGoals(goals) {
    const prevState = state;
    state = { ...state, goals: Array.isArray(goals) ? goals : [] };
    emit(prevState);
  }

  function setAudit(audit) {
    const prevState = state;
    const nextAudit = audit || { issues: [], corrections: [], lastRunAt: null };
    state = { ...state, audit: { issues: [], corrections: [], lastRunAt: null, ...nextAudit } };
    emit(prevState);
  }

  // IMPORTANTE: se parsean strings YYYY-MM-DD como fecha local; `new Date(string)` los interpretaría como UTC
  // y está marcado como deprecado para strings no ISO en navegadores modernos.
  function normalizeViewDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parts = value.slice(0, 10).split('-').map(Number);
      if (parts.length === 3 && parts.every(Number.isFinite)) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date();
  }

  function updateViewDate(viewDate) {
    const prevState = state;
    state = { ...state, viewDate: normalizeViewDate(viewDate) };
    emit(prevState);
  }

  global.AppStore = {
    getState,
    subscribe,
    setTransactions,
    setCards,
    setGoals,
    setAudit,
    updateViewDate
  };
})(window);
