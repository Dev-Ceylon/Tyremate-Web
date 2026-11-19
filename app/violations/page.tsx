"use client"
// Generated route wrapper: renders the original renderer page client-side only.
import dynamic from "next/dynamic"

export default dynamic(() => import("@/features/violations/pages/ViolationsListPage").then((m) => m.ViolationsListPage), { ssr: false })
