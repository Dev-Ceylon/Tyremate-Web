"use client"
import { Navigate } from "@/lib/router"

// Unknown URLs fall back to the home page (desktop: <Route path="*" element={<Navigate to="/" />} />).
export default function NotFound() {
  return <Navigate to="/" replace />
}
