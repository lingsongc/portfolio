import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Change this one width to move every homepage narrow-layout breakpoint together.
const narrowLayoutWidth = "56rem";

// Configures the homepage, project pages, and GitHub Pages fallback as separate build entries.
export default defineConfig({
    plugins: [react()],
    css: {
        postcss: {
            plugins: [{
                postcssPlugin: "portfolio-narrow-media",
                AtRule: {
                    media(rule) {
                        rule.params = rule.params.replaceAll("(--narrow-layout)", `(max-width: ${narrowLayoutWidth})`);
                    },
                },
            }],
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: "index.html",
                notFound: "404.html",
                modulo: "projects/modulo/index.html",
                pneurelief: "projects/pneurelief/index.html",
            },
        },
    },
});
