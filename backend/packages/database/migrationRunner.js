// Web edition of the migration runner. Migrations are bundled at build time
// (scripts/prepare.mjs) as [{ name, sql }] instead of being read from disk.
// Semantics match the desktop runner: files apply in name order, each inside
// its own transaction, and are recorded in schema_migrations.

const ensureMigrationsTable = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

const getAppliedMigrations = (db) => {
  ensureMigrationsTable(db)
  return new Set(db.prepare("SELECT filename FROM schema_migrations").all().map((row) => row.filename))
}

const getMigrationStatus = (db, migrations) => {
  const applied = getAppliedMigrations(db)
  return [...migrations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => ({ name: m.name, applied: applied.has(m.name) }))
}

const applyPendingMigrations = (db, migrations) => {
  // One round trip to learn what is applied (important for remote databases).
  const alreadyApplied = getAppliedMigrations(db)
  const markMigrationApplied = db.prepare(`
    INSERT INTO schema_migrations (filename)
    VALUES (?)
  `)

  const applied = []
  const failed = []

  ;[...migrations]
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .forEach(({ name, sql }) => {
      if (alreadyApplied.has(name)) return
      try {
        const applyMigration = db.transaction(() => {
          db.exec(sql)
          markMigrationApplied.run(name)
        })
        applyMigration()
        applied.push(name)
      } catch (error) {
        console.error(`Failed to apply migration ${name}`, error)
        failed.push({ name, error: error && error.message ? error.message : String(error) })
      }
    })

  return { applied, failed }
}

// Repeatable migrations: the desktop runner blanked the file after a clean
// run. Bundled files are immutable, so we record a content hash instead.
const hashText = (text) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

const runRepeatableMigrations = (db, migrations) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_repeatable_migrations (
      filename TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (filename, content_hash)
    );
  `)
  const results = []

  migrations.forEach(({ name, sql: raw }) => {
    const sql = (raw || "").trim()
    if (!sql) return
    const contentHash = hashText(sql)
    const done = db
      .prepare("SELECT 1 FROM schema_repeatable_migrations WHERE filename = ? AND content_hash = ?")
      .get(name, contentHash)
    if (done) return

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)

    let allApplied = true
    for (const statement of statements) {
      try {
        db.exec(statement)
      } catch (err) {
        const message = err && err.message ? err.message : String(err)
        if (message.includes("duplicate column name")) continue
        allApplied = false
        console.error(`Repeatable statement FAILED (${name}): ${message}`)
      }
    }

    if (allApplied) {
      db.prepare("INSERT OR IGNORE INTO schema_repeatable_migrations (filename, content_hash) VALUES (?, ?)").run(
        name,
        contentHash,
      )
    }
    results.push({ name, applied: allApplied })
  })

  return results
}

module.exports = { applyPendingMigrations, runRepeatableMigrations, getMigrationStatus }
