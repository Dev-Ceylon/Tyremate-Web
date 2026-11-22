// Master data seed gate.
//
// Real-life business master data (branches, suppliers, customers, contractors,
// tyres, storage locations, consumable locations and bank accounts) is only
// seeded when this is deliberately enabled. It is opt-in because it is demo /
// sample data and must not pollute a real production database.
//
// Enable via the TM_SEED_MASTER_DATA environment variable ("true" or "1"), or
// temporarily set ENABLE_MASTER_DATA_SEED to true below. The seed only runs
// once; the run is recorded in the seed_runs table so subsequent launches are
// no-ops even while the flag stays enabled.

const ENABLE_MASTER_DATA_SEED =
  process.env.TM_SEED_MASTER_DATA === "true" ||
  process.env.TM_SEED_MASTER_DATA === "1"

// Development only: seeds the sample master data and a small saleable stock
// lot with its fixture DOT for every seeded tyre.
const ENABLE_DEV_MASTER_DATA_FEED =
  process.env.NODE_ENV === "development" &&
  (process.env.TM_DEV_MASTER_DATA_FEED === "true" || process.env.TM_DEV_MASTER_DATA_FEED === "1")

const DEV_MASTER_DATA_STOCK_LOCATION_CODE = "KAN-WHSE"
const DEV_MASTER_DATA_BATTERY_STOCK_LOCATION_CODE = "KAN-BAT"
const DEV_MASTER_DATA_STOCK_QTY = 10

module.exports = {
  ENABLE_MASTER_DATA_SEED,
  ENABLE_DEV_MASTER_DATA_FEED,
  DEV_MASTER_DATA_STOCK_LOCATION_CODE,
  DEV_MASTER_DATA_BATTERY_STOCK_LOCATION_CODE,
  DEV_MASTER_DATA_STOCK_QTY,
}
