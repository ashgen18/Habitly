import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const encoded = JSON.parse(readFileSync(join(root, "scripts/encoded-assets.json"), "utf8"))
const outDir = join(root, "assets/images")
mkdirSync(outDir, { recursive: true })
for (const [name, b64] of Object.entries(encoded)) {
  writeFileSync(join(outDir, name), Buffer.from(b64, "base64"))
}
