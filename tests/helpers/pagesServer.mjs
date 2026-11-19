#!/usr/bin/env node
/**
 * Serves the static export the way GitHub Pages does: under a base path,
 * "dir/" -> "dir/index.html", unknown paths -> 404.html with status 404.
 * usage: node pagesServer.mjs <outDir> <port> [basePath]
 */
import http from "node:http"
import { existsSync, readFileSync, statSync } from "node:fs"
import { extname, join, normalize } from "node:path"

const [, , outDir = "out", portArg = "4321", basePath = ""] = process.argv
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
}

function send(res, status, file) {
  res.writeHead(status, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" })
  res.end(readFileSync(file))
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    let path = decodeURIComponent(url.pathname)
    if (basePath) {
      if (path === basePath) {
        res.writeHead(301, { Location: `${basePath}/` }).end()
        return
      }
      if (!path.startsWith(`${basePath}/`)) return send(res, 404, join(outDir, "404.html"))
      path = path.slice(basePath.length)
    }
    const target = normalize(join(outDir, path))
    if (!target.startsWith(normalize(outDir))) return send(res, 404, join(outDir, "404.html"))
    if (existsSync(target) && statSync(target).isFile()) return send(res, 200, target)
    if (existsSync(join(target, "index.html"))) {
      if (!path.endsWith("/")) {
        res.writeHead(301, { Location: `${basePath}${path}/${url.search}` }).end()
        return
      }
      return send(res, 200, join(target, "index.html"))
    }
    if (existsSync(`${target}.html`)) return send(res, 200, `${target}.html`)
    send(res, 404, join(outDir, "404.html"))
  })
  .listen(Number(portArg), "127.0.0.1", () => console.log(`pages server on http://127.0.0.1:${portArg}${basePath}/`))
