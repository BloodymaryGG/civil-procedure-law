import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Workbench } from "./routes/index";
import { InterpretationDetail } from "./routes/interpretations.$id";
import "./styles.css";

type Route =
  | { view: "workbench" }
  | { view: "interp-detail"; id: string };

function parseHash(): Route {
  const hash = window.location.hash.replace("#", "") || "/";
  const parts = hash.split("/").filter(Boolean);

  if (parts.length === 0 || hash === "/") return { view: "workbench" };
  if (parts[0] === "interpretations" && parts.length >= 2) return { view: "interp-detail", id: parts[1] };
  return { view: "workbench" };
}

function App() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  switch (route.view) {
    case "interp-detail": return <InterpretationDetail id={route.id} />;
    default: return <Workbench />;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
