"use client"
import { useId, useState } from "react"
import { useAuthContext } from "../../auth/hooks/AuthProvider"
import { useToast } from "../../../shared/ui/toast/ToastProvider"

export default function AccountPage() {
  const ids = useId()
  const { user } = useAuthContext()
  const { showToast } = useToast()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [repeat, setRepeat] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (next !== repeat) {
      setError("The new passwords do not match")
      return
    }
    setSaving(true)
    try {
      await window.api.auth.changePassword(current, next)
      setCurrent("")
      setNext("")
      setRepeat("")
      showToast({ variant: "success", title: "Password changed", message: "Use the new password next time you sign in." })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="app-shell tm-admin">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">My account</p>
          <h1>{user?.displayName || user?.username}</h1>
          <p className="hero-text">Roles: {user?.roles.map((r) => r.roleName).join(", ") || "—"}</p>
        </div>
      </section>
      <section className="panel tm-card" style={{ maxWidth: "36rem" }} aria-labelledby={`${ids}-title`}>
        <h2 id={`${ids}-title`}>Change password</h2>
        <form
          className="tm-form"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="tm-form-row">
            <label className="field-label" htmlFor={`${ids}-current`}>
              Current password
            </label>
            <input id={`${ids}-current`} className="text-input" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="tm-form-row">
            <label className="field-label" htmlFor={`${ids}-new`}>
              New password
            </label>
            <input id={`${ids}-new`} className="text-input" type="password" autoComplete="new-password" minLength={6} required value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="tm-form-row">
            <label className="field-label" htmlFor={`${ids}-repeat`}>
              Repeat new password
            </label>
            <input id={`${ids}-repeat`} className="text-input" type="password" autoComplete="new-password" minLength={6} required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
          </div>
          {error ? (
            <p className="tm-message tm-message-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="tm-inline">
            <button type="submit" className="primary-action" disabled={saving}>
              {saving ? "Saving…" : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
