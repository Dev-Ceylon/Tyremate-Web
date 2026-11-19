/**
 * Capabilities only the UI thread has (DOM, popups, file pickers). The backend
 * worker asks for them through the platform host (requestMain).
 */

export function printHtml(html: string, title = "TyreMate"): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe")
    iframe.setAttribute("aria-hidden", "true")
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    const win = iframe.contentWindow
    if (!doc || !win) {
      iframe.remove()
      reject(new Error("Unable to prepare the print preview"))
      return
    }
    doc.open()
    doc.write(html)
    doc.close()
    try {
      doc.title = title
    } catch {
      // ignore
    }
    const cleanup = () => setTimeout(() => iframe.remove(), 1000)
    const doPrint = () => {
      try {
        win.focus()
        win.addEventListener("afterprint", cleanup, { once: true })
        win.print()
        resolve()
      } catch (error) {
        cleanup()
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }
    // Wait for images/fonts inside the document.
    if (doc.readyState === "complete") setTimeout(doPrint, 50)
    else iframe.addEventListener("load", () => setTimeout(doPrint, 50), { once: true })
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function openBlob(bytes: Uint8Array, mime: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }))
  const win = window.open(url, "_blank", "noopener")
  if (!win) {
    // Popup blocked: fall back to a download.
    downloadBlob(new Blob([bytes as BlobPart], { type: mime }), "receipt")
  }
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000)
}

export function openExternal(url: string) {
  if (!/^https?:\/\//i.test(url)) throw new Error("Only http(s) links can be opened")
  window.open(url, "_blank", "noopener,noreferrer")
}

/** Opens the browser file picker; resolves [] when the user cancels. */
export function pickFiles(options: { multiple?: boolean; accept?: string }): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = Boolean(options.multiple)
    if (options.accept) input.accept = options.accept
    input.style.display = "none"
    let settled = false
    const finish = (files: File[]) => {
      if (settled) return
      settled = true
      input.remove()
      resolve(files)
    }
    input.addEventListener("change", () => finish(Array.from(input.files ?? [])), { once: true })
    input.addEventListener("cancel", () => finish([]), { once: true })
    document.body.appendChild(input)
    input.click()
  })
}
