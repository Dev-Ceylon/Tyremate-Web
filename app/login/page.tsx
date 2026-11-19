"use client"
// Generated route wrapper: renders the original renderer page client-side only.
import dynamic from "next/dynamic"

export default dynamic(() => import("@/features/auth/pages/LoginPage"), { ssr: false })
