import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const BUILD_ID = new Date().toISOString();

// Publishes version.json so open copies of the app can notice a newer deploy.
function versionFile(): Plugin {
  return {
    name: "version-file",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ build: BUILD_ID }) });
    },
  };
}

// On GitHub Pages the site lives at /<repo-name>/. BASE_PATH is set by the deploy workflow.
export default defineConfig({
  plugins: [react(), versionFile()],
  base: process.env.BASE_PATH ?? "/",
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
});
