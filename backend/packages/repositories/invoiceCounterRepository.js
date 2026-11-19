const db = require("../database/connection")

// Per-year sequence behind InvoiceNumber (INV-2026-00001). Callers run this
// inside the invoice-creation transaction so the read-then-write stays atomic.
exports.nextInvoiceNumber = (year, prefix = "INV") => {
  const row = db
    .prepare("SELECT LastNumber FROM InvoiceCounter WHERE Year = ?")
    .get(year)

  const next = (row?.LastNumber ?? 0) + 1

  if (row) {
    db.prepare("UPDATE InvoiceCounter SET LastNumber = ? WHERE Year = ?").run(next, year)
  } else {
    db.prepare("INSERT INTO InvoiceCounter (Year, LastNumber) VALUES (?, ?)").run(year, next)
  }

  return `${prefix}-${year}-${String(next).padStart(5, "0")}`
}
