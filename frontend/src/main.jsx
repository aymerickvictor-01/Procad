import "@fontsource-variable/inter";
import "@fontsource-variable/inter-tight";
import "./styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App";
import { CompanyProvider } from "./context/CompanyContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <CompanyProvider>
        <App />
      </CompanyProvider>
    </BrowserRouter>
  </StrictMode>,
);
