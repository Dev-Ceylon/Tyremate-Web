import { useEffect, useState } from "react"
import { tyreService } from "../../master-data/tyres/services/tyreService"
import { consumableService } from "../../master-data/consumables/services/consumableService"

export function useLowStock() {
  const [count, setCount] = useState(0)

  const loadLowStock = () => {
    Promise.all([tyreService.getLowStockCount(), consumableService.getLowStockCount()])
      .then(([tyres, consumables]) => setCount(tyres.Count + consumables.Count))
  }

  useEffect(() => {
    loadLowStock()
  }, [])

  return { count }
}
