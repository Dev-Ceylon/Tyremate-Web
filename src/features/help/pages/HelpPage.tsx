"use client"
import { ArrowUp, BookOpen, ChevronLeft, ChevronRight, Link2, Printer, Search, X } from "lucide-react"
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { USER_MANUAL_MARKDOWN } from "../manual.generated"
import { parseManual, type ManualChapter } from "../manualContent"

/**
 * The TyreMate user manual (docs/USER_MANUAL.md) as an in-app reader:
 * chapter navigation with scroll tracking, search with highlighted matches,
 * rendered diagrams, zoomable screenshots and a print layout.
 */

function scrollToId(id: string, smooth = true) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  el.scrollIntoView({ behavior: smooth && !reduce ? "smooth" : "auto", block: "start" })
  window.history.replaceState(window.history.state, "", `#${id}`)
}

/** Wraps case-insensitive matches of `query` in <mark> inside `root` (and removes old ones). */
function highlight(root: HTMLElement, query: string): number {
  root.querySelectorAll("mark.tm-manual-hit").forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark)
    parent.normalize()
  })
  if (!query) return 0
  const needle = query.toLowerCase()
  const nodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest("svg, .tm-manual-diagram, [hidden], .tm-heading-anchor")
        ? NodeFilter.FILTER_REJECT
        : node.nodeValue?.toLowerCase().includes(needle)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
  })
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text)
  let count = 0
  for (const node of nodes) {
    let rest: Text = node
    let index = rest.nodeValue!.toLowerCase().indexOf(needle)
    while (index !== -1) {
      const match = rest.splitText(index)
      rest = match.splitText(needle.length)
      const mark = document.createElement("mark")
      mark.className = "tm-manual-hit"
      match.parentNode!.replaceChild(mark, match)
      mark.appendChild(match)
      count++
      index = rest.nodeValue!.toLowerCase().indexOf(needle)
    }
  }
  return count
}

async function renderDiagrams(root: HTMLElement) {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>(".tm-manual-diagram[data-mermaid]:not([data-rendered])"))
  if (!blocks.length) return
  try {
    const { default: mermaid } = await import("mermaid")
    const font = getComputedStyle(document.body).fontFamily
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      fontFamily: font,
      themeVariables: {
        fontFamily: font,
        fontSize: "14px",
        primaryColor: "#eff6ff",
        primaryBorderColor: "#93c5fd",
        primaryTextColor: "#0f172a",
        secondaryColor: "#f8fafc",
        tertiaryColor: "#f8fafc",
        clusterBkg: "#f8fafc",
        clusterBorder: "#cbd5e1",
        lineColor: "#64748b",
        actorBkg: "#eff6ff",
        actorBorder: "#93c5fd",
        noteBkgColor: "#fef9c3",
      },
      flowchart: { htmlLabels: true, curve: "basis", padding: 12, nodeSpacing: 40, rankSpacing: 48 },
      sequence: { useMaxWidth: true },
    })
    for (const [i, block] of blocks.entries()) {
      const source = block.dataset.mermaid ?? ""
      try {
        const { svg } = await mermaid.render(`tm-manual-diagram-${Date.now()}-${i}`, source)
        block.innerHTML = svg
        block.dataset.rendered = "true"
        const title = block.closest("section")?.querySelector("h2, h3")?.textContent?.trim()
        block.setAttribute("aria-label", title ? `Diagram: ${title}` : "Diagram")
      } catch {
        block.innerHTML = `<pre class="tm-code"></pre>`
        block.querySelector("pre")!.textContent = source
        block.dataset.rendered = "failed"
      }
    }
  } catch {
    // Diagram library unavailable (offline): show the diagram source instead.
    for (const block of blocks) {
      block.innerHTML = `<pre class="tm-code"></pre>`
      block.querySelector("pre")!.textContent = block.dataset.mermaid ?? ""
      block.dataset.rendered = "failed"
    }
  }
}

function chapterMatches(chapter: ManualChapter, q: string) {
  return {
    intro: !q || chapter.introText.includes(q),
    sections: chapter.sections.filter((s) => !q || s.text.includes(q)).map((s) => s.id),
  }
}

export default function HelpPage() {
  const manual = useMemo(() => parseManual(USER_MANUAL_MARKDOWN), [])
  const contentRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState(manual.chapters[0]?.id ?? "")
  const [hits, setHits] = useState(0)
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null)
  const [showTop, setShowTop] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const q = query.trim().toLowerCase()

  const visible = useMemo(() => {
    const map = new Map<string, { intro: boolean; sections: Set<string> }>()
    for (const c of manual.chapters) {
      const m = chapterMatches(c, q)
      if (m.intro || m.sections.length) map.set(c.id, { intro: m.intro, sections: new Set(m.sections) })
    }
    return map
  }, [manual, q])

  // Screenshots fall back to the bundled copy when the CDN copy is missing.
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const onError = (event: Event) => {
      const img = event.target as HTMLImageElement
      if (img.tagName !== "IMG" || !img.dataset.fallback) return
      if (img.src !== new URL(img.dataset.fallback, window.location.href).href) img.src = img.dataset.fallback
    }
    root.addEventListener("error", onError, true)
    return () => root.removeEventListener("error", onError, true)
  }, [])

  // Diagrams render once the reader scrolls near them.
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect()
          void renderDiagrams(root)
        }
      },
      { rootMargin: "600px 0px" },
    )
    root.querySelectorAll(".tm-manual-diagram").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Search highlighting.
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    setHits(highlight(root, q))
  }, [q, visible])

  // Scroll tracking for the contents panel.
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const headings = Array.from(root.querySelectorAll<HTMLElement>("[data-toc-id]"))
    const onScroll = () => {
      const offset = 140
      let current = headings[0]?.dataset.tocId ?? ""
      for (const h of headings) {
        if (h.getBoundingClientRect().top - offset <= 0) current = h.dataset.tocId ?? current
        else break
      }
      setActiveId(current)
      setShowTop(window.scrollY > 700)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [visible])

  // Deep links (#chapter-4, #chapter-4-4-2-…) on first load.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) requestAnimationFrame(() => scrollToId(id, false))
  }, [])

  // Screenshot zoom dialog.
  useEffect(() => {
    const dialog = zoomRef.current
    if (!dialog) return
    if (zoom && !dialog.open) dialog.showModal()
    if (!zoom && dialog.open) dialog.close()
  }, [zoom])

  const onContentClick = useCallback((event: React.MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-zoom]")
    const img = button?.querySelector("img")
    if (img) setZoom({ src: img.currentSrc || img.src, alt: img.alt })
  }, [])

  const go = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault()
    setTocOpen(false)
    scrollToId(id)
  }

  const activeChapter = manual.chapters.find((c) => c.id === activeId || c.sections.some((s) => s.id === activeId))
  const shownChapters = manual.chapters.filter((c) => visible.has(c.id))
  const sectionCount = shownChapters.reduce((n, c) => n + visible.get(c.id)!.sections.size, 0)

  const toc = (
    <ol className="tm-help-toc-list">
      {manual.chapters.map((chapter) => {
        const shown = visible.get(chapter.id)
        const isActive = activeChapter?.id === chapter.id
        return (
          <li key={chapter.id} className={shown ? undefined : "is-filtered"}>
            <a
              href={`#${chapter.id}`}
              onClick={go(chapter.id)}
              className={`tm-help-toc-chapter${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "location" : undefined}
            >
              <span className="tm-help-toc-num">{chapter.label === "Overview" ? "i" : chapter.label.replace("Chapter ", "")}</span>
              <span>{chapter.title}</span>
            </a>
            {chapter.sections.length > 0 && (isActive || q) && shown ? (
              <ol>
                {chapter.sections
                  .filter((s) => shown.sections.has(s.id))
                  .map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        onClick={go(s.id)}
                        className={activeId === s.id ? "is-active" : undefined}
                        aria-current={activeId === s.id ? "location" : undefined}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
              </ol>
            ) : null}
          </li>
        )
      })}
    </ol>
  )

  return (
    <main className="app-shell tm-help">
      <section className="page-header panel tm-help-hero">
        <div>
          <p className="eyebrow">Help</p>
          <h1>User manual</h1>
          <p className="hero-text">
            {manual.title}
            {manual.subtitle ? <span className="tm-help-edition">{manual.subtitle}</span> : null}
          </p>
        </div>
        <div className="tm-help-tools">
          <label className="tm-help-search">
            <Search size={16} aria-hidden />
            <span className="visually-hidden">Search the manual</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("")
              }}
              placeholder="Search the manual…"
              aria-describedby="tm-help-search-status"
            />
            {query ? (
              <button type="button" className="tm-help-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={14} />
              </button>
            ) : null}
          </label>
          <button type="button" className="secondary-action" onClick={() => window.print()} aria-label="Print or save as PDF">
            <Printer size={15} aria-hidden />
            <span className="tm-help-print-label">Print / PDF</span>
          </button>
        </div>
        <p id="tm-help-search-status" className="tm-help-search-status" role="status">
          {q
            ? sectionCount || shownChapters.length
              ? `${hits} ${hits === 1 ? "match" : "matches"} in ${shownChapters.length} ${shownChapters.length === 1 ? "chapter" : "chapters"}`
              : ""
            : `${manual.chapters.filter((c) => c.label !== "Overview").length} chapters · Screens in the web edition match the desktop application. Printing opens the browser print dialog (choose a printer or “Save as PDF”).`}
        </p>
      </section>

      <div className="tm-help-layout">
        <nav className="tm-help-toc panel" aria-label="Manual contents">
          <button
            type="button"
            className="tm-help-toc-toggle"
            aria-expanded={tocOpen}
            onClick={() => setTocOpen((v) => !v)}
          >
            <BookOpen size={16} aria-hidden />
            <span>Contents</span>
            <span className="tm-help-toc-current">{activeChapter ? activeChapter.title : ""}</span>
            <ChevronRight size={16} className="tm-help-toc-chevron" aria-hidden />
          </button>
          <div className={`tm-help-toc-body${tocOpen ? " is-open" : ""}`}>
            <p className="section-label tm-help-toc-heading">Contents</p>
            {toc}
          </div>
        </nav>

        <div className="tm-help-content" ref={contentRef} onClick={onContentClick}>
          {shownChapters.length === 0 ? (
            <section className="panel tm-help-empty">
              <Search size={28} aria-hidden />
              <h2>No results for “{query.trim()}”</h2>
              <p>Try a shorter word, a screen name (for example “Gate Pass”), or a button label.</p>
              <button type="button" className="secondary-action" onClick={() => setQuery("")}>
                Clear search
              </button>
            </section>
          ) : null}
          {manual.chapters.map((chapter, index) => {
            const shown = visible.get(chapter.id)
            const prev = manual.chapters[index - 1]
            const next = manual.chapters[index + 1]
            return (
              <section
                key={chapter.id}
                id={chapter.id}
                data-toc-id={chapter.id}
                className="panel tm-help-chapter"
                hidden={!shown}
                aria-labelledby={`${chapter.id}-title`}
              >
                <header className="tm-help-chapter-header">
                  <p className="eyebrow">{chapter.label}</p>
                  <h2 id={`${chapter.id}-title`}>
                    {chapter.title}
                    <a className="tm-heading-anchor" href={`#${chapter.id}`} onClick={go(chapter.id)} aria-label={`Link to ${chapter.title}`}>
                      <Link2 size={16} aria-hidden />
                    </a>
                  </h2>
                  {chapter.sections.length > 0 ? (
                    <p className="tm-help-chapter-meta">
                      {chapter.sections.length} {chapter.sections.length === 1 ? "section" : "sections"}
                    </p>
                  ) : null}
                </header>
                {chapter.introHtml ? (
                  <div className="tm-manual tm-help-intro" hidden={!!q && !shown?.intro} dangerouslySetInnerHTML={{ __html: chapter.introHtml }} />
                ) : null}
                {chapter.sections.map((section) => (
                  <Fragment key={section.id}>
                    <article className="tm-help-section" hidden={!shown?.sections.has(section.id)}>
                      <h3 id={section.id} data-toc-id={section.id}>
                        {section.title}
                        <a className="tm-heading-anchor" href={`#${section.id}`} onClick={go(section.id)} aria-label={`Link to ${section.title}`}>
                          <Link2 size={14} aria-hidden />
                        </a>
                      </h3>
                      {/* Content is the repository's own manual, bundled at build time. */}
                      <div className="tm-manual" dangerouslySetInnerHTML={{ __html: section.html }} />
                    </article>
                  </Fragment>
                ))}
                {!q ? (
                  <nav className="tm-help-pager" aria-label="Chapter navigation">
                    {prev ? (
                      <a href={`#${prev.id}`} onClick={go(prev.id)} className="tm-help-pager-link">
                        <ChevronLeft size={16} aria-hidden />
                        <span>
                          <small>Previous</small>
                          {prev.title}
                        </span>
                      </a>
                    ) : (
                      <span />
                    )}
                    {next ? (
                      <a href={`#${next.id}`} onClick={go(next.id)} className="tm-help-pager-link is-next">
                        <span>
                          <small>Next</small>
                          {next.title}
                        </span>
                        <ChevronRight size={16} aria-hidden />
                      </a>
                    ) : null}
                  </nav>
                ) : null}
              </section>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        className={`tm-help-top${showTop ? " is-visible" : ""}`}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" })
          window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search)
        }}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        <ArrowUp size={18} aria-hidden />
      </button>

      <dialog
        ref={zoomRef}
        className="tm-help-zoom"
        onClose={() => setZoom(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setZoom(null)
        }}
        aria-label={zoom?.alt ?? "Screenshot"}
      >
        {zoom ? (
          <figure>
            <img src={zoom.src} alt={zoom.alt} />
            <figcaption>{zoom.alt}</figcaption>
          </figure>
        ) : null}
        <button type="button" className="tm-help-zoom-close" onClick={() => setZoom(null)} aria-label="Close screenshot">
          <X size={18} />
        </button>
      </dialog>
    </main>
  )
}
