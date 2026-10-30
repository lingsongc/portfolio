import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { projectById } from "./data/projects";
import { ProjectPageLayout } from "./pages/ProjectPageLayout";
import "./styles/index.css";

// Starts the project page selected by the current HTML entry.
const rootElement = document.getElementById("root");
const project = projectById(document.body.dataset.projectId ?? "");

if (!rootElement) {
    throw new Error("Project page could not be initialized.");
}

createRoot(rootElement).render(
    <StrictMode>
        <ProjectPageLayout project={project} />
    </StrictMode>,
);
