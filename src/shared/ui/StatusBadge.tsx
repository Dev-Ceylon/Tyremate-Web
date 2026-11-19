type StatusTone = "approved" | "rejected" | "pending" | "completed" | "arrived"

type StatusBadgeProps = {
  label: string
  tone?: StatusTone
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const className = tone ? `status-badge status-${tone}` : "status-badge"
  return <span className={className}>{label}</span>
}