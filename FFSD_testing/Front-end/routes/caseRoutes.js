import {
  handleAddCase,
  handleGetCases,
  handleUpdateStatus,
  handleAddNote,
  handleTransferRequest
} from "../controllers/caseController.js";

export function submitCase(data) {
  return handleAddCase(data);
}

export function fetchCases() {
  return handleGetCases();
}

export function updateStatus(id, status) {
  return handleUpdateStatus(id, status);
}

export function addNote(id, note) {
  return handleAddNote(id, note);
}

export function requestTransfer(id, dept) {
  return handleTransferRequest(id, dept);
}