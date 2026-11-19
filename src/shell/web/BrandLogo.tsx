"use client"
import { useState } from "react"
import { brandAsset, brandAssetFallback } from "./assets"

/** TyreMate logo served from Cloudinary, falling back to the bundled copy. */
export function BrandLogo({ size = 40, className }: { size?: number; className?: string }) {
  const [src, setSrc] = useState(brandAsset("logo"))
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="TyreMate"
      width={size}
      height={size}
      className={className ?? "tm-logo"}
      onError={() => {
        const fallback = brandAssetFallback("logo")
        if (src !== fallback) setSrc(fallback)
      }}
    />
  )
}
