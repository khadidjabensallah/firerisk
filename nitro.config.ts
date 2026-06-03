import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
    srcDir: "src",
    entry: "server.ts",
    preset: "vercel"
});
