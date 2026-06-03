import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
    serverDir: "src",
    entry: "src/server.ts",
    preset: "vercel"
});
