import { defineNitroConfig } from "nitropack/config";
import { join } from "node:path";

export default defineNitroConfig({
    publicAssets: [
        {
            dir: join(process.cwd(), "dist/client"),
            baseURL: "/",
        },
    ],
    serverAssets: [
        {
            baseName: "server",
            dir: join(process.cwd(), "dist/server"),
        },
    ],
});
