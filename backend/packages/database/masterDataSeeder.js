const db = require("./connection")
const {
  ENABLE_MASTER_DATA_SEED,
  ENABLE_DEV_MASTER_DATA_FEED,
  DEV_MASTER_DATA_STOCK_LOCATION_CODE,
  DEV_MASTER_DATA_BATTERY_STOCK_LOCATION_CODE,
  DEV_MASTER_DATA_STOCK_QTY,
} = require("../config/seedConfig")
const {
  MASTER_BRANCH_SEED,
  MASTER_SUPPLIER_SEED,
  MASTER_CUSTOMER_SEED,
  MASTER_CONTRACTOR_SEED,
  MASTER_TYRE_SEED,
  MASTER_BATTERY_SEED,
  MASTER_STORAGE_LOCATION_SEED,
  MASTER_CONSUMABLE_LOCATION_SEED,
  MASTER_BATTERY_LOCATION_SEED,
  MASTER_BANK_DETAIL_SEED,
} = require("../constants/masterDataSeedConstants")
const { STORAGE_SOURCE_CODES } = require("../constants/storageSourceConstants")

const MASTER_DATA_SEED_NAME = "master-data"
const DEV_MASTER_DATA_FEED_SEED_NAME = "dev-master-data-feed"

const ensureSeedTrackingTable = (txDb) => {
  txDb.exec(`
    CREATE TABLE IF NOT EXISTS seed_runs (
      seed_name TEXT PRIMARY KEY,
      run_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

const hasSeedRun = (txDb, seedName) => {
  return txDb.prepare("SELECT 1 FROM seed_runs WHERE seed_name = ?").get(seedName)
}

const markSeedRun = (txDb, seedName) => {
  txDb.prepare("INSERT OR IGNORE INTO seed_runs (seed_name) VALUES (?)").run(seedName)
}

const seedBranches = (txDb, stats) => {
  const insertBranch = txDb.prepare(`
    INSERT OR IGNORE INTO BranchM (BranchCode, BranchName)
    VALUES (?, ?)
  `)
  const selectBranchByCode = txDb.prepare("SELECT Id FROM BranchM WHERE BranchCode = ?")
  const insertContact = txDb.prepare(`
    INSERT INTO BranchContact (BranchId, PhoneNumber, IsPrimary)
    VALUES (?, ?, 1)
  `)
  const insertBillingAddress = txDb.prepare(`
    INSERT INTO BranchBillingAddress (BranchId, AddressLine1, AddressLine2, City, State, PostalCode)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertDeliveryAddress = txDb.prepare(`
    INSERT INTO BranchDeliveryAddress (BranchId, AddressLine1, AddressLine2, City, State, PostalCode)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  MASTER_BRANCH_SEED.forEach((branch) => {
    const info = insertBranch.run(branch.branchCode, branch.branchName)

    if (info.changes === 0) {
      console.log(`Branch ${branch.branchCode} already exists`)
      return
    }

    const branchId = selectBranchByCode.get(branch.branchCode).Id

    branch.contacts.forEach((contact) => {
      insertContact.run(branchId, contact.phoneNumber)
    })

    if (branch.billingAddress) {
      const a = branch.billingAddress
      insertBillingAddress.run(branchId, a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode)
    }

    if (branch.deliveryAddress) {
      const a = branch.deliveryAddress
      insertDeliveryAddress.run(branchId, a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode)
    }

    stats.branches += 1
    console.log(`Seeded branch ${branch.branchCode} (${branch.branchName})`)
  })
}

const seedParties = (txDb, table, idColumn, rows, stats, statsKey) => {
  const isSupplier = table === "SupplierM"
  const isCustomer = table === "CustomerM"
  const isContractor = table === "ContractorM"

  const infoStatement = isSupplier
    ? "INSERT OR IGNORE INTO SupplierM (SupplierCode, Name, TinNo, VatNo) VALUES (?, ?, ?, ?)"
    : isCustomer
      ? "INSERT OR IGNORE INTO CustomerM (CustomerCode, Name, TinNo, VatNo, Birthday) VALUES (?, ?, ?, ?, ?)"
      : "INSERT INTO ContractorM (Name, Rating) VALUES (?, ?)"

  const selectByCode = isSupplier
    ? txDb.prepare("SELECT SupplierID FROM SupplierM WHERE SupplierCode = ?")
    : isCustomer
      ? txDb.prepare("SELECT CustomerID FROM CustomerM WHERE CustomerCode = ?")
      : null

  const selectByName = isContractor
    ? txDb.prepare("SELECT ID FROM ContractorM WHERE Name = ?")
    : null

  const insertParty = txDb.prepare(infoStatement)

  const contactTable = isSupplier ? "SupplierContact" : isCustomer ? "CustomerContact" : "ContractorContact"
  const contactIdColumn = isSupplier ? "SupplierID" : isCustomer ? "CustomerID" : "ContractorID"
  const emailTable = isSupplier ? "SupplierEmail" : isCustomer ? "CustomerEmail" : "ContractorEmail"
  const addressTable = isSupplier ? "SupplierAddress" : isCustomer ? "CustomerAddress" : "ContractorAddress"

  const insertContact = txDb.prepare(
    `INSERT INTO ${contactTable} (${contactIdColumn}, PhoneNumber, IsPrimary) VALUES (?, ?, 1)`
  )
  const insertEmail = txDb.prepare(
    `INSERT INTO ${emailTable} (${contactIdColumn}, EmailAddress, IsPrimary) VALUES (?, ?, 1)`
  )
  const insertAddress = txDb.prepare(
    `INSERT INTO ${addressTable} (${contactIdColumn}, AddressType, AddressLine1, AddressLine2, City, State, PostalCode, IsPrimary)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  )

  rows.forEach((row) => {
    let partyId = null
    let isNew = false

    if (isContractor) {
      const existing = selectByName.get(row.name)
      if (existing) {
        partyId = existing.ID
      } else {
        insertParty.run(row.name, row.rating)
        partyId = selectByName.get(row.name).ID
        isNew = true
      }
    } else {
      const insertArgs = isSupplier
        ? [row.supplierCode, row.name, row.tinNo || null, row.vatNo || null]
        : [row.customerCode, row.name, row.tinNo || null, row.vatNo || null, row.birthday || null]

      const info = insertParty.run(...insertArgs)
      partyId = selectByCode.get(row[isSupplier ? "supplierCode" : "customerCode"])[idColumn]

      if (info.changes === 0) {
        console.log(`${isSupplier ? "Supplier" : "Customer"} ${row[isSupplier ? "supplierCode" : "customerCode"]} already exists`)
        return
      }

      isNew = true
    }

    if (!isNew) {
      console.log(`Contractor ${row.name} already exists`)
      return
    }

    row.contacts.forEach((contact) => insertContact.run(partyId, contact.phoneNumber))
    ;(row.emails || []).forEach((email) => insertEmail.run(partyId, email.emailAddress))
    ;(row.addresses || []).forEach((a) => {
      insertAddress.run(partyId, a.addressType || null, a.addressLine1 || null, a.addressLine2 || null, a.city || null, a.state || null, a.postalCode || null)
    })

    stats[statsKey] += 1
    console.log(`Seeded ${isSupplier ? "supplier" : isCustomer ? "customer" : "contractor"} ${row[isSupplier ? "supplierCode" : "customerCode"] || row.name}`)
  })
}

const seedTyres = (txDb, stats) => {
  const insertTyre = txDb.prepare(`
    INSERT INTO TyreM (Brand, Size, Pattern, LL_SR, PR, SideWall, DOT, PriceValidityFrom, PriceValidityTo,
                       PurchasedPrice, DAGCost, DiscountOffered, DiscountAmount, MRP_WithoutVAT, MRP_WithVAT, ActualSellingPrice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const selectTyre = txDb.prepare("SELECT Id FROM TyreM WHERE Brand = ? AND Size = ? AND Pattern = ?")
  const selectSupplierId = txDb.prepare("SELECT SupplierID FROM SupplierM WHERE SupplierCode = ?")
  const insertTyreSupplier = txDb.prepare(`
    INSERT OR IGNORE INTO TyreSupplier (TyreId, SupplierID, Price)
    VALUES (?, ?, ?)
  `)

  MASTER_TYRE_SEED.forEach((tyre) => {
    if (selectTyre.get(tyre.brand, tyre.size, tyre.pattern)) {
      console.log(`Tyre ${tyre.brand} ${tyre.size} (${tyre.pattern}) already exists`)
      return
    }

    const info = insertTyre.run(
      tyre.brand,
      tyre.size,
      tyre.pattern,
      tyre.ll_sr || null,
      tyre.pr || null,
      tyre.sideWall || null,
      tyre.dot || null,
      tyre.priceValidityFrom || null,
      tyre.priceValidityTo || null,
      tyre.purchasedPrice || 0,
      tyre.dagCost ?? null,
      tyre.discountOffered || 0,
      tyre.discountAmount || 0,
      tyre.mrpWithoutVat || 0,
      tyre.mrpWithVat || 0,
      tyre.actualSellingPrice || 0
    )

    const tyreId = info.lastInsertRowid

    ;(tyre.tyreSuppliers || []).forEach((link) => {
      const supplier = selectSupplierId.get(link.supplierCode)
      if (supplier) {
        insertTyreSupplier.run(tyreId, supplier.SupplierID, link.price || 0)
      }
    })

    stats.tyres += 1
    console.log(`Seeded tyre ${tyre.brand} ${tyre.size} (${tyre.pattern})`)
  })
}

const seedBatteries = (txDb, stats) => {
  const insertBattery = txDb.prepare(`
    INSERT INTO BatteryM (Brand, Model, Series, Voltage, Capacity, Technology, Application, WarrantyMonths,
                          PriceValidityFrom, PriceValidityTo, PurchasedPrice, DiscountOffered, DiscountAmount,
                          MRP_WithoutVAT, MRP_WithVAT, ActualSellingPrice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const selectBattery = txDb.prepare("SELECT Id FROM BatteryM WHERE Brand = ? AND Model = ?")
  const selectSupplierId = txDb.prepare("SELECT SupplierID FROM SupplierM WHERE SupplierCode = ?")
  const insertBatterySupplier = txDb.prepare(`
    INSERT OR IGNORE INTO BatterySupplier (BatteryId, SupplierID, Price)
    VALUES (?, ?, ?)
  `)

  MASTER_BATTERY_SEED.forEach((bat) => {
    let batteryRow = selectBattery.get(bat.brand, bat.model)
    let batteryId
    if (!batteryRow) {
      const info = insertBattery.run(
        bat.brand,
        bat.model,
        bat.series || null,
        bat.voltage || "12V",
        bat.capacity,
        bat.technology || "VRLA Maintenance Free",
        bat.application || "Motorcycle",
        bat.warrantyMonths || 12,
        bat.priceValidityFrom || null,
        bat.priceValidityTo || null,
        bat.purchasedPrice || 0,
        bat.discountOffered || 0,
        bat.discountAmount || 0,
        bat.mrpWithoutVat || 0,
        bat.mrpWithVat || 0,
        bat.actualSellingPrice || 0
      )
      batteryId = info.lastInsertRowid
      stats.batteries += 1
      console.log(`Seeded battery ${bat.brand} ${bat.model} (${bat.capacity})`)
    } else {
      batteryId = batteryRow.Id
    }

    ;(bat.batterySuppliers || []).forEach((link) => {
      const supplier = selectSupplierId.get(link.supplierCode)
      if (supplier) {
        insertBatterySupplier.run(batteryId, supplier.SupplierID, link.price || 0)
      }
    })
  })
}

const seedLocations = (txDb, table, idColumn, rows, stats, statsKey) => {
  const locationTypeIdByCode = txDb
    .prepare("SELECT Id, LocationTypeCode FROM StorageLocationTypeM")
    .all()
    .reduce((map, row) => {
      map[row.LocationTypeCode] = row.Id
      return map
    }, {})

  const selectBranchId = txDb.prepare("SELECT Id FROM BranchM WHERE BranchCode = ?")
  const selectLocation = txDb.prepare(`SELECT ${idColumn} FROM ${table} WHERE LocationCode = ?`)
  const insertLocation = txDb.prepare(`
    INSERT INTO ${table} (LocationCode, LocationName, BranchId, LocationTypeId, Capacity)
    VALUES (?, ?, ?, ?, ?)
  `)

  rows.forEach((location) => {
    if (selectLocation.get(location.locationCode)) {
      console.log(`${table} ${location.locationCode} already exists`)
      return
    }

    const branch = selectBranchId.get(location.branchCode)
    if (!branch) {
      console.warn(`Skipping location ${location.locationCode}: branch ${location.branchCode} not found`)
      return
    }

    insertLocation.run(
      location.locationCode,
      location.locationName,
      branch.Id,
      locationTypeIdByCode[location.locationTypeCode] || null,
      location.capacity || 0
    )

    stats[statsKey] += 1
    console.log(`Seeded ${table} ${location.locationCode} (${location.locationName})`)
  })
}

const seedBankDetails = (txDb, stats) => {
  const selectBank = txDb.prepare("SELECT ID FROM Bankdetails WHERE BankName = ? AND AccountNumber = ?")
  const insertBank = txDb.prepare(`
    INSERT INTO Bankdetails (BankName, AccountNumber, AccountName, Branch)
    VALUES (?, ?, ?, ?)
  `)

  MASTER_BANK_DETAIL_SEED.forEach((bank) => {
    if (selectBank.get(bank.bankName, bank.accountNumber)) {
      console.log(`Bank account ${bank.bankName} ${bank.accountNumber} already exists`)
      return
    }

    insertBank.run(bank.bankName, bank.accountNumber, bank.accountName, bank.branch)
    stats.bankDetails += 1
    console.log(`Seeded bank account ${bank.bankName} (${bank.branch})`)
  })
}

const createMasterDataStats = () => ({
  branches: 0,
  suppliers: 0,
  customers: 0,
  contractors: 0,
  tyres: 0,
  batteries: 0,
  storageLocations: 0,
  consumableLocations: 0,
  batteryLocations: 0,
  bankDetails: 0,
})

const seedMasterDataRows = (txDb, stats) => {
  seedBranches(txDb, stats)
  seedParties(txDb, "SupplierM", "SupplierID", MASTER_SUPPLIER_SEED, stats, "suppliers")
  seedParties(txDb, "CustomerM", "CustomerID", MASTER_CUSTOMER_SEED, stats, "customers")
  seedParties(txDb, "ContractorM", "ID", MASTER_CONTRACTOR_SEED, stats, "contractors")
  seedTyres(txDb, stats)
  seedBatteries(txDb, stats)
  seedLocations(txDb, "StorageLocationM", "Id", MASTER_STORAGE_LOCATION_SEED, stats, "storageLocations")
  seedLocations(txDb, "ConsumableLocationM", "Id", MASTER_CONSUMABLE_LOCATION_SEED, stats, "consumableLocations")
  seedLocations(txDb, "BatteryLocationM", "Id", MASTER_BATTERY_LOCATION_SEED, stats, "batteryLocations")
  seedBankDetails(txDb, stats)
}

const getValidSeedDot = (dot, tyre) => {
  const normalized = String(dot ?? "").trim()
  const week = Number(normalized.slice(0, 2))
  if (!/^\d{4}$/.test(normalized) || week < 1 || week > 53) {
    throw new Error(`Invalid development seed DOT '${normalized}' for ${tyre.brand} ${tyre.size} ${tyre.pattern}; expected a valid WWYY code`)
  }
  return normalized
}

const seedDevelopmentStock = (txDb, stats) => {
  const location = txDb.prepare(`
    SELECT sl.Id, sl.Capacity, slt.LocationTypeCode,
      COALESCE((SELECT SUM(sm.Qty) FROM StorageManager sm WHERE sm.LocationID = sl.Id), 0) AS UsedCapacity
    FROM StorageLocationM sl
    LEFT JOIN StorageLocationTypeM slt ON slt.Id = sl.LocationTypeId
    WHERE sl.LocationCode = ?
  `).get(DEV_MASTER_DATA_STOCK_LOCATION_CODE)

  if (!location) throw new Error(`Development stock location ${DEV_MASTER_DATA_STOCK_LOCATION_CODE} not found`)
  if (String(location.LocationTypeCode).toLowerCase() !== "df") {
    throw new Error(`Development stock location ${DEV_MASTER_DATA_STOCK_LOCATION_CODE} must be a saleable/default location`)
  }

  const source = txDb.prepare("SELECT Id FROM StorageSourceM WHERE SourceCode = ?").get(STORAGE_SOURCE_CODES.DEV_SEED)
  if (!source) throw new Error("Storage source DEV_SEED is not initialized; run the application lookup seed first")

  const selectTyre = txDb.prepare("SELECT Id FROM TyreM WHERE Brand = ? AND Size = ? AND Pattern = ?")
  const selectExistingTyreLot = txDb.prepare(`
    SELECT Id FROM StorageManager
    WHERE TyreId = ? AND LocationID = ? AND SourceTypeId = ? AND CreatedBy = ?
  `)
  const insertStockLot = txDb.prepare(`
    INSERT INTO StorageManager (TyreId, LocationID, Qty, OrderID, SourceTypeId, SourceId, CreatedBy)
    VALUES (?, ?, ?, NULL, ?, NULL, ?)
  `)
  const insertStockBatch = txDb.prepare(`
    INSERT INTO StorageManagerBatch (StorageManagerID, DOT, Qty, CreatedBy)
    VALUES (?, ?, ?, ?)
  `)

  const tyresToSeed = MASTER_TYRE_SEED.filter((tyre) => {
    const tyreRow = selectTyre.get(tyre.brand, tyre.size, tyre.pattern)
    if (!tyreRow) throw new Error(`Development stock tyre ${tyre.brand} ${tyre.size} ${tyre.pattern} was not seeded`)
    return !selectExistingTyreLot.get(tyreRow.Id, location.Id, source.Id, DEV_MASTER_DATA_FEED_SEED_NAME)
  })

  const tyreCapacityNeeded = tyresToSeed.length * DEV_MASTER_DATA_STOCK_QTY
  if (Number(location.UsedCapacity) + tyreCapacityNeeded > Number(location.Capacity)) {
    throw new Error(`Development stock feed needs ${tyreCapacityNeeded} units but ${DEV_MASTER_DATA_STOCK_LOCATION_CODE} only has ${Number(location.Capacity) - Number(location.UsedCapacity)} capacity remaining`)
  }

  tyresToSeed.forEach((tyre) => {
    const tyreRow = selectTyre.get(tyre.brand, tyre.size, tyre.pattern)
    const dot = getValidSeedDot(tyre.dot, tyre)
    const lot = insertStockLot.run(
      tyreRow.Id,
      location.Id,
      DEV_MASTER_DATA_STOCK_QTY,
      source.Id,
      DEV_MASTER_DATA_FEED_SEED_NAME,
    )
    insertStockBatch.run(lot.lastInsertRowid, dot, DEV_MASTER_DATA_STOCK_QTY, DEV_MASTER_DATA_FEED_SEED_NAME)
    stats.stockLots += 1
    stats.stockQty += DEV_MASTER_DATA_STOCK_QTY
    console.log(`Seeded development stock tyre: ${tyre.brand} ${tyre.size} ${tyre.pattern}, DOT ${dot}, qty ${DEV_MASTER_DATA_STOCK_QTY}`)
  })

  // 2. Battery opening stock seeding into DEV_MASTER_DATA_BATTERY_STOCK_LOCATION_CODE (KAN-BAT)
  const batteryLocation = txDb.prepare(`
    SELECT bl.Id, bl.Capacity, slt.LocationTypeCode,
      COALESCE((SELECT SUM(bsm.Qty) FROM BatteryStorageManager bsm WHERE bsm.LocationID = bl.Id), 0) AS UsedCapacity
    FROM BatteryLocationM bl
    LEFT JOIN StorageLocationTypeM slt ON slt.Id = bl.LocationTypeId
    WHERE bl.LocationCode = ?
  `).get(DEV_MASTER_DATA_BATTERY_STOCK_LOCATION_CODE)

  if (batteryLocation && String(batteryLocation.LocationTypeCode).toLowerCase() === "df") {
    const selectBattery = txDb.prepare("SELECT Id FROM BatteryM WHERE Brand = ? AND Model = ?")
    const selectExistingBatteryLot = txDb.prepare(`
      SELECT Id FROM BatteryStorageManager
      WHERE BatteryId = ? AND LocationID = ? AND SourceTypeId = ? AND CreatedBy = ?
    `)
    const insertBatteryStockLot = txDb.prepare(`
      INSERT INTO BatteryStorageManager (BatteryId, LocationID, Qty, OrderID, SourceTypeId, SourceId, CreatedBy)
      VALUES (?, ?, ?, NULL, ?, NULL, ?)
    `)
    const insertBatteryStockBatch = txDb.prepare(`
      INSERT INTO BatteryStorageManagerBatch (BatteryStorageManagerID, BatchCode, MfgDate, ExpiryDate, Qty, CreatedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const batteriesToSeed = MASTER_BATTERY_SEED.filter((battery) => {
      const batRow = selectBattery.get(battery.brand, battery.model)
      if (!batRow) return false
      return !selectExistingBatteryLot.get(batRow.Id, batteryLocation.Id, source.Id, DEV_MASTER_DATA_FEED_SEED_NAME)
    })

    const batteryCapacityNeeded = batteriesToSeed.length * DEV_MASTER_DATA_STOCK_QTY
    if (Number(batteryLocation.UsedCapacity) + batteryCapacityNeeded <= Number(batteryLocation.Capacity)) {
      batteriesToSeed.forEach((battery) => {
        const batRow = selectBattery.get(battery.brand, battery.model)
        const lot = insertBatteryStockLot.run(
          batRow.Id,
          batteryLocation.Id,
          DEV_MASTER_DATA_STOCK_QTY,
          source.Id,
          DEV_MASTER_DATA_FEED_SEED_NAME,
        )
        insertBatteryStockBatch.run(
          lot.lastInsertRowid,
          `BAT-${battery.model}`,
          "2026-01-01",
          "2028-01-01",
          DEV_MASTER_DATA_STOCK_QTY,
          DEV_MASTER_DATA_FEED_SEED_NAME,
        )
        stats.stockLots += 1
        stats.stockQty += DEV_MASTER_DATA_STOCK_QTY
        console.log(`Seeded development stock battery: ${battery.brand} ${battery.model}, qty ${DEV_MASTER_DATA_STOCK_QTY}`)
      })
    }
  }
}

const runMasterDataSeed = async (options = {}) => {
  if (!ENABLE_MASTER_DATA_SEED && !options.force) {
    console.log("Master data seed is disabled (set TM_SEED_MASTER_DATA=true to enable)")
    return { skipped: true, disabled: true }
  }

  try {
    const stats = createMasterDataStats()
    const seedTransaction = db.transaction(() => {
      ensureSeedTrackingTable(db)
      if (!options.force && hasSeedRun(db, MASTER_DATA_SEED_NAME)) return { skipped: true }

      seedMasterDataRows(db, stats)
      markSeedRun(db, MASTER_DATA_SEED_NAME)
      return { skipped: false }
    })

    const result = seedTransaction()
    if (result.skipped) {
      console.log("Master data seed already applied; skipping")
      return { skipped: true }
    }
    console.log("Master data seed complete", stats)
    return { skipped: false, stats }
  } catch (error) {
    console.error("Master data seed failed", error)
    if (options.force) throw error
    return { error: error.message }
  }
}

const runDevMasterDataFeed = async (options = {}) => {
  if (!ENABLE_DEV_MASTER_DATA_FEED && !options.force) {
    console.log("Dev master data feed is disabled (set NODE_ENV=development and TM_DEV_MASTER_DATA_FEED=true to enable)")
    return { skipped: true, disabled: true }
  }

  try {
    const stats = { ...createMasterDataStats(), stockLots: 0, stockQty: 0 }
    const feedTransaction = db.transaction(() => {
      ensureSeedTrackingTable(db)

      if (options.force || !hasSeedRun(db, MASTER_DATA_SEED_NAME)) {
        seedMasterDataRows(db, stats)
        markSeedRun(db, MASTER_DATA_SEED_NAME)
      }

      if (!options.force && hasSeedRun(db, DEV_MASTER_DATA_FEED_SEED_NAME)) return { skipped: true }

      seedDevelopmentStock(db, stats)
      markSeedRun(db, DEV_MASTER_DATA_FEED_SEED_NAME)
      return { skipped: false }
    })

    const result = feedTransaction()
    if (result.skipped) {
      console.log("Dev master data feed already applied; skipping")
      return { skipped: true }
    }
    console.log("Dev master data feed complete", stats)
    return { skipped: false, stats }
  } catch (error) {
    console.error("Dev master data feed failed", error)
    if (options.force) throw error
    return { error: error.message }
  }
}

module.exports = { runMasterDataSeed, runDevMasterDataFeed }
