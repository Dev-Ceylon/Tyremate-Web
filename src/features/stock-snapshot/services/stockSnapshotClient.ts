import type { StockSnapshotRecord } from "../models/stockSnapshot"

export const stockSnapshotClient = {
  getAll: (): Promise<StockSnapshotRecord[]> =>
    window.api.stockSnapshots.getStockSnapshots(),

  getByTyreId: (tyreId: number): Promise<StockSnapshotRecord> =>
    window.api.stockSnapshots.getStockSnapshotByTyreId(tyreId),
}