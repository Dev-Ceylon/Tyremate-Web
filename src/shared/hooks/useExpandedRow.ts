import { useCallback, useState } from "react"

/**
 * Accordion state for expandable table rows: at most one row is open at a
 * time.
 *
 * The key is owned by the page, not the table, so a refetch of the list does
 * not collapse whatever the user had open. A stale key is harmless: it matches
 * no rendered row, and DAGGatePass IDs are AUTOINCREMENT so one is never
 * reused.
 */
export function useExpandedRow() {
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null)

  const toggle = useCallback((rowKey: string) => {
    setExpandedRowKey((current) => (current === rowKey ? null : rowKey))
  }, [])

  const isExpanded = useCallback(
    (rowKey: string) => expandedRowKey === rowKey,
    [expandedRowKey],
  )

  return { expandedRowKey, toggle, isExpanded }
}
