import { initialCases } from "../data/mockData.js";

// Initialize localStorage
export function initCases() {
  if (!localStorage.getItem("cases")) {
    localStorage.setItem("cases", JSON.stringify(initialCases));
  }
}

export function getCases() {
  return JSON.parse(localStorage.getItem("cases")) || [];
}

function saveCases(cases) {
  localStorage.setItem("cases", JSON.stringify(cases));
}

export function addCase(newCase) {
  const cases = getCases();
  cases.push(newCase);
  saveCases(cases);
}

export function updateCase(id, updates) {
  let cases = getCases();

  cases = cases.map(c =>
    c.id === id ? { ...c, ...updates } : c
  );

  saveCases(cases);
}

export function deleteCase(id) {
  let cases = getCases();
  cases = cases.filter(c => c.id !== id);
  saveCases(cases);
}