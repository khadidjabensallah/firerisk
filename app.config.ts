import { defineConfig } from "@tanstack/react-start/config";

export default defineConfig({
    server: {
        preset: "node-server",
    },
    routers: {
        ssr: {
            entry: "./src/start.ts",
        },
        client: {
            entry: "./src/start.ts",
        },
    },
});
