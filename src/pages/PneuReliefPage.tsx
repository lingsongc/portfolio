import { projectById } from "../data/projects";
import { ProjectPageLayout } from "./ProjectPageLayout";

const pneuRelief = projectById("pneurelief");

// Supplies PneuRelief content.
export function PneuReliefPage() {
    return <ProjectPageLayout project={pneuRelief} />;
}
