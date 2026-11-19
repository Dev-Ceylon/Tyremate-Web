const { dialog } = require("electron")
const paymentReceiptService = require("../services/PaymentReceiptService")
const paymentAttachmentService = require("../../../packages/services/paymentAttachmentService")
const { registerIpcHandler } = require("./errorMiddleware")

const FILE_FILTER = [
  { name: "Receipts", extensions: ["jpg", "jpeg", "png", "webp", "pdf"] },
]

// Opens a native file picker, encrypts & stores the chosen receipt, and returns
// both the persisted metadata (to save on the payment row) and a preview.
registerIpcHandler("paymentReceipt:choose", {}, async (_event) => {
  const result = await dialog.showOpenDialog({
    title: "Select payment receipt",
    properties: ["openFile"],
    filters: FILE_FILTER,
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const meta = await paymentReceiptService.saveReceiptFromPath(result.filePaths[0])
  const previewDataUrl = await paymentReceiptService.readReceipt(meta)

  return { ...meta, previewDataUrl }
})

// Opens a native multi-select file picker, encrypts & stores each chosen
// receipt, and returns the array of { metadata, preview } for each file.
registerIpcHandler("paymentReceipt:chooseMultiple", {}, async (_event) => {
  const result = await dialog.showOpenDialog({
    title: "Select payment receipts",
    properties: ["openFile", "multiSelections"],
    filters: FILE_FILTER,
  })

  if (result.canceled || result.filePaths.length === 0) {
    return []
  }

  const saved = []
  for (const filePath of result.filePaths) {
    const meta = await paymentReceiptService.saveReceiptFromPath(filePath)
    const previewDataUrl = await paymentReceiptService.readReceipt(meta)
    saved.push({ ...meta, previewDataUrl })
  }
  return saved
})

// Encrypts & stores a receipt file from a given filesystem path (drag-and-drop flow).
registerIpcHandler("paymentReceipt:saveFromPath", {}, async (_event, sourcePath) => {
  if (typeof sourcePath !== "string" || sourcePath.trim() === "") {
    throw new Error("A valid file path is required")
  }

  const meta = await paymentReceiptService.saveReceiptFromPath(sourcePath)
  const previewDataUrl = await paymentReceiptService.readReceipt(meta)

  return { ...meta, previewDataUrl }
})

// Decrypts a stored receipt and returns a data URL for display.
registerIpcHandler("paymentReceipt:read", {}, async (_event, receiptMeta) => {
  return {
    dataUrl: await paymentReceiptService.readReceipt(receiptMeta),
  }
})

// Decrypts a stored receipt, writes it to a temp file, and opens it in the
// default application (PDFs open in the default browser/pdf viewer).
registerIpcHandler("paymentReceipt:open", {}, async (_event, receiptMeta) => {
  return paymentReceiptService.openReceipt(receiptMeta)
})

// Removes an encrypted receipt file.
registerIpcHandler("paymentReceipt:delete", {}, (_event, receiptMeta) => {
  paymentReceiptService.deleteReceipt(receiptMeta)
  return { success: true }
})

// Attaches encrypted receipt metadata to a persisted payment.
// Cash/Bank Transfer replaces the stored single receipt; Cheque appends rows.
registerIpcHandler("paymentReceipt:attach", { permission: "so.edit" }, (_event, payload) => {
  return paymentAttachmentService.attachPaymentReceipts(payload)
})

// Removes a single stored receipt from a cheque payment (row + encrypted file).
registerIpcHandler("paymentReceipt:remove", { permission: "so.edit" }, (_event, payload) => {
  return paymentAttachmentService.removePaymentReceipt(payload)
})
