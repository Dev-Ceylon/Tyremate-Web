import { useEffect, useState } from "react"
import { tyreService } from "../../master-data/tyres/services/tyreService"
import { consumableService } from "../../master-data/consumables/services/consumableService"
import { batteryService } from "../../master-data/batteries/services/batteryService"

export function useLowStock() {
  const [count, setCount] = useState(0)

  const loadLowStock = () => {
    Promise.all([
      tyreService.getLowStockCount(),
      consumableService.getLowStockCount(),
      batteryService.getLowStockCount(),
    ])
      .then(([tyres, consumables, batteries]) =>
        setCount(
          (tyres?.Count ?? 0) +
            (consumables?.Count ?? 0) +
            (batteries?.Count ?? 0),
        ),
      )
      .catch(() => {})
  }

  useEffect(() => {
    loadLowStock()
  }, [])

  return { count }
}
