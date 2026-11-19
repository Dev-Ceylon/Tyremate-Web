import { afterEach, describe, expect, it, vi } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new TextEncoder().encode("RECEIPT-PIXELS-SECRET")])

afterEach(() => {
  vi.unstubAllGlobals()
})

async function boot() {
  resetBackendModules()
  const backend = await bootBackend(await createSqlJsDriver())
  await backend.login()
  return backend
}

function registerFile(backend: Awaited<ReturnType<typeof boot>>, name: string, bytes: Uint8Array, type = "image/png") {
  const token = `webfile:test/${name}`
  backend.runtime.registerFile(token, new File([bytes], name, { type }))
  return token
}

describe("payment receipts", () => {
  it("encrypts in the browser and uploads ciphertext to Cloudinary", async () => {
    const backend = await boot()
    await backend.invoke("admin:setCloudinaryConfig", { cloudName: "demo-cloud", uploadPreset: "tm_unsigned", folder: "tyremate/receipts" })

    const stored = new Map<string, Uint8Array>()
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.startsWith("https://api.cloudinary.com/")) {
        const form = init!.body as FormData
        const file = form.get("file") as File
        const bytes = new Uint8Array(await file.arrayBuffer())
        const secureUrl = `https://res.cloudinary.com/demo-cloud/raw/upload/v1/tyremate/receipts/${file.name}`
        stored.set(secureUrl, bytes)
        return new Response(JSON.stringify({ secure_url: secureUrl, public_id: file.name }), { status: 200 })
      }
      const bytes = stored.get(url)
      return bytes ? new Response(bytes, { status: 200 }) : new Response("nope", { status: 404 })
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await backend.invoke("paymentReceipt:saveFromPath", registerFile(backend, "slip.png", PNG))
    expect(result.ReceiptPath).toMatch(/^https:\/\/res\.cloudinary\.com\/demo-cloud\/raw\/upload\/.+\.png\.enc$/)
    expect(result.OriginalFileName).toBe("slip.png")
    expect(result.previewDataUrl).toBe(`data:image/png;base64,${Buffer.from(PNG).toString("base64")}`)

    // Upload went to the unsigned preset and folder, as ciphertext only.
    const [uploadUrl, uploadInit] = fetchMock.mock.calls[0]
    expect(uploadUrl).toBe("https://api.cloudinary.com/v1_1/demo-cloud/raw/upload")
    const form = uploadInit!.body as FormData
    expect(form.get("upload_preset")).toBe("tm_unsigned")
    expect(form.get("folder")).toBe("tyremate/receipts")
    expect(form.get("api_secret")).toBeNull()
    const cipher = [...stored.values()][0]
    expect(Buffer.from(cipher).includes(Buffer.from("RECEIPT-PIXELS-SECRET"))).toBe(false)

    // Reading downloads and decrypts.
    const { previewDataUrl: _ignored, ...meta } = result
    const read = await backend.invoke("paymentReceipt:read", meta)
    expect(read.dataUrl).toBe(result.previewDataUrl)

    // Tampering with the ciphertext is detected (AES-GCM authentication).
    const url = [...stored.keys()][0]
    const tampered = new Uint8Array(stored.get(url)!)
    tampered[0] ^= 0xff
    stored.set(url, tampered)
    await expect(backend.invoke("paymentReceipt:read", meta)).rejects.toThrow(/Unable to decrypt/)
  })

  it("falls back to encrypted in-database storage when Cloudinary is not configured", async () => {
    const backend = await boot()
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const result = await backend.invoke("paymentReceipt:saveFromPath", registerFile(backend, "slip.pdf", PNG, "application/pdf"))
    expect(result.ReceiptPath.startsWith("inline:.pdf:")).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    const { previewDataUrl, ...meta } = result
    expect(previewDataUrl.startsWith("data:application/pdf;base64,")).toBe(true)
    expect((await backend.invoke("paymentReceipt:read", meta)).dataUrl).toBe(previewDataUrl)
  })

  it("rejects unsupported and oversized files like the desktop app", async () => {
    const backend = await boot()
    await expect(backend.invoke("paymentReceipt:saveFromPath", registerFile(backend, "virus.exe", PNG))).rejects.toThrow(/Unsupported file type/)
    const big = new Uint8Array(5 * 1024 * 1024 + 1)
    await expect(backend.invoke("paymentReceipt:saveFromPath", registerFile(backend, "big.png", big))).rejects.toThrow(/too large/)
    await expect(backend.invoke("paymentReceipt:saveFromPath", "webfile:missing")).rejects.toThrow(/no longer available/)
  })

  it("only settings managers may change Cloudinary settings, and inputs are validated", async () => {
    const backend = await boot()
    await expect(backend.invoke("admin:setCloudinaryConfig", { cloudName: "bad name!", uploadPreset: "x" })).rejects.toThrow(/Cloud name/)
    await backend.invoke("admin:createUser", { username: "cash1", password: "secret1", roleIds: [3] })
    await backend.invoke("auth:clearUser")
    await backend.invoke("auth-login", { username: "cash1", password: "secret1" })
    await expect(backend.invoke("admin:setCloudinaryConfig", { cloudName: "x", uploadPreset: "y" })).rejects.toThrow(/do not have permission.*\(settings\.manage\)/)
    expect((await backend.invoke("admin:getCloudinaryConfig")).configured).toBe(false)
  })
})
