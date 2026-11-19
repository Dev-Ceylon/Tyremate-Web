import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const root = path.dirname(fileURLToPath(import.meta.url))

// GitHub Pages serves project sites from /<repo>/. The deploy workflow sets
// NEXT_PUBLIC_BASE_PATH (e.g. "/tyremate-web"); local builds use "".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // The desktop renderer never ran under StrictMode; double-invoked effects
  // would duplicate backend calls (e.g. notification polling).
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // The backend still does require("electron"); point it at the web shim.
      electron: path.join(root, "backend/platform/electron.js"),
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      crypto: false,
      path: require.resolve("path-browserify"),
      events: require.resolve("events/"),
    }
    return config
  },
}

export default nextConfig
