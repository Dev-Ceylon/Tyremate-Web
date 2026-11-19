type CircularProgressProps = {
  value: number
  text: string
  ariaLabel?: string
}

export function CircularProgress({
  value,
  text,
  ariaLabel,
}: CircularProgressProps) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const normalizedValue = Math.max(0, Math.min(value, 100))
  const strokeDashoffset =
    circumference - (normalizedValue / 100) * circumference

  return (
    <div className="circular-progress">
      <svg
        viewBox="0 0 120 120"
        className="circular-progress-ring"
        role="img"
        aria-label={ariaLabel ?? `${Math.round(normalizedValue)} percent ${text}`}
      >
        <circle
          className="circular-progress-track"
          cx="60"
          cy="60"
          r={radius}
        />
        <circle
          className="circular-progress-fill"
          cx="60"
          cy="60"
          r={radius}
          style={{
            strokeDasharray: `${circumference}`,
            strokeDashoffset: `${strokeDashoffset}`,
          }}
        />
      </svg>

      <div className="circular-progress-label">
        <strong>{Math.round(normalizedValue)}%</strong>
        <span>{text}</span>
      </div>
    </div>
  )
}
