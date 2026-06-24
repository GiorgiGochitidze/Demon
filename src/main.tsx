import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ScreenView } from "./screen/ScreenView.tsx";
import { PhoneView } from "./phone/PhoneView.tsx";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ScreenView />} />
        <Route path="/props" element={<PhoneView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
