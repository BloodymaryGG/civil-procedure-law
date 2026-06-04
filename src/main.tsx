import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Workbench } from "./routes/index";
import { LawIndex } from "./routes/law.index";
import { ArticleDetail } from "./routes/law.$articleNumber";
import { InterpretationsIndex } from "./routes/interpretations.index";
import { InterpretationDetail } from "./routes/interpretations.$id";
import { SearchPage } from "./routes/search";
import "./styles.css";

type Route =
  | { view: "workbench" }
  | { view: "law-index" }
  | { view: "law-detail"; articleNumber: string }
  | { view: "interp-index" }
  | { view: "interp-detail"; id: string }
  | { view: "search" };

function parseHash(): Route {
  const hash = window.location.hash.replace("#", "") || "/";
  const parts = hash.split("/").filter(Boolean);

  if (parts.length === 0 || hash === "/") return { view: "workbench" };
  if (parts[0] === "law") return parts.length >= 2 ? { view: "law-detail", articleNumber: parts[1] } : { view: "law-index" };
  if (parts[0] === "interpretations") return parts.length >= 2 ? { view: "interp-detail", id: parts[1] } : { view: "interp-index" };
  if (parts[0] === "search") return { view: "search" };
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
    case "workbench": return <Workbench />;
    case "law-index": return <LawIndex />;
    case "law-detail": return <ArticleDetail articleNumber={route.articleNumber} />;
    case "interp-index": return <InterpretationsIndex />;
    case "interp-detail": return <InterpretationDetail id={route.id} />;
    case "search": return <SearchPage />;
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
