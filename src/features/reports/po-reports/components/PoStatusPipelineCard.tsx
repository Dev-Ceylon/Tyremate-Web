import React from "react"
import { FileEdit, Clock, Truck, PackageCheck, CheckCircle2 } from "lucide-react"
import type { PoStatusPipelineItem } from "../models/poReport"
import { formatLKR } from "../../../../shared/utils/formatters"
import { STATUS_CODES, getStatusColorClass } from "../../../../shared/constants/statusConstants"

interface PoStatusPipelineCardProps {
  pipeline: PoStatusPipelineItem[]
  totalNetSpend: number
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  [STATUS_CODES.DRAFT]: <FileEdit size={18} className="text-muted" />,
  [STATUS_CODES.PENDING]: <Clock size={18} className="text-warning" />,
  [STATUS_CODES.ARRIVING]: <Truck size={18} className="text-info" />,
  [STATUS_CODES.ARRIVED]: <PackageCheck size={18} className="text-primary" />,
  [STATUS_CODES.COMPLETED]: <CheckCircle2 size={18} className="text-success" />,
}

const STATUS_SEGMENT_COLORS: Record<string, string> = {
  [STATUS_CODES.DRAFT]: "#94a3b8",
  [STATUS_CODES.PENDING]: "#f59e0b",
  [STATUS_CODES.ARRIVING]: "#0ea5e9",
  [STATUS_CODES.ARRIVED]: "#6366f1",
  [STATUS_CODES.COMPLETED]: "#10b981",
}

export const PoStatusPipelineCard: React.FC<PoStatusPipelineCardProps> = ({
  pipeline,
  totalNetSpend,
}) => {
  const totalOrders = pipeline.reduce((acc, curr) => acc + curr.poCount, 0)

  return (
    <article className="panel panel-strong report-breakdown-card">
      <div className="card-header-clean">
        <div>
          <span className="eyebrow">Lifecycle &amp; Pipeline</span>
          <h2>Purchase Order Status Distribution</h2>
        </div>
        <span className="badge-count">{totalOrders} Orders in Pipeline</span>
      </div>

      {/* Proportional Progress Bar */}
      <div className="report-progress-bar" title="Expenditure distribution across order statuses">
        {pipeline.map((item) => {
          const width = totalNetSpend > 0 ? (item.netSpend / totalNetSpend) * 100 : 0
          if (width <= 0) return null
          return (
            <div
              key={`bar-${item.statusCode}`}
              className="progress-segment"
              style={{
                width: `${width}%`,
                backgroundColor: STATUS_SEGMENT_COLORS[item.statusCode] || "#64748b",
              }}
              title={`${item.statusName}: ${formatLKR(item.netSpend)} (${item.percentageOfSpend}%)`}
            />
          )
        })}
      </div>

      {/* Responsive Horizontal Grid of Status Boxes */}
      <div className="report-channel-grid">
        {pipeline.map((item) => {
          const icon = STATUS_ICONS[item.statusCode] || <Clock size={18} className="text-muted" />
          const badgeClass = getStatusColorClass(item.statusCode) || "status-pending"

          return (
            <div key={item.statusCode} className="report-channel-box">
              <div className="channel-indicator">
                {icon}
                <div>
                  <strong>{item.statusName}</strong>
                  <small>
                    {item.poCount} order{item.poCount === 1 ? "" : "s"} &bull; {item.tyresCount} tyres
                  </small>
                </div>
              </div>
              <div className="channel-financials">
                <strong>{formatLKR(item.netSpend)}</strong>
                <small className={`status-badge-inline ${badgeClass}`}>
                  {item.percentageOfSpend}% of spend
                </small>
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}
