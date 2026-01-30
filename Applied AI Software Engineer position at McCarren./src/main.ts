import "./styles/app.css";
import { redactAndMarkConfidential } from "./core/redaction";
import { renderApp, AppState } from "./ui/app";

Office.onReady(() => {
  if (!Office.context?.document) {
    document.body.innerHTML =
      "<p>This add-in must be run inside Microsoft Word.</p>";
    return;
  }

  let state: AppState = {
    status: "ready",
    message: "Ready to redact sensitive data and mark the document confidential.",
    details: [],
  };

  const setState = (next: Partial<AppState>) => {
    state = { ...state, ...next };
    renderApp(state, onRun);
  };

  const onRun = async () => {
    try {
      setState({
        status: "working",
        message: "Running redaction…",
        details: [],
      });

      const result = await redactAndMarkConfidential((msg) => {
        setState({ message: msg });
      });

      setState({
        status: "done",
        message: result.summary,
        details: result.details,
      });
    } catch (e) {
      setState({
        status: "error",
        message: "An unexpected error occurred.",
        details: [String(e)],
      });
    }
  };

  renderApp(state, onRun);
});
