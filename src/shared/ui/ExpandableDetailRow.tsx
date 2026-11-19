import type { ReactNode } from "react"

type ExpandableDetailRowProps = {
  isExpanded: boolean
  colSpan: number
  children: ReactNode
}

/**
 * The detail half of an expandable table row.
 *
 * It renders as a sibling `<tr>` that is *always mounted*; only the `.expanded`
 * class flips. That is deliberate: `.dot-lots-content` in App.css animates
 * `grid-template-rows: 0fr -> 1fr`, and that transition only runs because the
 * node is present while it collapses. Returning `null` instead would make the
 * panel snap shut.
 *
 * The `children` must be the single root element of the detail panel so it
 * becomes the direct child of `.dot-lots-content` (which requires
 * `min-height: 0` for the 0fr trick to work).
 */
export function ExpandableDetailRow({ isExpanded, colSpan, children }: ExpandableDetailRowProps) {
  return (
    <tr className={isExpanded ? "dot-lots-row expanded" : "dot-lots-row"}>
      <td colSpan={colSpan}>
        <div className="dot-lots-content">{children}</div>
      </td>
    </tr>
  )
}
