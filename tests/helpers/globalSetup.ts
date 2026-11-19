import { execFileSync } from "node:child_process"
import path from "node:path"

export default function setup() {
  execFileSync(process.execPath, [path.resolve(__dirname, "../../scripts/prepare.mjs")], { stdio: "inherit" })
}
