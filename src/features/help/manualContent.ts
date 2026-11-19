import { marked, type Token, type Tokens } from "marked"
import { manualImage } from "../../shell/web/assets"

/**
 * Turns docs/USER_MANUAL.md into chapters and sections for the in-app reader:
 * headings become navigable anchors, screenshots come from Cloudinary (with
 * bundled fallbacks), GitHub-style alerts become callouts and Mermaid blocks
 * become diagram placeholders rendered on the client.
 */

export interface ManualSection {
  id: string
  title: string
  html: string
  /** Lower-case plain text (title + body) used by search. */
  text: string
}

export interface ManualChapter {
  id: string
  /** "Chapter 3" for numbered chapters, "Overview" for the introduction. */
  label: string
  title: string
  introHtml: string
  introText: string
  sections: ManualSection[]
}

export interface Manual {
  title: string
  subtitle: string
  chapters: ManualChapter[]
}

const ALERTS: Record<string, string> = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
}

/** Screenshots are captured at this size (scripts/capture-manual-screenshots.mjs);
 * declaring it reserves their space so deep links land in the right place. */
const SHOT_WIDTH = 1440
const SHOT_HEIGHT = 900

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function plainText(html: string): string {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function createRenderer() {
  const renderer = new marked.Renderer()
  let figure = 0

  renderer.image = ({ href, title, text }) => {
    const file = String(href).split("/").pop() ?? ""
    const { src, fallback } = manualImage(file)
    const caption = text || title || ""
    figure += 1
    return (
      `<figure class="tm-manual-figure">` +
      `<button type="button" class="tm-manual-zoom" data-zoom aria-label="Enlarge screenshot: ${escapeHtml(caption)}">` +
      `<img src="${escapeHtml(src)}" data-fallback="${escapeHtml(fallback)}" alt="${escapeHtml(caption)}" width="${SHOT_WIDTH}" height="${SHOT_HEIGHT}" loading="lazy" decoding="async" />` +
      `</button>` +
      `<figcaption><span class="tm-manual-figure-num">Figure ${figure}</span>${escapeHtml(caption)}</figcaption>` +
      `</figure>`
    )
  }

  renderer.code = ({ text, lang }) => {
    if (lang === "mermaid") {
      return (
        `<div class="tm-manual-diagram" data-mermaid="${escapeHtml(text)}" role="img" aria-label="Diagram">` +
        `<p class="tm-manual-diagram-loading">Loading diagram…</p></div>`
      )
    }
    return `<pre class="tm-code"><code>${escapeHtml(text)}</code></pre>`
  }

  renderer.blockquote = function ({ tokens }: Tokens.Blockquote) {
    const body = this.parser.parse(tokens)
    const match = /^<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/.exec(body)
    if (!match) return `<blockquote>${body}</blockquote>`
    const kind = match[1]
    return (
      `<aside class="tm-callout tm-callout-${kind.toLowerCase()}">` +
      `<p class="tm-callout-title">${ALERTS[kind]}</p>` +
      `<p>${body.slice(match[0].length)}` +
      `</aside>`
    )
  }

  renderer.table = function (token: Tokens.Table) {
    const head = token.header.map((cell) => `<th${cell.align ? ` style="text-align:${cell.align}"` : ""}>${this.parser.parseInline(cell.tokens)}</th>`).join("")
    const rows = token.rows
      .map((row) => `<tr>${row.map((cell) => `<td${cell.align ? ` style="text-align:${cell.align}"` : ""}>${this.parser.parseInline(cell.tokens)}</td>`).join("")}</tr>`)
      .join("")
    return `<div class="tm-manual-table"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
  }

  // Headings are rendered by the page itself (with anchors); deeper ones stay inline.
  renderer.heading = function ({ tokens, depth }: Tokens.Heading) {
    return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>`
  }

  return renderer
}

export function parseManual(markdown: string): Manual {
  const renderer = createRenderer()
  const tokens = marked.lexer(markdown)
  const render = (list: Token[]) => marked.parser(list as never, { renderer, async: false }) as string
  const inline = (text: string) => plainText(marked.parseInline(text, { async: false }) as string)

  let title = "User manual"
  let subtitle = ""
  const chapters: ManualChapter[] = []
  interface RawChapter {
    id: string
    label: string
    title: string
    intro: Token[]
    sections: { id: string; title: string; tokens: Token[] }[]
  }
  let chapter: RawChapter | null = null
  const raw: RawChapter[] = []
  const used = new Set<string>()
  const uniqueId = (base: string) => {
    let id = base || "section"
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    used.add(id)
    return id
  }

  for (const token of tokens) {
    if (token.type === "heading" && token.depth === 1) {
      title = inline(token.text)
      continue
    }
    if (token.type === "hr" || token.type === "space") continue
    if (token.type === "heading" && token.depth === 2) {
      const text = inline(token.text)
      const numbered = /^Chapter\s+(\d+)\s*:\s*(.+)$/i.exec(text)
      chapter = {
        id: uniqueId(numbered ? `chapter-${numbered[1]}` : slugify(text)),
        label: numbered ? `Chapter ${numbered[1]}` : "Overview",
        title: numbered ? numbered[2] : text,
        intro: [],
        sections: [],
      }
      raw.push(chapter)
      continue
    }
    if (!chapter) {
      // Lines between the title and the first chapter (edition / version).
      if (token.type === "paragraph") subtitle = inline(token.text)
      continue
    }
    if (token.type === "heading" && token.depth === 3) {
      const text = inline(token.text)
      chapter.sections.push({ id: uniqueId(`${chapter.id}-${slugify(text)}`), title: text, tokens: [] })
      continue
    }
    const target = chapter.sections.length ? chapter.sections[chapter.sections.length - 1].tokens : chapter.intro
    target.push(token)
  }

  for (const c of raw) {
    // The manual's own table of contents is replaced by the page navigation.
    if (/^table of contents$/i.test(c.title)) continue
    const introHtml = render(c.intro)
    chapters.push({
      id: c.id,
      label: c.label,
      title: c.title,
      introHtml,
      introText: `${c.label} ${c.title} ${plainText(introHtml)}`.toLowerCase(),
      sections: c.sections.map((s) => {
        const html = render(s.tokens)
        return { id: s.id, title: s.title, html, text: `${s.title} ${plainText(html)}`.toLowerCase() }
      }),
    })
  }
  return { title, subtitle, chapters }
}
