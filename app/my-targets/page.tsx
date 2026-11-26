"use client"
import dynamic from "next/dynamic"

export default dynamic(
  () => import("@/features/sales-target/pages/MyTargetsPage"),
  { ssr: false }
)
