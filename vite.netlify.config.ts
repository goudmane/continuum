import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import vinext from "vinext";
import { defineConfig } from "vite";

const cloudflareWorkspaceModule = fileURLToPath(
  new URL("./db/workspaces.ts", import.meta.url),
);
const netlifyWorkspaceModule = fileURLToPath(
  new URL("./db/workspaces.netlify.ts", import.meta.url),
);

export default defineConfig({
  plugins: [
    {
      name: "netlify-workspace-storage",
      enforce: "pre",
      resolveId(id) {
        if (id === "@/db/workspaces") {
          return netlifyWorkspaceModule;
        }
      },
      load(id) {
        if (id === cloudflareWorkspaceModule) {
          return `export { readWorkspace, saveWorkspace } from ${JSON.stringify(netlifyWorkspaceModule)};`;
        }
      },
    },
    tailwindcss(),
    vinext(),
    nitro(),
  ],
});
