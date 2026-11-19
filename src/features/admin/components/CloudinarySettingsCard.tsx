"use client"
import { useEffect, useId, useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { cloudinaryCloudName } from "../../../shell/web/assets"
import { adminApi, type CloudinaryConfig } from "../services/adminClient"

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Cloudinary stores payment receipts (encrypted in the browser before upload).
 * Settings live in the database so every device connected to it shares them.
 */
export function CloudinarySettingsCard() {
  const ids = useId()
  const { showToast } = useToast()
  const [config, setConfig] = useState<CloudinaryConfig | null>(null)
  const [cloudName, setCloudName] = useState("")
  const [uploadPreset, setUploadPreset] = useState("")
  const [folder, setFolder] = useState("tyremate/receipts")
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    adminApi
      .getCloudinaryConfig()
      .then((c) => {
        setConfig(c)
        setCloudName(c.cloudName || cloudinaryCloudName)
        setUploadPreset(c.uploadPreset)
        setFolder(c.folder)
      })
      .catch((error) => showToast({ variant: "error", title: "Could not load settings", message: errorText(error) }))
  }, [showToast])

  const save = async () => {
    setSaving(true)
    try {
      const next = await adminApi.setCloudinaryConfig({ cloudName, uploadPreset, folder })
      setConfig(next)
      showToast({
        variant: "success",
        title: "Cloudinary settings saved",
        message: next.configured ? "New receipts will be uploaded to Cloudinary." : "Receipts will be stored in the database until Cloudinary is configured.",
      })
    } catch (error) {
      showToast({ variant: "error", title: "Save failed", message: errorText(error) })
    } finally {
      setSaving(false)
    }
  }

  /** Uploads a 1x1 test file with the unsigned preset to prove the settings work. */
  const testUpload = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const form = new FormData()
      form.append("file", new Blob(["tyremate-connection-test"], { type: "text/plain" }), "tyremate-test.txt")
      form.append("upload_preset", uploadPreset.trim())
      form.append("folder", `${folder.trim() || "tyremate/receipts"}/_tests`)
      form.append("tags", "tyremate,connection-test")
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName.trim())}/raw/upload`, {
        method: "POST",
        body: form,
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error?.message ?? `HTTP ${response.status}`)
      setTestResult({ ok: true, text: `Upload succeeded: ${body.secure_url}` })
    } catch (error) {
      setTestResult({ ok: false, text: `Upload failed: ${errorText(error)}` })
    } finally {
      setTesting(false)
    }
  }

  return (
    <section className="panel tm-card" aria-labelledby={`${ids}-title`}>
      <div>
        <p className="eyebrow">File storage</p>
        <h2 id={`${ids}-title`}>Cloudinary</h2>
        <p className="tm-card-sub">
          Payment receipts (images and PDFs) are encrypted in the browser with AES-256-GCM and uploaded to your
          Cloudinary account. The encryption key is kept in the database, so the files on the CDN cannot be read on
          their own. Brand images and the user manual screenshots are also served from Cloudinary.
        </p>
      </div>

      <dl className="tm-kv">
        <dt>Receipt storage</dt>
        <dd>
          {config === null ? (
            "Loading…"
          ) : config.configured ? (
            <span className="tm-status tm-status-ok">Cloudinary ({config.cloudName})</span>
          ) : (
            <span className="tm-status tm-status-warn">In the database (Cloudinary not configured)</span>
          )}
        </dd>
        <dt>Static assets</dt>
        <dd>{cloudinaryCloudName ? `Cloudinary (${cloudinaryCloudName})` : "Bundled with the site"}</dd>
      </dl>

      <div className="tm-grid">
        <div className="tm-form-row">
          <label className="field-label" htmlFor={`${ids}-cloud`}>
            Cloud name
          </label>
          <input
            id={`${ids}-cloud`}
            className="text-input"
            value={cloudName}
            spellCheck={false}
            onChange={(e) => setCloudName(e.target.value)}
          />
        </div>
        <div className="tm-form-row">
          <label className="field-label" htmlFor={`${ids}-preset`}>
            Unsigned upload preset
          </label>
          <input
            id={`${ids}-preset`}
            className="text-input"
            value={uploadPreset}
            placeholder="e.g. tyremate_receipts"
            spellCheck={false}
            onChange={(e) => setUploadPreset(e.target.value)}
          />
        </div>
        <div className="tm-form-row">
          <label className="field-label" htmlFor={`${ids}-folder`}>
            Folder
          </label>
          <input
            id={`${ids}-folder`}
            className="text-input"
            value={folder}
            spellCheck={false}
            onChange={(e) => setFolder(e.target.value)}
          />
        </div>
      </div>

      <details>
        <summary>How to create an unsigned upload preset</summary>
        <ol className="tm-note" style={{ marginTop: "0.5rem" }}>
          <li>Open the Cloudinary console → Settings → Upload → Upload presets → Add upload preset.</li>
          <li>Set <strong>Signing mode</strong> to <em>Unsigned</em> and the folder to the value above.</li>
          <li>Recommended: allowed formats empty, &ldquo;Use filename&rdquo; off, &ldquo;Unique filename&rdquo; on.</li>
          <li>Save, then enter the preset name here. The API secret is never needed (or stored) by this app.</li>
        </ol>
      </details>

      <div className="tm-inline">
        <button type="button" className="primary-action" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={testUpload}
          disabled={testing || !cloudName.trim() || !uploadPreset.trim()}
        >
          {testing ? "Testing…" : "Test upload"}
        </button>
      </div>
      {testResult ? (
        <p className={`tm-message ${testResult.ok ? "tm-message-ok" : "tm-message-error"}`} role="status">
          {testResult.text}
        </p>
      ) : null}
    </section>
  )
}
