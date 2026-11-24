"use client"
import { useId, useRef, useState } from "react"
import { useConfirm } from "../../../shared/ui/confirm/ConfirmProvider"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { useBackendStatus } from "../../../shell/web/useBackendStatus"
import {
  adminApi,
  databaseConfig,
  databaseMaintenance,
  downloadBytes,
  timestampForFile,
} from "../services/adminClient"

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/** Backups, restore, copying data between databases, seeding and reset. */
export function DatabaseMaintenanceCard() {
  const ids = useId()
  const status = useBackendStatus()
  const confirm = useConfirm()
  const { showToast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [targetUrl, setTargetUrl] = useState("")
  const [targetToken, setTargetToken] = useState("")
  const [overwrite, setOverwrite] = useState(false)
  const isDev = process.env.NODE_ENV === "development"
  const [includeStock, setIncludeStock] = useState(true)

  const driver = status.state === "ready" || status.state === "starting" || status.state === "error" ? status.config.driver : "local"

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    try {
      await fn()
    } catch (error) {
      showToast({ variant: "error", title: `${label} failed`, message: errorText(error) })
    } finally {
      setBusy(null)
    }
  }

  const backupSqlite = () =>
    run("Backup", async () => {
      const bytes = await databaseMaintenance.exportDatabase()
      downloadBytes(bytes, `tyremate-${timestampForFile()}.sqlite`, "application/vnd.sqlite3")
      showToast({ variant: "success", title: "Backup ready", message: `${(bytes.byteLength / 1024).toFixed(0)} KB downloaded.` })
    })

  const backupSql = () =>
    run("SQL export", async () => {
      const sql = await databaseMaintenance.exportSql()
      downloadBytes(sql, `tyremate-${timestampForFile()}.sql`, "application/sql")
      showToast({ variant: "success", title: "SQL export ready", message: "Plain SQL dump downloaded." })
    })

  const restore = async (file: File) => {
    const ok = await confirm({
      title: "Restore database?",
      message: `Every record in the current database will be replaced with the contents of "${file.name}". This cannot be undone - download a backup first if unsure.`,
      confirmLabel: "Replace database",
      danger: true,
    })
    if (!ok) return
    await run("Restore", async () => {
      const bytes = new Uint8Array(await file.arrayBuffer())
      await databaseMaintenance.importDatabase(bytes)
      showToast({ variant: "success", title: "Database restored", message: "Please sign in again." })
      await databaseMaintenance.restart()
    })
  }

  const pushToRemote = async () => {
    let target
    try {
      target = databaseConfig.validate({ driver: "libsql", url: targetUrl.trim(), authToken: targetToken.trim() || undefined })
    } catch (error) {
      showToast({ variant: "error", title: "Invalid target", message: errorText(error) })
      return
    }
    const ok = await confirm({
      title: "Copy data to the remote database?",
      message: overwrite
        ? "All tables in the remote database will be DROPPED and replaced by this browser's data."
        : "This browser's data will be copied into the (empty) remote database.",
      confirmLabel: "Copy data",
      danger: overwrite,
    })
    if (!ok) return
    await run("Copy", async () => {
      const result = await databaseMaintenance.copyTo(target, overwrite)
      showToast({ variant: "success", title: "Data copied", message: `${result.tables} tables, ${result.rows} rows.` })
      const switchNow = await confirm({
        title: "Switch to the remote database?",
        message: "The copy is complete. Connect this browser to the remote database now? You will need to sign in again.",
        confirmLabel: "Switch now",
      })
      if (switchNow) await databaseConfig.apply(target)
    })
  }

  const pullToLocal = async () => {
    const ok = await confirm({
      title: "Copy the shared database into this browser?",
      message: "This replaces the local database stored in this browser with a copy of the remote data. The remote database is not changed.",
      confirmLabel: "Copy to this browser",
      danger: true,
    })
    if (!ok) return
    await run("Copy", async () => {
      const result = await databaseMaintenance.copyTo({ driver: "local" }, true)
      showToast({ variant: "success", title: "Local copy created", message: `${result.tables} tables, ${result.rows} rows.` })
    })
  }

  const resetLocal = async () => {
    const ok = await confirm({
      title: "Erase the local database?",
      message: "All TyreMate data stored in this browser will be deleted and a fresh database created. This cannot be undone.",
      confirmLabel: "Erase local data",
      danger: true,
    })
    if (!ok) return
    await run("Reset", async () => {
      await databaseMaintenance.resetLocal()
      await databaseMaintenance.restart()
    })
  }

  const reseed = () =>
    run("Seed", async () => {
      const result = await databaseMaintenance.reseed()
      showToast({ variant: "success", title: "Lookup data refreshed", message: `Seed version ${result.version}` })
    })

  const sampleData = async () => {
    const ok = await confirm({
      title: "Load sample master data?",
      message:
        "Adds demo branches, suppliers, customers, contractors, tyres, batteries, storage locations, battery locations, and bank accounts" +
        (includeStock ? ", plus opening stock for tyres and batteries." : ".") +
        " Intended for training/demo databases.",
      confirmLabel: "Load sample data",
    })
    if (!ok) return
    await run("Sample data", async () => {
      const result = await adminApi.seedSampleData({ includeStock })
      const masterStats = result?.master?.stats
      const stockStats = result?.stock?.stats
      const masterAdded = masterStats
        ? Object.values(masterStats).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0)
        : 0
      const stockQty = stockStats?.stockQty ?? 0

      if (masterAdded > 0 || stockQty > 0) {
        const parts: string[] = []
        if (masterAdded > 0) parts.push(`${masterAdded} master records`)
        if (stockQty > 0) parts.push(`${stockQty} units of stock`)
        showToast({
          variant: "success",
          title: "Sample data loaded",
          message: `Successfully seeded ${parts.join(" and ")}.`,
        })
      } else {
        showToast({
          variant: "info",
          title: "Sample data up to date",
          message: "All sample master records and opening stock are already loaded.",
        })
      }
    })
  }

  return (
    <section className="panel tm-card" aria-labelledby={`${ids}-title`}>
      <div>
        <p className="eyebrow">Maintenance</p>
        <h2 id={`${ids}-title`}>Backup, restore and move data</h2>
        <p className="tm-card-sub">
          Backups are standard SQLite files that open in any SQLite tool and can be restored into either database type.
        </p>
      </div>

      <div className="tm-grid">
        <div className="tm-form">
          <h3>Backup</h3>
          <div className="tm-inline">
            <button type="button" className="primary-action" onClick={backupSqlite} disabled={busy !== null}>
              {busy === "Backup" ? "Preparing…" : "Download .sqlite backup"}
            </button>
            <button type="button" className="secondary-action" onClick={backupSql} disabled={busy !== null}>
              Export .sql
            </button>
          </div>
          <h3>Restore</h3>
          <p className="tm-note">Replace the current database with a TyreMate .sqlite backup (desktop app databases work too).</p>
          <input
            ref={fileInput}
            type="file"
            accept=".sqlite,.sqlite3,.db,application/vnd.sqlite3,application/x-sqlite3"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (file) void restore(file)
            }}
          />
          <div className="tm-inline">
            <button type="button" className="secondary-action" onClick={() => fileInput.current?.click()} disabled={busy !== null}>
              {busy === "Restore" ? "Restoring…" : "Restore from file…"}
            </button>
          </div>
        </div>

        <div className="tm-form">
          <div className="tm-form-header">
            <h3>Lookup &amp; sample data</h3>
            {isDev ? <span className="stat-badge tm-dev-badge">Dev Mode</span> : null}
          </div>
          <p className="tm-note">Statuses, payment types, roles and permissions are seeded automatically. Re-run if they look incomplete.</p>
          <div className="tm-inline">
            <button type="button" className="secondary-action" onClick={reseed} disabled={busy !== null}>
              {busy === "Seed" ? "Seeding…" : "Re-run lookup seed"}
            </button>
          </div>
          <div className="tm-sample-data-box">
            <label className="tm-inline">
              <input type="checkbox" checked={includeStock} onChange={(e) => setIncludeStock(e.target.checked)} />
              <span>Include opening stock (tyres &amp; batteries)</span>
            </label>
            <p className="tm-note">
              Populates master records (branches, suppliers, customers, contractors, tyres, batteries, locations, bank accounts)
              {includeStock ? " and 10 units of opening stock for each product in Kandy stores." : "."}
            </p>
            <div className="tm-inline">
              <button
                type="button"
                className={isDev ? "primary-action" : "secondary-action"}
                aria-label="Load sample master data"
                onClick={sampleData}
                disabled={busy !== null}
              >
                {busy === "Sample data"
                  ? "Loading sample data…"
                  : includeStock
                    ? "Load sample master data & stock"
                    : "Load sample master data"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {driver === "local" ? (
        <div className="tm-form">
          <h3>Move to a shared database</h3>
          <p className="tm-note">
            Copy everything in this browser to a Turso/libSQL database, then switch to it so other devices can join.
          </p>
          <div className="tm-grid">
            <div className="tm-form-row">
              <label className="field-label" htmlFor={`${ids}-turl`}>
                Target database URL
              </label>
              <input
                id={`${ids}-turl`}
                className="text-input"
                value={targetUrl}
                placeholder="libsql://tyremate-yourorg.turso.io"
                spellCheck={false}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>
            <div className="tm-form-row">
              <label className="field-label" htmlFor={`${ids}-ttoken`}>
                Target auth token
              </label>
              <input
                id={`${ids}-ttoken`}
                className="text-input"
                type="password"
                value={targetToken}
                autoComplete="off"
                onChange={(e) => setTargetToken(e.target.value)}
              />
            </div>
          </div>
          <label className="tm-inline">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            <span>Overwrite the target if it already contains tables</span>
          </label>
          <div className="tm-inline">
            <button type="button" className="secondary-action" onClick={pushToRemote} disabled={busy !== null || !targetUrl.trim()}>
              {busy === "Copy" ? "Copying…" : "Copy data to remote database"}
            </button>
          </div>
        </div>
      ) : (
        <div className="tm-form">
          <h3>Offline copy</h3>
          <p className="tm-note">Copy the shared database into this browser (e.g. before working offline or for training).</p>
          <div className="tm-inline">
            <button type="button" className="secondary-action" onClick={pullToLocal} disabled={busy !== null}>
              {busy === "Copy" ? "Copying…" : "Copy to this browser"}
            </button>
          </div>
        </div>
      )}

      {driver === "local" ? (
        <div className="tm-danger-zone">
          <h3>Danger zone</h3>
          <p className="tm-note">Erase the database stored in this browser and start again from an empty database.</p>
          <div className="tm-inline">
            <button type="button" className="danger-action" onClick={resetLocal} disabled={busy !== null}>
              Erase local database
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
