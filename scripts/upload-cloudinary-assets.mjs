#!/usr/bin/env node
/**
 * Uploads the static assets (brand images, user-manual screenshots) to
 * Cloudinary. Runs in CI before the static build; idempotent (existing assets
 * are skipped unless --force).
 *
 * Requires CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
 * (a GitHub Actions secret). The API secret is only used here, server side -
 * it is never part of the published site.
 *
 * usage: node scripts/upload-cloudinary-assets.mjs [--force] [--dry-run]
 */
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { basename, dirname, extname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_STATIC_FOLDER || "tyremate/static"

export function parseCloudinaryUrl(url) {
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)/.exec(url || "")
  if (!match) throw new Error("CLOUDINARY_URL must look like cloudinary://<api_key>:<api_secret>@<cloud_name>")
  return { apiKey: decodeURIComponent(match[1]), apiSecret: decodeURIComponent(match[2]), cloudName: match[3] }
}

/** Cloudinary request signature: sha1("k1=v1&k2=v2" sorted by key + api_secret). */
export function signParams(params, apiSecret) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${Array.isArray(params[k]) ? params[k].join(",") : params[k]}`)
    .join("&")
  return createHash("sha1").update(toSign + apiSecret).digest("hex")
}

/** Files to publish: [{ path, publicId }] (public ids match src/shell/web/assets.ts). */
export function listAssets() {
  const assets = [
    { path: join(root, "public/logo.svg"), publicId: `${FOLDER}/logo` },
    { path: join(root, "public/favicon.svg"), publicId: `${FOLDER}/favicon` },
  ]
  const manualDir = join(root, "docs/images")
  for (const file of readdirSync(manualDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()) {
    assets.push({ path: join(manualDir, file), publicId: `${FOLDER}/manual/${basename(file, extname(file))}` })
  }
  return assets
}

async function exists(creds, publicId) {
  const auth = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${creds.cloudName}/resources/image/upload/${publicId.split("/").map(encodeURIComponent).join("/")}`,
    { headers: { Authorization: `Basic ${auth}` } },
  )
  if (res.status === 404) return false
  if (!res.ok) throw new Error(`Admin API HTTP ${res.status} for ${publicId}`)
  return true
}

async function upload(creds, asset) {
  const params = {
    public_id: asset.publicId,
    asset_folder: dirname(asset.publicId),
    overwrite: "true",
    invalidate: "true",
    tags: "tyremate,static",
    timestamp: Math.floor(Date.now() / 1000),
  }
  const form = new FormData()
  const bytes = readFileSync(asset.path)
  const mime = asset.path.endsWith(".svg") ? "image/svg+xml" : "image/png"
  form.append("file", new Blob([bytes], { type: mime }), basename(asset.path))
  for (const [k, v] of Object.entries(params)) form.append(k, String(v))
  form.append("api_key", creds.apiKey)
  form.append("signature", signParams(params, creds.apiSecret))
  const res = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`, { method: "POST", body: form })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Upload failed for ${asset.publicId}: ${body?.error?.message ?? res.status}`)
  return body.secure_url
}

async function main() {
  const force = process.argv.includes("--force")
  const dryRun = process.argv.includes("--dry-run")
  const assets = listAssets()
  if (dryRun) {
    for (const a of assets) console.log(`${a.publicId}  <-  ${a.path.replace(root + "/", "")}`)
    return
  }
  if (!process.env.CLOUDINARY_URL) {
    const message = "CLOUDINARY_URL not set - skipping asset upload (the site falls back to bundled copies)."
    // Surface it in the GitHub Actions run summary, not just the log.
    console.log(process.env.GITHUB_ACTIONS ? `::notice title=Cloudinary assets not uploaded::${message}` : message)
    return
  }
  const creds = parseCloudinaryUrl(process.env.CLOUDINARY_URL)
  let uploaded = 0
  for (const asset of assets) {
    if (!force && (await exists(creds, asset.publicId))) continue
    const url = await upload(creds, asset)
    uploaded++
    console.log(`uploaded ${url}`)
  }
  console.log(`Cloudinary assets: ${uploaded} uploaded, ${assets.length - uploaded} already present (cloud ${creds.cloudName}).`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
