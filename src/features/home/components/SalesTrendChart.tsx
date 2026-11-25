import { useSalesTrend } from "../hooks/useSalesTrend"

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatLabel = (date: string) => {
  const [, month, day] = date.split("-")
  return `${Number(month)}/${Number(day)}`
}

export default function SalesTrendChart() {
  const { points, range, setRange } = useSalesTrend()
  const max = Math.max(...points.map((point) => point.TotalSale), 0)
  const labelEvery = range === 7 ? 1 : 5

  return (
    <div className="trend-chart">
      <div className="trend-header">
        <div className="trend-title">
          <p className="section-label">Trends / operational</p>
          <h2>Sales over last {range} days</h2>
        </div>
        <div className="range-toggle" role="group" aria-label="Trend range">
          <button
            type="button"
            className={range === 7 ? "active" : ""}
            onClick={() => setRange(7)}
          >
            7 Days
          </button>
          <button
            type="button"
            className={range === 30 ? "active" : ""}
            onClick={() => setRange(30)}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="trend-plot">
        <span className="trend-max-label">Rs {formatCurrency(max)}</span>
        <div className="trend-bars">
          {points.map((point) => {
            const height = max > 0 ? (point.TotalSale / max) * 100 : 0
            return (
              <div className="trend-bar-wrap" key={point.Date}>
                <div
                  className="trend-bar"
                  style={{ height: `${height}%` }}
                  title={`${point.Date} - Rs ${formatCurrency(point.TotalSale)} (${point.OrderCount} ${
                    point.OrderCount === 1 ? "order" : "orders"
                  })`}
                />
              </div>
            )
          })}
        </div>
        <div className="trend-x-labels">
          {points.map((point, index) => {
            const isVisible = index % labelEvery === 0 || index === points.length - 1
            return (
              <span
                key={point.Date}
                className={`trend-x-label ${isVisible ? "" : "is-hidden"}`}
              >
                {formatLabel(point.Date)}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
