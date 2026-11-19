-- Error audit log: every failure that reaches the central logger.
-- No hard FKs (matches audit log convention); rows survive source-record deletion.
-- Source column distinguishes where the error originated: 'main' | 'ipc' | 'renderer'.

CREATE TABLE IF NOT EXISTS ErrorAuditLog (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Channel TEXT,               -- IPC channel or context label ('so:create', 'process:uncaughtException', ...)
  Code TEXT,                  -- VALIDATION | NOT_FOUND | CONFLICT | UNAUTHORIZED | INTERNAL | ERROR | UNKNOWN
  ErrorName TEXT,             -- ConflictError, TypeError, ...
  Message TEXT NOT NULL,      -- client-safe message
  StackTrace TEXT,            -- full backend stack for debugging
  Details TEXT,               -- optional JSON context (never raw credentials)
  Source TEXT NOT NULL DEFAULT 'main',
  ChangedBy TEXT,             -- session user id, fallback "system"
  CreatedDateTime TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_errorauditlog_created ON ErrorAuditLog (CreatedDateTime);
CREATE INDEX IF NOT EXISTS idx_errorauditlog_code ON ErrorAuditLog (Code);
CREATE INDEX IF NOT EXISTS idx_errorauditlog_channel ON ErrorAuditLog (Channel);
