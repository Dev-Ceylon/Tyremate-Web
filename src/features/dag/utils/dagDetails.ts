import type { DagDetailedRecord, DagPaymentDetail } from "../models/dag"

export type DagTotals = {
  payments: DagPaymentDetail[]
  totalCost: number
  paidAmount: number
  outstanding: number
  takenAmount: number
}

export function formatCurrency(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function getDagTotals(dag: DagDetailedRecord): DagTotals {
  const payments = dag.Payments ?? []
  const serialsTotal = (dag.Tyres ?? []).reduce((sum, tyre) => {
    return sum + (tyre.Serials ?? []).reduce((lineSum, serial) => {
      const value = Number(serial.DAGCost)
      return lineSum + (Number.isNaN(value) ? 0 : value)
    }, 0)
  }, 0)
  const totalCost = (dag.TotalDAGCost && dag.TotalDAGCost > 0) ? dag.TotalDAGCost : serialsTotal
  const paidAmount = payments.reduce((sum, payment) => sum + (payment.Amount ?? 0), 0)

  // Value of the serials that have actually been taken (collected), derived from
  // the per-serial sold markers rather than the DAG's contracted total.
  const takenAmount = (dag.Tyres ?? []).reduce((sum, tyre) => {
    return sum + (tyre.Serials ?? []).reduce((lineSum, serial) => {
      if (!serial.SoldAt) return lineSum
      const value = Number(serial.DAGCost)
      return lineSum + (Number.isNaN(value) ? 0 : value)
    }, 0)
  }, 0)

  return {
    payments,
    totalCost,
    paidAmount,
    outstanding: Math.max(totalCost - paidAmount, 0),
    takenAmount,
  }
}