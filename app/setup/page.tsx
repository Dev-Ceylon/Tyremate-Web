"use client"
import dynamic from "next/dynamic"

export default dynamic(() => import("@/features/admin/pages/SetupPage"), { ssr: false })
