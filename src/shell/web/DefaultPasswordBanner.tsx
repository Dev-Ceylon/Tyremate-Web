"use client"
import { useState } from "react"
import { Link } from "@/lib/router"

const DISMISS_KEY = "tyremate.defaultPasswordBannerDismissed"

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1"
  } catch {
    return false
  }
}

/** Shown while the signed-in user still uses the seeded default password. */
export function DefaultPasswordBanner() {
  const [dismissed, setDismissed] = useState(wasDismissed)
  if (dismissed) return null

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // ignore: the banner simply returns on the next page load
    }
    setDismissed(true)
  }

  return (
    <div className="app-shell" style={{ paddingBottom: 0 }}>
      <div className="tm-banner" role="alert">
        <span>
          You are using the default password. Anyone who knows it can sign in as you - please change it now.
        </span>
        <span className="tm-banner-actions">
          <Link to="/account">Change password</Link>
          <button type="button" className="tm-banner-dismiss" onClick={dismiss}>
            Remind me later
          </button>
        </span>
      </div>
    </div>
  )
}
