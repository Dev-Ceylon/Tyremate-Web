"use client"
import dynamic from "next/dynamic"

export default dynamic(() => import("@/features/help/pages/HelpPage"), { ssr: false })
