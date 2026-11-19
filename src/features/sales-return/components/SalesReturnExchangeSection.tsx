import type { SalesReturnDetails } from "../models/salesReturn"

interface Props {
  details: SalesReturnDetails
  exchangeOrderId: string
  exchangeOrderValue: number | null
  busy: boolean
  onExchangeOrderIdChange: (id: string) => void
  onLinkExchangeOrder: () => void
}

export function SalesReturnExchangeSection({
  details, exchangeOrderId, exchangeOrderValue, busy, onExchangeOrderIdChange, onLinkExchangeOrder,
}: Props) {
  if (details.salesReturn.ReturnTypeCode !== "EXCHANGE") return null

  const approvedReturnValue = details.lines
    .filter((line) => line.Approved === 1)
    .reduce((sum, line) => sum + Number(line.LineAmount || 0), 0)

  return (
    <section className="panel panel-strong rounded-lg p-5 space-y-3">
      <div><p className="eyebrow">Exchange</p><h3 className="font-semibold">Replacement sale</h3></div>
      {details.salesReturn.ExchangeSoID ? (
        <p>Linked Sales Order SO-{details.salesReturn.ExchangeSoID}</p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="field-label">Replacement Sales Order ID
            <input className="text-input" type="number" min="1" value={exchangeOrderId} onChange={(event) => onExchangeOrderIdChange(event.target.value)} />
          </label>
          <button type="button" className="secondary-action" disabled={busy || !exchangeOrderId} onClick={onLinkExchangeOrder}>Link replacement order</button>
        </div>
      )}
      {exchangeOrderValue !== null && (
        <p className="secondary-text">Replacement sale: LKR {exchangeOrderValue.toLocaleString()} · returned approved tyre value: LKR {approvedReturnValue.toLocaleString()} · settle the difference through the replacement order’s normal payment/credit flow.</p>
      )}
    </section>
  )
}
