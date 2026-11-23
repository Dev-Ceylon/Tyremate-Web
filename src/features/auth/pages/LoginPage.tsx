// features/auth/pages/LoginPage.tsx

import { useState } from "react"
import { useAuthContext } from "../hooks/AuthProvider"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import Link from "next/link"
import { BrandLogo } from "../../../shell/web/BrandLogo"
import { describeDatabase, useBackendStatus } from "../../../shell/web/useBackendStatus"

export default function LoginPage() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const backendStatus = useBackendStatus()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    try {
      await login(username, password)
      showToast({
        variant: "success",
        title: "Login successful",
        message: `Welcome back${username ? `, ${username}` : ""}.`,
      })
      navigate("/")
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Login failed",
        message: err.message || "Please check your username and password.",
      })
    }
  }

  return (
    <main className="app-shell">
      <section className="login-panel panel panel-strong">
        <div className="login-copy">
          <BrandLogo size={56} />
          <p className="eyebrow">Secure Access</p>
          <h1>Sign in to TyreMate</h1>
          <p className="hero-text">
            Access your workshop dashboard, inventory records, and the rest of
            your workflow from one secure login.
          </p>
        </div>

        <div className="login-form">
          <label className="field-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="text-input"
            autoComplete="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="text-input"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleLogin()
              }
            }}
          />

          <button type="button" className="primary-action login-submit" onClick={handleLogin}>
            Login
          </button>

          <p className="tm-note tm-login-note">
            Database: {describeDatabase(backendStatus)} ·{" "}
            <Link href="/setup">Database settings</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
