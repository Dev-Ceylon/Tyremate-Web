"use client"
import { marked } from "marked"
import { useEffect, useMemo, useRef } from "react"
import { manualImage } from "../../../shell/web/assets"
import { USER_MANUAL_MARKDOWN } from "../manual.generated"

/**
 * The TyreMate user manual (docs/USER_MANUAL.md). Screenshots are delivered
 * from Cloudinary (optimised, resized) with the bundled copies as fallback.
 */
function renderManual(): string {
  const renderer = new marked.Renderer()
  renderer.image = ({ href, title, text }) => {
    const file = String(href).split("/").pop() ?? ""
    const { src, fallback } = manualImage(file)
    const caption = text || title || ""
    const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
    return `<figure><img src="${esc(src)}" data-fallback="${esc(fallback)}" alt="${esc(caption)}" loading="lazy" /><figcaption>${esc(caption)}</figcaption></figure>`
  }
  renderer.code = ({ text, lang }) => {
    if (lang === "mermaid") return "" // architecture diagram source; not rendered in-app
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    return `<pre class="tm-code"><code>${esc}</code></pre>`
  }
  return marked.parse(USER_MANUAL_MARKDOWN, { renderer, async: false }) as string
}

export default function HelpPage() {
  const html = useMemo(renderManual, [])
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const images = Array.from(ref.current?.querySelectorAll<HTMLImageElement>("img[data-fallback]") ?? [])
    const handlers = images.map((img) => {
      const onError = () => {
        const fallback = img.dataset.fallback
        if (fallback && img.src !== new URL(fallback, window.location.href).href) img.src = fallback
      }
      img.addEventListener("error", onError)
      return () => img.removeEventListener("error", onError)
    })
    return () => handlers.forEach((off) => off())
  }, [html])

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Help</p>
          <h1>User manual</h1>
          <p className="hero-text">
            Screens in the web edition match the desktop application. Printing opens the browser print dialog (choose a
            printer or &ldquo;Save as PDF&rdquo;); CSV exports download through the browser.
          </p>
        </div>
      </section>
      {/* Content is the repository's own manual, bundled at build time. */}
      <article ref={ref} className="panel tm-manual" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  )
}
