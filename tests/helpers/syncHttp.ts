/**
 * Blocking HTTP POST for Node tests - the Node counterpart of the synchronous
 * XMLHttpRequest the browser worker uses. A helper thread performs fetch()
 * while the caller blocks on Atomics.wait.
 */
import { MessageChannel, Worker, receiveMessageOnPort } from "node:worker_threads"
import type { SyncHttpTransport } from "../../web/db/libsqlDriver"

const workerSource = `
const { parentPort, workerData } = require("node:worker_threads")
const { port, signal } = workerData
const flag = new Int32Array(signal)
port.on("message", async ({ url, headers, body }) => {
  let reply
  try {
    const res = await fetch(url, { method: "POST", headers, body })
    reply = { status: res.status, body: await res.text() }
  } catch (error) {
    reply = { error: String(error && error.message || error) }
  }
  port.postMessage(reply)
  Atomics.store(flag, 0, 1)
  Atomics.notify(flag, 0)
})
`

export function createSyncHttpTransport(): { transport: SyncHttpTransport; close: () => Promise<number> } {
  const { port1, port2 } = new MessageChannel()
  const signal = new SharedArrayBuffer(4)
  const flag = new Int32Array(signal)
  const worker = new Worker(workerSource, { eval: true, workerData: { port: port2, signal }, transferList: [port2] })
  worker.unref()

  const transport: SyncHttpTransport = (url, headers, body) => {
    Atomics.store(flag, 0, 0)
    port1.postMessage({ url, headers, body })
    const result = Atomics.wait(flag, 0, 0, 30_000)
    if (result === "timed-out") throw new Error("HTTP request timed out")
    const msg = receiveMessageOnPort(port1)
    if (!msg) throw new Error("No HTTP response received")
    const reply = msg.message as { status: number; body: string; error?: string }
    if (reply.error) throw new Error(reply.error)
    return { status: reply.status, body: reply.body }
  }
  return { transport, close: () => worker.terminate() }
}
