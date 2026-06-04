import { useState, useEffect } from "react";
import { Workbench } from "./routes/index";
import { LawIndex } from "./routes/law.index";
import { ArticleDetail } from "./routes/law.$articleNumber";
import { InterpretationsIndex } from "./routes/interpretations.index";
import { InterpretationDetail } from "./routes/interpretations.$id";
import { SearchPage } from "./routes/search";

type Route =
  | { view: "workbench" }
  | { view: "law-index" }
  | { view: "law-detail"; articleNumber: string }
  | { view: "interp-index" }
  | { view: "interp-detail"; id: string }
  | { view: "search" };

function parseHash(): Route {
  const hash = window.location.hash.replace("#", "") || "/";
  // Split into segments: "/law/123" → ["law", "123"]
  const parts = hash.split("/").filter(Boolean);

  if (parts.length === 0 || hash === "/") {
    return { view: "workbench" };
  }

  if (parts[0] === "law") {
    if (parts.length >= 2) {
      return { view: "law-detail", articleNumber: parts[1] };
    }
    return { view: "law-index" };
  }

  if (parts[0] === "interpretations") {
    if (parts.length >= 2) {
      return { view: "interp-detail", id: parts[1] };
    }
    return { view: "interp-index" };
  }

  if (parts[0] === "search") {
    return { view: "search" };
  }

  // Default to workbench for unrecognized hashes (like "第N条")
  return { view: "workbench" };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Render based on parsed route
  switch (route.view) {
    case "workbench":
      return <Workbench />;
    case "law-index":
      return <LawIndex />;
    case "law-detail":
      return <ArticleDetail articleNumber={route.articleNumber} />;
    case "interp-index":
      return <InterpretationsIndex />;
    case "interp-detail":
      return <InterpretationDetail id={route.id} />;
    case "search":
      return <SearchPage />;
    default:
      return <Workbench />;
  }
}
