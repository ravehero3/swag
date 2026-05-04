import { build } from "esbuild";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
];

await build({
  entryPoints: ["server/src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/index.cjs",
  format: "cjs",
  external,
  logLevel: "info",
  // In CJS bundles, import.meta.url is unavailable. The server uses it only to
  // derive __filename/__dirname (which are already native CJS globals). Inject a
  // shim so fileURLToPath(import.meta.url) resolves to the real file path.
  banner: {
    js: "const __importMetaUrl = require('url').pathToFileURL(__filename).href;",
  },
  define: {
    "import.meta.url": "__importMetaUrl",
  },
});

console.log("Server bundle written to dist/index.cjs");
