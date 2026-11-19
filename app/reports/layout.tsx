"use client"
import type { ReactNode } from "react"
import { OutletProvider } from "@/lib/router"
import RequirePermission from "@/shell/routes/RequirePermission"

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <OutletProvider outlet={children} base="/reports">
      <RequirePermission permission="reports.view" />
    </OutletProvider>
  )
}
