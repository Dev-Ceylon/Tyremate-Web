#!/usr/bin/env node
/**
 * Minimal Hrana-over-HTTP v2 server (the protocol spoken by Turso / sqld),
 * backed by better-sqlite3. Used to integration-test the remote driver.
 * Implements: POST /v2/pipeline with execute / sequence / close requests,
 * batons for stream affinity, bearer-token auth, CORS. GET /v2 health check.
 *
 * usage: node hranaServer.mjs <dbFile> <port> [token]
 */
import http from "node:http"
import { randomUUID } from "node:crypto"
import Database from "better-sqlite3"

const [, , dbFile, portArg, token] = process.argv
const port = Number(portArg || 0)
const streams = new Map()

function openConnection() {
  const conn = new Database(dbFile, { timeout: 5000 })
  conn.pragma("journal_mode = WAL")
  conn.defaultSafeIntegers(true)
  return conn
}

function encode(value) {
  if (value === null || value === undefined) return { type: "null" }
  if (typeof value === "bigint") return { type: "integer", value: value.toString() }
  if (typeof value === "number") return Number.isInteger(value) ? { type: "integer", value: String(value) } : { type: "float", value }
  if (typeof value === "string") return { type: "text", value }
  if (Buffer.isBuffer(value)) return { type: "blob", base64: value.toString("base64") }
  return { type: "text", value: String(value) }
}

function decode(v) {
  switch (v.type) {
    case "null": return null
    case "integer": return BigInt(v.value)
    case "float": return Number(v.value)
    case "text": return v.value
    case "blob": return Buffer.from(v.base64, "base64")
    default: throw new Error(`bad value type ${v.type}`)
  }
}

function executeStmt(conn, stmt) {
  const prepared = conn.prepare(stmt.sql)
  const args = (stmt.args || []).map(decode)
  let cols = []
  let rows = []
  let affected = 0
  if (prepared.reader) {
    cols = prepared.columns().map((c) => ({ name: c.name, decltype: c.type }))
    rows = prepared.raw(true).all(...args).map((r) => r.map(encode))
  } else {
    const info = prepared.run(...args)
    affected = Number(info.changes)
  }
  const last = conn.prepare("SELECT last_insert_rowid() AS id").get().id
  return { cols, rows, affected_row_count: affected, last_insert_rowid: last.toString() }
}

function errorResult(error) {
  return { type: "error", error: { message: error.message, code: error.code || "SQLITE_ERROR" } }
}

function handlePipeline(body) {
  let stream
  if (body.baton) {
    stream = streams.get(body.baton)
    if (!stream) return { status: 400, json: { message: "Stream handle not found (baton)" } }
    streams.delete(body.baton)
  } else {
    stream = { conn: openConnection() }
  }
  const results = []
  let closed = false
  for (const req of body.requests || []) {
    if (closed) {
      results.push({ type: "error", error: { message: "Stream closed", code: "STREAM_CLOSED" } })
      continue
    }
    try {
      if (req.type === "execute") {
        results.push({ type: "ok", response: { type: "execute", result: executeStmt(stream.conn, req.stmt) } })
      } else if (req.type === "sequence") {
        stream.conn.exec(req.sql)
        results.push({ type: "ok", response: { type: "sequence" } })
      } else if (req.type === "close") {
        stream.conn.close()
        closed = true
        results.push({ type: "ok", response: { type: "close" } })
      } else {
        results.push({ type: "error", error: { message: `Unsupported request ${req.type}` } })
      }
    } catch (error) {
      results.push(errorResult(error))
    }
  }
  let baton = null
  if (!closed) {
    baton = randomUUID()
    streams.set(baton, stream)
  }
  return { status: 200, json: { baton, base_url: null, results } }
}

const stats = { pipelines: 0 }

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  if (req.method === "OPTIONS") return res.writeHead(204).end()
  if (req.method === "GET" && req.url === "/__stats") {
    return res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(stats))
  }
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    return res.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ message: "Unauthorized" }))
  }
  if (req.method === "GET" && req.url === "/v2") return res.writeHead(200).end()
  if (req.method === "POST" && req.url === "/v2/pipeline") {
    let data = ""
    req.on("data", (chunk) => (data += chunk))
    req.on("end", () => {
      stats.pipelines += 1
      let out
      try {
        out = handlePipeline(JSON.parse(data))
      } catch (error) {
        out = { status: 400, json: { message: error.message } }
      }
      res.writeHead(out.status, { "Content-Type": "application/json" }).end(JSON.stringify(out.json))
    })
    return
  }
  res.writeHead(404).end()
})

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`LISTENING ${server.address().port}\n`)
})
