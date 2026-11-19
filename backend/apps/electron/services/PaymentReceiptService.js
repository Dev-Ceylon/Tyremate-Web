/**
 * Web edition of the payment receipt store.
 *
 * Desktop: receipts were AES-256-GCM encrypted and written to the user-data
 * folder, with the master key protected by the OS keychain.
 *
 * Web: receipts are encrypted in the browser with the same envelope scheme
 * (per-file data key wrapped by a master key) and the ciphertext is uploaded to
 * Cloudinary as a raw asset via an unsigned upload preset. The master key lives
 * in the AppSettings table, so any browser connected to the same database can
 * decrypt, while the files on the CDN are useless on their own.
 *
 * The metadata shape stored on payment rows is unchanged:
 *   ReceiptPath        -> Cloudinary secure_url (or "inline:<base64>" fallback)
 *   ReceiptEncIV       -> base64 IV of the file ciphertext
 *   ReceiptEncAuthTag  -> base64 GCM tag of the file ciphertext
 *   ReceiptEncKey      -> base64 (masterIv | keyTag | wrappedDataKey)
 */
const { getFile, getHost } = require("../../../platform/runtime")
const appSettingsService = require("../../../packages/services/appSettingsService")

const KEY_LENGTH = 32 // AES-256
const IV_LENGTH = 12 // GCM recommended nonce
const TAG_LENGTH = 16
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const INLINE_PREFIX = "inline:"

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"])
const MIME_BY_EXTENSION = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
}

const subtle = () => globalThis.crypto.subtle

function toBase64(bytes) {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function fromBase64(b64) {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

function randomBytes(n) {
  const bytes = new Uint8Array(n)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

function extname(name) {
  const clean = String(name || "").replace(/\.enc$/i, "")
  const idx = clean.lastIndexOf(".")
  return idx === -1 ? "" : clean.slice(idx).toLowerCase()
}

async function importKey(raw) {
  return subtle().importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
}

/** AES-GCM encrypt; returns { ciphertext, tag } like Node's cipher API. */
async function gcmEncrypt(keyBytes, iv, plaintext) {
  const key = await importKey(keyBytes)
  const out = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, plaintext))
  return { ciphertext: out.subarray(0, out.length - TAG_LENGTH), tag: out.subarray(out.length - TAG_LENGTH) }
}

async function gcmDecrypt(keyBytes, iv, ciphertext, tag) {
  const key = await importKey(keyBytes)
  const out = await subtle().decrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, concat(ciphertext, tag))
  return new Uint8Array(out)
}

function getMasterKey() {
  return fromBase64(appSettingsService.getOrCreateReceiptMasterKey())
}

function resolveFile(sourcePath) {
  const file = getFile(sourcePath)
  if (!file) {
    throw new Error("The selected file is no longer available. Please choose it again.")
  }
  return file
}

function assertValidFile(file) {
  const ext = extname(file.name)
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported file type "${ext}". Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("File is too large (max 5 MB)")
  }
  return ext
}

async function uploadToCloudinary(ciphertext, fileName, config) {
  const form = new FormData()
  form.append("file", new Blob([ciphertext], { type: "application/octet-stream" }), fileName)
  form.append("upload_preset", config.uploadPreset)
  form.append("folder", config.folder)
  form.append("tags", "tyremate,receipt")

  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/raw/upload`
  let response
  try {
    response = await fetch(url, { method: "POST", body: form })
  } catch (error) {
    throw new Error(`Could not reach Cloudinary: ${error.message || error}`)
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.secure_url) {
    const reason = (body && body.error && body.error.message) || `HTTP ${response.status}`
    throw new Error(`Cloudinary upload failed: ${reason}`)
  }
  return body
}

/**
 * Encrypts a chosen receipt file and stores it on Cloudinary.
 * Returns the metadata to persist on the CashPayments / BankTransferPayments row.
 */
async function saveReceiptFromPath(sourcePath) {
  const file = resolveFile(sourcePath)
  const ext = assertValidFile(file)
  const plaintext = new Uint8Array(await file.arrayBuffer())
  const masterKey = getMasterKey()

  // Per-file data key + IV (independent of the master key).
  const dataKey = randomBytes(KEY_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const { ciphertext, tag } = await gcmEncrypt(dataKey, iv, plaintext)

  // Wrap the data key with the master key.
  const masterIv = randomBytes(IV_LENGTH)
  const wrapped = await gcmEncrypt(masterKey, masterIv, dataKey)
  const wrappedKey = concat(masterIv, wrapped.tag, wrapped.ciphertext)

  const config = appSettingsService.getCloudinaryConfig()
  const storedName = `${globalThis.crypto.randomUUID()}${ext}.enc`
  let receiptPath
  if (config.configured) {
    const uploaded = await uploadToCloudinary(ciphertext, storedName, config)
    receiptPath = uploaded.secure_url
  } else {
    // Fallback so the app still works before Cloudinary is configured.
    receiptPath = `${INLINE_PREFIX}${ext}:${toBase64(ciphertext)}`
  }

  return {
    ReceiptPath: receiptPath,
    ReceiptEncIV: toBase64(iv),
    ReceiptEncAuthTag: toBase64(tag),
    ReceiptEncKey: toBase64(wrappedKey),
    OriginalFileName: file.name,
  }
}

async function loadCiphertext(receiptPath) {
  if (receiptPath.startsWith(INLINE_PREFIX)) {
    const rest = receiptPath.slice(INLINE_PREFIX.length)
    const sep = rest.indexOf(":")
    return { bytes: fromBase64(rest.slice(sep + 1)), ext: rest.slice(0, sep) }
  }
  if (/^https:\/\//i.test(receiptPath)) {
    const response = await fetch(receiptPath)
    if (!response.ok) throw new Error(`Could not download the receipt (HTTP ${response.status})`)
    return { bytes: new Uint8Array(await response.arrayBuffer()), ext: extname(receiptPath) }
  }
  throw new Error("This receipt was stored on a desktop installation and is not available in the web app")
}

/**
 * Validates the metadata and decrypts a stored receipt back to its plaintext.
 */
async function decryptReceipt(receiptMeta) {
  if (!receiptMeta || !receiptMeta.ReceiptPath || !receiptMeta.ReceiptEncIV ||
      !receiptMeta.ReceiptEncAuthTag || !receiptMeta.ReceiptEncKey) {
    throw new Error("Receipt metadata is incomplete")
  }

  const { bytes: ciphertext, ext } = await loadCiphertext(receiptMeta.ReceiptPath)
  const masterKey = getMasterKey()

  const wrappedKey = fromBase64(receiptMeta.ReceiptEncKey)
  const masterIv = wrappedKey.subarray(0, IV_LENGTH)
  const keyAuthTag = wrappedKey.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const keyCiphertext = wrappedKey.subarray(IV_LENGTH + TAG_LENGTH)

  let plaintext
  try {
    const dataKey = await gcmDecrypt(masterKey, masterIv, keyCiphertext, keyAuthTag)
    plaintext = await gcmDecrypt(
      dataKey,
      fromBase64(receiptMeta.ReceiptEncIV),
      ciphertext,
      fromBase64(receiptMeta.ReceiptEncAuthTag),
    )
  } catch {
    throw new Error("Unable to decrypt the receipt (the encryption key does not match)")
  }

  const mime = MIME_BY_EXTENSION[ext] || "application/octet-stream"
  return { plaintext, ext, mime }
}

/** Decrypts a stored receipt and returns it as a data URL for display. */
async function readReceipt(receiptMeta) {
  const { plaintext, mime } = await decryptReceipt(receiptMeta)
  return `data:${mime};base64,${toBase64(plaintext)}`
}

/** Decrypts a stored receipt and opens it in a new browser tab. */
async function openReceipt(receiptMeta) {
  const { plaintext, mime } = await decryptReceipt(receiptMeta)
  await getHost().requestMain("openBlob", { bytes: plaintext, mime, name: receiptMeta.OriginalFileName || "receipt" })
  return { success: true, filePath: receiptMeta.OriginalFileName || "receipt" }
}

/**
 * Cloudinary deletions need the API secret, which must never ship to a static
 * site. Encrypted blobs left behind are unreadable without the master key and
 * are tagged "tyremate,receipt" for periodic clean-up from the Cloudinary
 * console. Inline receipts disappear with their row.
 */
function deleteReceipt() {}

module.exports = {
  saveReceiptFromPath,
  readReceipt,
  openReceipt,
  deleteReceipt,
  decryptReceipt,
  MAX_IMAGE_BYTES,
}
