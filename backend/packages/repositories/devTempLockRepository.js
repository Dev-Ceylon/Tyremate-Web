const db = require("../database/connection")

exports.get = () => db.prepare("SELECT * FROM DevTempLock WHERE Id = 1").get()

exports.initialize = ({ firstStartedAtUtc, expiresAtUtc }) => {
  db.prepare(`
    INSERT OR IGNORE INTO DevTempLock (Id, FirstStartedAtUtc, ExpiresAtUtc, LockedAtUtc)
    VALUES (1, ?, ?, NULL)
  `).run(firstStartedAtUtc, expiresAtUtc)
  return exports.get()
}

exports.markLocked = (lockedAtUtc) => {
  db.prepare(`
    UPDATE DevTempLock
    SET LockedAtUtc = COALESCE(LockedAtUtc, ?)
    WHERE Id = 1
  `).run(lockedAtUtc)
  return exports.get()
}
