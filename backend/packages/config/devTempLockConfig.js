// Development-only time lock. Enable this in code only for temporary/demo builds.
// The first launch while enabled starts the 14-day period for this database.
const DEV_TEMP_LOCK_ENABLED = false
const DEV_TEMP_LOCK_DURATION_DAYS = 14

module.exports = { DEV_TEMP_LOCK_ENABLED, DEV_TEMP_LOCK_DURATION_DAYS }
