"use client"
import { useEffect, useId, useState } from "react"
import { databaseConfig, type ConnectionTestResult, type DatabaseConfig } from "../services/adminClient"
import { describeDatabase, useBackendStatus } from "../../../shell/web/useBackendStatus"

type Message = { kind: "ok" | "error"; text: string } | null

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Chooses where this browser keeps its data:
 *  - Local: SQLite inside the browser (IndexedDB). Zero set-up, single device.
 *  - Remote: a Turso / libSQL database shared by every device and user.
 */
export function DatabaseConnectionCard({ onApplied }: { onApplied?: () => void }) {
  const status = useBackendStatus()
  const ids = useId()
  const isLocked = databaseConfig.isLocked()
  const environmentName = databaseConfig.isProduction() ? "Production" : "Development"
  const saved = databaseConfig.load()
  const [driver, setDriver] = useState<DatabaseConfig["driver"]>(saved.driver)
  const [url, setUrl] = useState(saved.driver === "libsql" ? saved.url : "")
  const [token, setToken] = useState(saved.driver === "libsql" ? saved.authToken ?? "" : "")
  const [showToken, setShowToken] = useState(false)
  const [busy, setBusy] = useState<"test" | "save" | null>(null)
  const [message, setMessage] = useState<Message>(null)
  const [test, setTest] = useState<ConnectionTestResult | null>(null)
  const [code, setCode] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")

  useEffect(() => {
    setTest(null)
    setMessage(null)
  }, [driver, url, token])

  const config = (): DatabaseConfig =>
    driver === "local" ? { driver: "local" } : { driver: "libsql", url: url.trim(), authToken: token.trim() || undefined }

  const handleTest = async () => {
    setBusy("test")
    setMessage(null)
    try {
      const result = await databaseConfig.test(config())
      setTest(result)
      setMessage({ kind: "ok", text: result.message })
    } catch (error) {
      setTest(null)
      setMessage({ kind: "error", text: errorText(error) })
    } finally {
      setBusy(null)
    }
  }

  const handleSave = async () => {
    if (isLocked) return
    setBusy("save")
    setMessage(null)
    try {
      await databaseConfig.apply(config())
      setMessage({ kind: "ok", text: "Saved. The application is now connected to this database." })
      onApplied?.()
    } catch (error) {
      setMessage({ kind: "error", text: errorText(error) })
    } finally {
      setBusy(null)
    }
  }

  const handleApplyCode = () => {
    try {
      const decoded = databaseConfig.decodeCode(code)
      setDriver(decoded.driver)
      if (decoded.driver === "libsql") {
        setUrl(decoded.url)
        setToken(decoded.authToken ?? "")
      }
      setCode("")
      setMessage({ kind: "ok", text: "Connection code loaded. Test it, then save." })
    } catch (error) {
      setMessage({ kind: "error", text: errorText(error) })
    }
  }

  const handleGenerateCode = () => {
    try {
      setGeneratedCode(databaseConfig.encodeCode(config()))
    } catch (error) {
      setMessage({ kind: "error", text: errorText(error) })
    }
  }

  const statusClass =
    status.state === "ready" ? "tm-status-ok" : status.state === "error" ? "tm-status-error" : "tm-status-warn"
  const statusLabel =
    status.state === "ready" ? "Connected" : status.state === "error" ? "Not connected" : status.state === "starting" ? "Connecting" : "Idle"

  return (
    <section className="panel tm-card" aria-labelledby={`${ids}-title`}>
      <div>
        <p className="eyebrow">Database connection</p>
        <h2 id={`${ids}-title`}>Where this browser stores TyreMate data</h2>
        <p className="tm-card-sub">
          {isLocked
            ? `Connection credentials are automatically configured for ${environmentName} in application code.`
            : "This setting is saved in this browser only. Use a shared remote database when several people or devices work together; use the local database for a single computer, demos or offline use."}
        </p>
      </div>

      {isLocked ? (
        <div className="tm-banner tm-banner-info">
          <div>
            <strong>Database connection is managed by application code ({environmentName} mode).</strong>
            <p className="tm-note tm-banner-note">
              Database URL and token are configured in the codebase (<code>web/config/databaseCredentials.ts</code>). Manual configuration in setup is temporarily disabled.
            </p>
          </div>
        </div>
      ) : null}

      <dl className="tm-kv">
        <dt>Status</dt>
        <dd>
          <span className={`tm-status ${statusClass}`} data-testid="db-status">
            {statusLabel}
          </span>
        </dd>
        <dt>Database</dt>
        <dd>{describeDatabase(status)}</dd>
        {status.state === "ready" ? (
          <>
            <dt>Start-up</dt>
            <dd>
              {status.info.durationMs} ms
              {status.info.driver === "libsql" ? ` · ${status.info.roundTrips} requests` : ""}
              {status.info.migrationsApplied.length > 0 ? ` · ${status.info.migrationsApplied.length} migrations applied` : ""}
            </dd>
          </>
        ) : null}
        {status.state === "error" ? (
          <>
            <dt>Error</dt>
            <dd className="error-text">{status.error}</dd>
          </>
        ) : null}
      </dl>

      <fieldset className="tm-choice" aria-label="Database type" disabled={isLocked}>
        <label>
          <input
            type="radio"
            name={`${ids}-driver`}
            value="local"
            checked={driver === "local"}
            disabled={isLocked}
            onChange={() => setDriver("local")}
          />
          <span>
            <strong>This browser (local)</strong>
            <small>SQLite stored in this browser. Nothing to set up; data stays on this device.</small>
          </span>
        </label>
        <label>
          <input
            type="radio"
            name={`${ids}-driver`}
            value="libsql"
            checked={driver === "libsql"}
            disabled={isLocked}
            onChange={() => setDriver("libsql")}
          />
          <span>
            <strong>Shared remote database</strong>
            <small>Turso or any libSQL server. All devices see the same data.</small>
          </span>
        </label>
      </fieldset>

      {driver === "libsql" ? (
        <div className="tm-form">
          <div className="tm-form-row">
            <label className="field-label" htmlFor={`${ids}-url`}>
              Database URL {isLocked ? `(${environmentName} Code Config)` : ""}
            </label>
            <input
              id={`${ids}-url`}
              className="text-input"
              placeholder="libsql://tyremate-yourorg.turso.io"
              value={url}
              disabled={isLocked}
              readOnly={isLocked}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="tm-form-row">
            <label className="field-label" htmlFor={`${ids}-token`}>
              Auth token {isLocked ? `(${environmentName} Code Config)` : ""}
            </label>
            <div className="tm-inline">
              <input
                id={`${ids}-token`}
                className="text-input tm-flex-input"
                type={showToken ? "text" : "password"}
                placeholder="Database token (configured in code)"
                value={token ? (showToken ? token : "••••••••••••••••••••••••") : (isLocked ? "(No token configured)" : "")}
                disabled={isLocked}
                readOnly={isLocked}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setToken(e.target.value)}
              />
              {token ? (
                <button type="button" className="secondary-action" onClick={() => setShowToken((v) => !v)}>
                  {showToken ? "Hide" : "Show"}
                </button>
              ) : null}
            </div>
            <p className="tm-note">
              {isLocked
                ? `Configured in web/config/databaseCredentials.ts (${environmentName.toLowerCase()} settings).`
                : "The token is stored only in this browser's local storage and sent only to the database URL above."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="tm-inline">
        <button type="button" className="secondary-action" onClick={handleTest} disabled={busy !== null}>
          {busy === "test" ? "Testing…" : "Test connection"}
        </button>
        {!isLocked ? (
          <button type="button" className="primary-action" onClick={handleSave} disabled={busy !== null}>
            {busy === "save" ? "Connecting…" : "Save & connect"}
          </button>
        ) : (
          <span className="tm-locked-text">
            Database connection is locked to codebase credentials.
          </span>
        )}
      </div>

      {message ? (
        <p className={`tm-message ${message.kind === "ok" ? "tm-message-ok" : "tm-message-error"}`} role="status">
          {message.text}
        </p>
      ) : null}

      {test && test.driver === "libsql" ? (
        <dl className="tm-kv" data-testid="db-test-result">
          <dt>SQLite version</dt>
          <dd>{test.sqliteVersion}</dd>
          <dt>Latency</dt>
          <dd>{test.latencyMs} ms</dd>
          <dt>Tables</dt>
          <dd>{test.tables}</dd>
          <dt>TyreMate schema</dt>
          <dd>{test.initialised ? `Installed (${test.migrationsApplied} migrations)` : "Not installed yet - created on connect"}</dd>
        </dl>
      ) : null}

      {!isLocked ? (
        <details>
          <summary>Connection code (set up other devices quickly)</summary>
          <div className="tm-form tm-login-note">
            <p className="tm-note">
              A connection code contains the URL and token. Share it only with people allowed to access the database.
            </p>
            <div className="tm-inline">
              <button type="button" className="secondary-action" onClick={handleGenerateCode}>
                Generate code for these settings
              </button>
            </div>
            {generatedCode ? (
              <textarea className="text-input tm-code" readOnly rows={3} value={generatedCode} aria-label="Generated connection code" />
            ) : null}
            <label className="field-label" htmlFor={`${ids}-code`}>
              Paste a connection code
            </label>
            <div className="tm-inline">
              <input
                id={`${ids}-code`}
                className="text-input tm-flex-input"
                value={code}
                placeholder="TM1.…"
                onChange={(e) => setCode(e.target.value)}
              />
              <button type="button" className="secondary-action" onClick={handleApplyCode} disabled={!code.trim()}>
                Load code
              </button>
            </div>
          </div>
        </details>
      ) : null}
    </section>
  )
}
