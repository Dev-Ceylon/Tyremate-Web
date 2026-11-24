import React from "react"
import type { IconProps } from "./types"

export const BatteryIcon: React.FC<IconProps> = ({
  size = 18,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`tm-icon tm-icon-battery ${className}`.trim()}
    aria-hidden="true"
    {...props}
  >
    <rect x="2" y="7" width="16" height="11" rx="2" ry="2" />
    <path d="M22 11v2" />
    <path d="M6 10v4" />
    <path d="M10 10v4" />
    <path d="M14 10v4" />
  </svg>
)

export default BatteryIcon
