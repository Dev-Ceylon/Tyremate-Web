import { spawn, type ChildProcess } from "node:child_process"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

export interface RunningHrana {
  url: string
  dbFile: string
  token?: string
  stop: () => void
  stats: () => Promise<{ pipelines: number }>
}

export async function startHranaServer(token?: string): Promise<RunningHrana> {
  const dir = mkdtempSync(path.join(tmpdir(), "tm-hrana-"))
  const dbFile = path.join(dir, "remote.db")
  const args = [path.resolve(__dirname, "hranaServer.mjs"), dbFile, "0"]
  if (token) args.push(token)
  const child: ChildProcess = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "inherit"] })
  const port = await new Promise<number>((resolve, reject) => {
    child.stdout!.on("data", (chunk: Buffer) => {
      const m = /LISTENING (\d+)/.exec(chunk.toString())
      if (m) resolve(Number(m[1]))
    })
    child.on("exit", (code) => reject(new Error(`hrana server exited ${code}`)))
  })
  const url = `http://127.0.0.1:${port}`
  return {
    url,
    dbFile,
    token,
    stop: () => child.kill(),
    stats: async () => (await fetch(`${url}/__stats`)).json(),
  }
}
