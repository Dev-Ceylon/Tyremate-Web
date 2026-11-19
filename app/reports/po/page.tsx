"use client"
import { Navigate } from "@/lib/router"

export default function Redirect() {
  return <Navigate to="/reports/purchase-orders" replace />
}
