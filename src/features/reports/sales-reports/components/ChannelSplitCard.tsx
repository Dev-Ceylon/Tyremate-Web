import React from "react"
import type { SalesSummary } from "../models/salesReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface ChannelSplitCardProps {
  summary: SalesSummary
}

export const ChannelSplitCard: React.FC<ChannelSplitCardProps> = ({ summary }) => {
  const { channels } = summary
  const tyreNet = channels.tyres.netAmount || 0
  const dagNet = channels.dag.netAmount || 0
  const serviceNet = channels.otherServices.netAmount || 0
  const totalChannelsNet = tyreNet + dagNet + serviceNet

  const tyrePercent = totalChannelsNet > 0 ? (tyreNet / totalChannelsNet) * 100 : 0
  const dagPercent = totalChannelsNet > 0 ? (dagNet / totalChannelsNet) * 100 : 0
  const servicePercent = totalChannelsNet > 0 ? (serviceNet / totalChannelsNet) * 100 : 0

  return (
    <article className="panel panel-strong report-breakdown-card">
      <div className="card-header-clean">
        <div>
          <span className="eyebrow">Revenue Contribution</span>
          <h3>Sales Channel Distribution</h3>
        </div>
        <span className="badge-count">{channels.tyres.orderCount! + channels.dag.takeCount! + channels.otherServices.serviceCount!} Activities</span>
      </div>

      {/* Proportional Stacked Progress Bar */}
      <div className="report-progress-bar">
        {tyrePercent > 0 && (
          <div
            className="progress-segment tyre-segment"
            style={{ width: `${tyrePercent}%` }}
            title={`Tyres: ${tyrePercent.toFixed(1)}%`}
          />
        )}
        {dagPercent > 0 && (
          <div
            className="progress-segment dag-segment"
            style={{ width: `${dagPercent}%` }}
            title={`DAG Retreading: ${dagPercent.toFixed(1)}%`}
          />
        )}
        {servicePercent > 0 && (
          <div
            className="progress-segment service-segment"
            style={{ width: `${servicePercent}%` }}
            title={`Bay Services: ${servicePercent.toFixed(1)}%`}
          />
        )}
      </div>

      {/* Channel Cards Grid */}
      <div className="report-channel-grid">
        {/* Tyres */}
        <div className="report-channel-box">
          <div className="channel-indicator">
            <span className="legend-color tyre-color" />
            <div>
              <strong>Tyre Sales Orders</strong>
              <small>{channels.tyres.orderCount} order{channels.tyres.orderCount === 1 ? "" : "s"}</small>
            </div>
          </div>
          <div className="channel-financials">
            <strong>{formatLKR(tyreNet)}</strong>
            <small>{tyrePercent.toFixed(1)}% of sales</small>
          </div>
        </div>

        {/* DAG */}
        <div className="report-channel-box">
          <div className="channel-indicator">
            <span className="legend-color dag-color" />
            <div>
              <strong>DAG Retreading Takes</strong>
              <small>{channels.dag.takeCount} take{channels.dag.takeCount === 1 ? "" : "s"}</small>
            </div>
          </div>
          <div className="channel-financials">
            <strong>{formatLKR(dagNet)}</strong>
            <small>{dagPercent.toFixed(1)}% of sales</small>
          </div>
        </div>

        {/* Other Bay Services */}
        <div className="report-channel-box">
          <div className="channel-indicator">
            <span className="legend-color service-color" />
            <div>
              <strong>Workshop Bay Services</strong>
              <small>{channels.otherServices.serviceCount} service{channels.otherServices.serviceCount === 1 ? "" : "s"}</small>
            </div>
          </div>
          <div className="channel-financials">
            <strong>{formatLKR(serviceNet)}</strong>
            <small>{servicePercent.toFixed(1)}% of sales</small>
          </div>
        </div>
      </div>
    </article>
  )
}
