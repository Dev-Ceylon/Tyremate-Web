"use client"
// Generated route wrapper: renders the original renderer page client-side only.
import dynamic from "next/dynamic"
import type { ReactNode } from "react"
import { OutletProvider } from "@/lib/router"

const Layout = dynamic(() => import("@/features/master-data/suppliers/pages/SuppliersPage"), { ssr: false })

export default function NestedLayout({ children }: { children: ReactNode }) {
  return (
    <OutletProvider outlet={children} base="/master-data/suppliers">
      <Layout />
    </OutletProvider>
  )
}
