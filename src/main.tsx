import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Workbench } from "./routes/index";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <Workbench />
  </StrictMode>,
);
