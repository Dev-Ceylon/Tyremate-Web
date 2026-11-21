import { useCallback, useEffect, useState } from "react"
import type { BatteryRecord } from "../models/battery"
import { batteryService } from "../services/batteryService"

type UseBatteriesOptions = {
  onDeleteSuccess?: (battery: BatteryRecord) => void
  onDeleteError?: (message: string, battery: BatteryRecord) => void
}

export function useBatteries(options?: UseBatteriesOptions) {
  const [batteries, setBatteries] = useState<BatteryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingBatteryId, setDeletingBatteryId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await batteryService.getBatteries()
      setBatteries(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load batteries"
      setError(message)
      console.log(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeBattery = useCallback(async (battery: BatteryRecord) => {
    setDeletingBatteryId(battery.Id)

    try {
      await batteryService.deleteBattery(battery.Id)
      setBatteries((current) =>
        current.filter((currentBattery) => currentBattery.Id !== battery.Id)
      )
      options?.onDeleteSuccess?.(battery)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete battery"
      options?.onDeleteError?.(message, battery)
      throw err
    } finally {
      setDeletingBatteryId(null)
    }
  }, [options])

  return { batteries, loading, error, deletingBatteryId, refresh, removeBattery }
}
