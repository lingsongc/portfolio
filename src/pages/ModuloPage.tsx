import { projectById } from "../data/projects";
import { ProjectPageLayout } from "./ProjectPageLayout";

const modulo = projectById("modulo");

// Supplies Modulo content.
export function ModuloPage() {
    return <ProjectPageLayout project={modulo} />;
}
