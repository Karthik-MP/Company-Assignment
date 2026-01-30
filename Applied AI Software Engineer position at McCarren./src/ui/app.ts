export type Status = "ready" | "working" | "done" | "error";

export interface AppState {
  status: Status;
  message: string;
  details: string[];
}

export function renderApp(state: AppState, onRun: () => void) {
  const root = document.getElementById("app");
  if (!root) return;

  root.innerHTML = `
  <div class="pane">
    <div class="header">
      <div class="icon">R</div>
      <div>
        <div class="title">Document Redaction</div>
        <div class="subtitle">
          Emails · Phones · SSNs · Credit Cards · IDs
        </div>
      </div>
    </div>

    <div class="status-row">
      <span class="badge ${state.status}">
        ${state.status.toUpperCase()}
      </span>
      <span class="message">${state.message}</span>
    </div>

    <button class="primary" id="runBtn"
      ${state.status === "working" ? "disabled" : ""}>
      Redact & Mark Confidential
    </button>

    <div class="details-panel">
      <div class="details-title">Run details</div>
      ${renderDetails(state.details)}
    </div>
  </div>
`;

  document.getElementById("runBtn")?.addEventListener("click", onRun);
}

function renderDetails(details: string[]) {
  if (!details || details.length === 0) {
    return `<div class="details empty">No details available yet.</div>`;
  }

  return `
    <ul class="details">
      ${details.map((d) => `<li>${d}</li>`).join("")}
    </ul>
  `;
}
