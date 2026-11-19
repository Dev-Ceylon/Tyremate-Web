// Web edition: application-wide settings persisted in the AppSettings table.
const repo = require("../repositories/appSettingsRepository")

const CLOUDINARY_KEYS = {
  cloudName: "cloudinary.cloudName",
  uploadPreset: "cloudinary.uploadPreset",
  folder: "cloudinary.folder",
}

const RECEIPT_MASTER_KEY = "receipts.masterKey"

function trimOrEmpty(value) {
  return typeof value === "string" ? value.trim() : ""
}

exports.getCloudinaryConfig = () => {
  const cloudName = repo.get(CLOUDINARY_KEYS.cloudName) || ""
  const uploadPreset = repo.get(CLOUDINARY_KEYS.uploadPreset) || ""
  const folder = repo.get(CLOUDINARY_KEYS.folder) || "tyremate/receipts"
  return { cloudName, uploadPreset, folder, configured: Boolean(cloudName && uploadPreset) }
}

exports.setCloudinaryConfig = (config = {}, ctx = {}) => {
  const cloudName = trimOrEmpty(config.cloudName)
  const uploadPreset = trimOrEmpty(config.uploadPreset)
  const folder = trimOrEmpty(config.folder) || "tyremate/receipts"
  if (cloudName && !/^[a-z0-9_-]+$/i.test(cloudName)) {
    throw new Error("Cloud name may only contain letters, numbers, '-' and '_'")
  }
  if (uploadPreset && !/^[a-z0-9_-]+$/i.test(uploadPreset)) {
    throw new Error("Upload preset may only contain letters, numbers, '-' and '_'")
  }
  if (!/^[a-z0-9_\-/]+$/i.test(folder)) {
    throw new Error("Folder may only contain letters, numbers, '-', '_' and '/'")
  }
  const by = ctx && ctx.changedBy ? String(ctx.changedBy) : null
  repo.set(CLOUDINARY_KEYS.cloudName, cloudName, by)
  repo.set(CLOUDINARY_KEYS.uploadPreset, uploadPreset, by)
  repo.set(CLOUDINARY_KEYS.folder, folder, by)
  return exports.getCloudinaryConfig()
}

/**
 * Returns the base64 AES-256 master key used to wrap per-receipt data keys,
 * creating it on first use. Lives in the database so all connected browsers
 * can read receipts uploaded by any of them.
 */
exports.getOrCreateReceiptMasterKey = () => {
  const existing = repo.get(RECEIPT_MASTER_KEY)
  if (existing) return existing
  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  let binary = ""
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  repo.insertIfMissing(RECEIPT_MASTER_KEY, btoa(binary))
  return repo.get(RECEIPT_MASTER_KEY)
}
