// Starts the standalone GitHub Pages error page, including when served from a missing nested URL.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NotFound } from "./pages/not-found/NotFound";
import "./styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Error page could not be initialized.");

createRoot(rootElement).render(<StrictMode><NotFound /></StrictMode>);
