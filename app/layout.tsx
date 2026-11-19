import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "../src/index.css"
import "../src/App.css"
import "../src/shell/web/web.css"
import "../src/shell/web/help.css"
import ClientRoot from "../src/shell/ClientRoot"
import { brandAsset } from "../src/shell/web/assets"

export const metadata: Metadata = {
  title: "TyreMate ERP",
  description: "Tyre sales, purchasing, DAG, inventory and invoicing for TyreMate.",
  icons: { icon: brandAsset("favicon") },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}
