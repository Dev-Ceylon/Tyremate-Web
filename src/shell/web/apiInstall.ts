// Installs window.api (the Electron preload surface) once, on the client.
import { installApi } from "../../../web/bridge/preload"

if (typeof window !== "undefined" && !(window as unknown as { api?: unknown }).api) {
  installApi()
}

export {}
