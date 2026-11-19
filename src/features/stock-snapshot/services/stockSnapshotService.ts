import { stockSnapshotClient } from "./stockSnapshotClient"
import type { StockSnapshotRecord } from "../models/stockSnapshot"

export const stockSnapshotService = {
  getStockSnapshots: (): Promise<StockSnapshotRecord[]> => 
    stockSnapshotClient.getAll(),

  getStockSnapshotByTyreId: (tyreId: number): Promise<StockSnapshotRecord> =>
    stockSnapshotClient.getByTyreId(tyreId),
}