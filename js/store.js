(function (global) {
  'use strict';

  const initialState = {
    transactions: [],
    cards: [],
    goals: [],
    audit: { issues: [], corrections: [] },
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
    state = { ...state, audit: audit || { issues: [], corrections: [] } };
    emit(prevState);
  }

  function updateViewDate(viewDate) {
    const prevState = state;
    state = { ...state, viewDate: viewDate instanceof Date ? viewDate : new Date(viewDate) };
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
