import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./modern-reset.scss";

// Note: <StrictMode> is intentionally omitted. Its double-invocation of
// effects in dev conflicts with p5's imperative instance lifecycle and
// triggers a p5.brush crash in `brush.load()` on the remount.
createRoot(document.getElementById("root")).render(<App />);
