/**
 * Keeps short table values (dates, codes, amounts, tyre sizes) on one line.
 * Browsers otherwise break "2026-11-19" at its hyphens or "Rs. 60,000" at the
 * space as soon as a table is a little narrow; long text still wraps.
 * CSS cannot select by text length, so cells are marked with a class.
 */
const MAX_NOWRAP_CHARS = 28

function markCells(root: ParentNode) {
  root.querySelectorAll<HTMLTableCellElement>("td, th").forEach((cell) => {
    if (cell.querySelector("input, select, textarea, table")) {
      cell.classList.remove("tm-cell-nowrap")
      return
    }
    const text = (cell.textContent ?? "").replace(/\s+/g, " ").trim()
    cell.classList.toggle("tm-cell-nowrap", text.length > 0 && text.length <= MAX_NOWRAP_CHARS)
  })
}

export function installTableCellWrapping(root: HTMLElement): () => void {
  let frame = 0
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      markCells(root)
    })
  }
  const observer = new MutationObserver(schedule)
  observer.observe(root, { childList: true, subtree: true, characterData: true })
  schedule()
  return () => {
    observer.disconnect()
    if (frame) cancelAnimationFrame(frame)
  }
}
