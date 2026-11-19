"use client"
import { Link } from "@/lib/router"

/** Shown while the signed-in user still uses the seeded default password. */
export function DefaultPasswordBanner() {
  return (
    <div className="app-shell" style={{ paddingBottom: 0 }}>
      <div className="tm-banner" role="alert">
        <span>
          You are using the default password. Anyone who knows it can sign in as you - please change it now.
        </span>
        <Link to="/account">Change password</Link>
      </div>
    </div>
  )
}
