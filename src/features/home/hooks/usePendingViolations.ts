import { useEffect, useState } from "react"
import { violationService } from "../../violations/services/violationService"

export function usePendingViolations() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    violationService
      .getPending()
      .then((items) => setCount(Array.isArray(items) ? items.length : 0))
      .catch(() => {})
  }, [])

  return { count }
}
