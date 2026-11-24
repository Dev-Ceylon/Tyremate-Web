"use client"
import { useCallback, useEffect, useId, useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { LoadingState } from "../../../shared/ui/progress"
import { adminApi, type SchemaStatus } from "../services/adminClient"

export function SchemaStatusCard() {
  const ids = useId()
  const { showToast } = useToast()
  const [schema, setSchema] = useState<SchemaStatus | null>(null)
  const [counts, setCounts] = useState<{ name: string; rows: number }[] | null>(null)

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([adminApi.getSchemaStatus(), adminApi.getTableCounts()])
      setSchema(s)
      setCounts(c)
    } catch (error) {
      showToast({ variant: "error", title: "Could not read the schema", message: error instanceof Error ? error.message : String(error) })
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const applied = schema?.migrations.filter((m) => m.applied).length ?? 0
  const totalRows = counts?.reduce((n, t) => n + t.rows, 0) ?? 0

  return (
    <section className="panel tm-card" aria-labelledby={`${ids}-title`}>
      <div className="tm-inline" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="eyebrow">Schema</p>
          <h2 id={`${ids}-title`}>Migrations &amp; tables</h2>
          <p className="tm-card-sub">
            Schema migrations run automatically every time the application connects, so a new or empty database is
            ready to use after &ldquo;Save &amp; connect&rdquo;.
          </p>
        </div>
        <button type="button" className="secondary-action" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {schema ? (
        <dl className="tm-kv">
          <dt>Migrations</dt>
          <dd data-testid="schema-migrations">
            {applied} / {schema.migrations.length} applied
            {schema.pending > 0 ? <span className="tm-status tm-status-warn"> {schema.pending} pending</span> : null}
          </dd>
          <dt>Tables</dt>
          <dd>{schema.tables.length}</dd>
          <dt>Rows</dt>
          <dd>{totalRows.toLocaleString()}</dd>
          {schema.lastRun.failed.length > 0 ? (
            <>
              <dt>Failed this start</dt>
              <dd className="error-text">
                {schema.lastRun.failed.map((f) => `${f.name}: ${f.error}`).join("\n")}
              </dd>
            </>
          ) : null}
        </dl>
      ) : (
        <LoadingState message="Loading schema status…" size="sm" />
      )}

      <div className="tm-grid">
        <details>
          <summary>Migrations ({schema?.migrations.length ?? 0})</summary>
          <ul className="tm-note" style={{ columns: "16rem", marginTop: "0.5rem" }}>
            {schema?.migrations.map((m) => (
              <li key={m.name}>
                <span className={`tm-status ${m.applied ? "tm-status-ok" : "tm-status-warn"}`}>{m.name}</span>
              </li>
            ))}
          </ul>
        </details>
        <details>
          <summary>Row counts ({counts?.length ?? 0} tables)</summary>
          <div className="tm-table-wrap">
            <table className="tm-table">
              <thead>
                <tr>
                  <th scope="col">Table</th>
                  <th scope="col" style={{ textAlign: "right" }}>
                    Rows
                  </th>
                </tr>
              </thead>
              <tbody>
                {counts?.map((t) => (
                  <tr key={t.name}>
                    <td className="mono-text">{t.name}</td>
                    <td className="num">{t.rows.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  )
}
