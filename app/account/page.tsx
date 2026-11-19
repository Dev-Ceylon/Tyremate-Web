"use client"
import dynamic from "next/dynamic"

export default dynamic(() => import("@/features/account/pages/AccountPage"), { ssr: false })
