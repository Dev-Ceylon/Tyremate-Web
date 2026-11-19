import type { SalesReturnStockMovementRecord } from "../models/salesReturn"

export function SalesReturnStockHistory({ movements }: { movements: SalesReturnStockMovementRecord[] }) {
  if (!movements.length) return null

  return (
    <section className="panel panel-strong rounded-lg p-5">
      <p className="eyebrow">Inventory</p>
      <h3 className="font-semibold mb-2">Stock history</h3>
      <ul className="space-y-1">
        {movements.map((movement) => (
          <li key={movement.MovementID}>
            {movement.MovementType.replaceAll("_", " ")} · {movement.Qty} · {movement.LocationType}
          </li>
        ))}
      </ul>
    </section>
  )
}
