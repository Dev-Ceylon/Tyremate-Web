const salesTargetRepo = require("../repositories/salesTargetRepository")
const { ForbiddenError, UnauthorizedError } = require("../errors/appErrors")

const PERIOD_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  ANNUALLY: "annually",
}

const CATEGORIES = {
  ALL: "all",
  TYRE: "tyre",
  BATTERY: "battery",
}

/**
 * Formats a Date object to YYYY-MM-DD in local time.
 */
function formatLocalDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Parses YYYY-MM-DD string into a local Date object.
 */
function parseLocalDate(str) {
  if (!str || typeof str !== "string") return new Date()
  const [y, m, d] = str.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Resolves standard start and end dates for a period type based on a reference date.
 */
function resolvePeriodDates(periodType, referenceDateStr) {
  const refDate = referenceDateStr ? parseLocalDate(referenceDateStr) : new Date()

  switch (periodType) {
    case PERIOD_TYPES.DAILY: {
      const dateStr = formatLocalDate(refDate)
      return { startDate: dateStr, endDate: dateStr }
    }

    case PERIOD_TYPES.WEEKLY: {
      // Monday to Sunday (standard ISO business week)
      const day = refDate.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const diffToMonday = day === 0 ? -6 : 1 - day
      const diffToSunday = day === 0 ? 0 : 7 - day

      const monday = new Date(refDate)
      monday.setDate(refDate.getDate() + diffToMonday)

      const sunday = new Date(refDate)
      sunday.setDate(refDate.getDate() + diffToSunday)

      return {
        startDate: formatLocalDate(monday),
        endDate: formatLocalDate(sunday),
      }
    }

    case PERIOD_TYPES.MONTHLY: {
      const year = refDate.getFullYear()
      const month = refDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      return {
        startDate: formatLocalDate(firstDay),
        endDate: formatLocalDate(lastDay),
      }
    }

    case PERIOD_TYPES.ANNUALLY: {
      const year = refDate.getFullYear()
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }
    }

    default:
      throw new Error(`Unsupported period type: ${periodType}`)
  }
}

/**
 * Checks if a user has admin/management permission for sales targets.
 */
function canManageTargets(user) {
  if (!user || !user.permissions) return false
  if (user.permissions.includes("god")) return true
  return user.permissions.includes("targets.manage")
}

/**
 * Checks if a user has permission to view their own sales targets.
 */
function canViewOwnTargets(user) {
  if (!user || !user.permissions) return false
  if (user.permissions.includes("god")) return true
  if (user.permissions.includes("targets.manage")) return true
  if (user.permissions.includes("targets.view_own")) return true
  return Boolean(user.roles && user.roles.some((r) => Number(r.roleId) === 4 || r.roleName === "SalesRep"))
}

/**
 * Hydrates a target record with live actual sales and progress metrics.
 */
function hydrateTargetProgress(target, referenceDate = null) {
  if (!target) return null

  const actuals = salesTargetRepo.getActualSalesForRep({
    repId: target.SalesRepID,
    startDate: target.StartDate,
    endDate: target.EndDate,
    category: target.Category || "all",
  })

  const today = referenceDate || formatLocalDate(new Date())
  const targetAmount = Number(target.TargetAmount) || 0
  const targetQty = Number(target.TargetQty) || 0

  const achievedAmount = Math.round(actuals.actualAmount * 100) / 100
  const achievedQty = Number(actuals.actualQty) || 0

  const remainingAmount = Math.max(0, Math.round((targetAmount - achievedAmount) * 100) / 100)
  const remainingQty = Math.max(0, targetQty - achievedQty)

  const amountPercentage = targetAmount > 0
    ? Math.min(100, Math.round((achievedAmount / targetAmount) * 1000) / 10)
    : 100

  const qtyPercentage = targetQty > 0
    ? Math.min(100, Math.round((achievedQty / targetQty) * 1000) / 10)
    : 100

  const isAchieved = (targetAmount <= 0 || achievedAmount >= targetAmount) &&
                     (targetQty <= 0 || achievedQty >= targetQty)

  let status = "in_progress"
  if (isAchieved) {
    status = "achieved"
  } else if (today > target.EndDate) {
    status = "missed"
  }

  // Calculate days remaining in period
  const endD = parseLocalDate(target.EndDate)
  const todayD = parseLocalDate(today)
  const diffTime = endD.getTime() - todayD.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  return {
    ...target,
    TargetAmount: targetAmount,
    TargetQty: targetQty,
    ActualAmount: achievedAmount,
    ActualQty: achievedQty,
    RemainingAmount: remainingAmount,
    RemainingQty: remainingQty,
    OrderCount: actuals.orderCount,
    AmountPercentage: amountPercentage,
    QtyPercentage: qtyPercentage,
    IsAchieved: isAchieved ? 1 : 0,
    Status: status,
    DaysRemaining: daysRemaining,
  }
}

/**
 * Retrieves sales targets matching filters, strictly enforcing RBAC data isolation.
 */
exports.getAllTargets = (filterOrCtx = {}, maybeCtx = {}) => {
  let filter = {}
  let ctx = maybeCtx
  if (filterOrCtx && typeof filterOrCtx === "object" && (filterOrCtx.user !== undefined || filterOrCtx.changedBy !== undefined)) {
    ctx = filterOrCtx
    filter = {}
  } else if (filterOrCtx && typeof filterOrCtx === "object") {
    filter = filterOrCtx
  }

  const user = ctx.user
  if (!user) {
    throw new UnauthorizedError("Unauthorized")
  }

  const queryFilter = { ...filter }

  if (!canManageTargets(user)) {
    if (!canViewOwnTargets(user)) {
      throw new ForbiddenError("You do not have permission to view sales targets")
    }
    // Strict isolation: non-admin can ONLY view their own targets
    queryFilter.repId = user.id
  }

  const targets = salesTargetRepo.getAllTargets(queryFilter)
  return targets.map((t) => hydrateTargetProgress(t))
}

/**
 * Retrieves a single sales target by ID, enforcing ownership check for sales reps.
 */
exports.getTargetById = (id, ctx = {}) => {
  const user = ctx.user
  if (!user) {
    throw new UnauthorizedError("Unauthorized")
  }

  const target = salesTargetRepo.getTargetById(Number(id))
  if (!target) {
    throw new Error("Sales target not found")
  }

  if (!canManageTargets(user)) {
    if (!canViewOwnTargets(user) || Number(target.SalesRepID) !== Number(user.id)) {
      throw new ForbiddenError("You are only authorized to view your own sales targets")
    }
  }

  return hydrateTargetProgress(target)
}

/**
 * Retrieves all active targets for the logged-in representative.
 */
exports.getMyActiveTargets = (referenceDateOrCtx = null, maybeCtx = {}) => {
  let referenceDate = null
  let ctx = maybeCtx
  if (referenceDateOrCtx && typeof referenceDateOrCtx === "object" && (referenceDateOrCtx.user !== undefined || referenceDateOrCtx.changedBy !== undefined)) {
    ctx = referenceDateOrCtx
    referenceDate = null
  } else if (typeof referenceDateOrCtx === "string") {
    referenceDate = referenceDateOrCtx
  }

  const user = ctx.user
  if (!user || !user.id) {
    throw new UnauthorizedError("Unauthorized")
  }

  if (!canViewOwnTargets(user)) {
    throw new ForbiddenError("You do not have permission to view sales targets")
  }

  const repId = Number(user.id)
  const activeTargets = salesTargetRepo.getActiveTargetsForRep(repId, referenceDate)
  const hydrated = activeTargets.map((t) => hydrateTargetProgress(t, referenceDate))

  // Group by period type for convenient dashboard card rendering
  const daily = hydrated.find((t) => t.PeriodType === PERIOD_TYPES.DAILY && t.Category === "all") ||
                hydrated.find((t) => t.PeriodType === PERIOD_TYPES.DAILY) || null

  const weekly = hydrated.find((t) => t.PeriodType === PERIOD_TYPES.WEEKLY && t.Category === "all") ||
                 hydrated.find((t) => t.PeriodType === PERIOD_TYPES.WEEKLY) || null

  const monthly = hydrated.find((t) => t.PeriodType === PERIOD_TYPES.MONTHLY && t.Category === "all") ||
                  hydrated.find((t) => t.PeriodType === PERIOD_TYPES.MONTHLY) || null

  const annually = hydrated.find((t) => t.PeriodType === PERIOD_TYPES.ANNUALLY && t.Category === "all") ||
                   hydrated.find((t) => t.PeriodType === PERIOD_TYPES.ANNUALLY) || null

  return {
    daily,
    weekly,
    monthly,
    annually,
    allActive: hydrated,
  }
}

/**
 * Creates a new sales target (Admin / Manager only).
 */
exports.createTarget = (payload = {}, ctx = {}) => {
  const user = ctx.user
  if (!canManageTargets(user)) {
    throw new ForbiddenError("You do not have permission to create sales targets (targets.manage)")
  }

  const repId = Number(payload.SalesRepID)
  if (!Number.isInteger(repId) || repId <= 0) {
    throw new Error("A valid Sales Representative must be selected")
  }

  const periodType = (payload.PeriodType || "").toLowerCase()
  if (!Object.values(PERIOD_TYPES).includes(periodType)) {
    throw new Error(`PeriodType must be one of: ${Object.values(PERIOD_TYPES).join(", ")}`)
  }

  let startDate = payload.StartDate
  let endDate = payload.EndDate

  // If start/end dates are not explicitly passed, automatically resolve them based on the period type
  if (!startDate || !endDate) {
    const resolved = resolvePeriodDates(periodType, payload.ReferenceDate)
    startDate = startDate || resolved.startDate
    endDate = endDate || resolved.endDate
  }

  if (startDate > endDate) {
    throw new Error("StartDate cannot be after EndDate")
  }

  const category = (payload.Category || "all").toLowerCase()
  if (!Object.values(CATEGORIES).includes(category)) {
    throw new Error(`Category must be one of: ${Object.values(CATEGORIES).join(", ")}`)
  }

  const targetAmount = Number(payload.TargetAmount) || 0
  const targetQty = Number(payload.TargetQty) || 0

  if (targetAmount < 0 || targetQty < 0) {
    throw new Error("Target amount and quantity must be non-negative numbers")
  }

  if (targetAmount === 0 && targetQty === 0) {
    throw new Error("At least a target revenue amount or target quantity must be specified")
  }

  // Prevent duplicate target for the same rep, period, and start date
  const duplicate = salesTargetRepo.findDuplicateTarget(repId, periodType, startDate, category)
  if (duplicate) {
    throw new Error(`A ${periodType} target for this representative (${category}) already exists starting on ${startDate}`)
  }

  const created = salesTargetRepo.createTarget({
    SalesRepID: repId,
    PeriodType: periodType,
    StartDate: startDate,
    EndDate: endDate,
    TargetAmount: targetAmount,
    TargetQty: targetQty,
    Category: category,
    Notes: payload.Notes || null,
    CreatedBy: user ? user.id : null,
  })

  return hydrateTargetProgress(created)
}

/**
 * Updates an existing sales target (Admin / Manager only).
 */
exports.updateTarget = (id, payload = {}, ctx = {}) => {
  const user = ctx.user
  if (!canManageTargets(user)) {
    throw new ForbiddenError("You do not have permission to update sales targets (targets.manage)")
  }

  const targetId = Number(id)
  const existing = salesTargetRepo.getTargetById(targetId)
  if (!existing) {
    throw new Error("Sales target not found")
  }

  const targetAmount = payload.TargetAmount !== undefined ? Number(payload.TargetAmount) : existing.TargetAmount
  const targetQty = payload.TargetQty !== undefined ? Number(payload.TargetQty) : existing.TargetQty

  if (targetAmount < 0 || targetQty < 0) {
    throw new Error("Target amount and quantity must be non-negative numbers")
  }

  const updated = salesTargetRepo.updateTarget(targetId, {
    TargetAmount: targetAmount,
    TargetQty: targetQty,
    Notes: payload.Notes !== undefined ? payload.Notes : existing.Notes,
  })

  return hydrateTargetProgress(updated)
}

/**
 * Deletes a sales target (Admin / Manager only).
 */
exports.deleteTarget = (id, ctx = {}) => {
  const user = ctx.user
  if (!canManageTargets(user)) {
    throw new ForbiddenError("You do not have permission to delete sales targets (targets.manage)")
  }

  const targetId = Number(id)
  const result = salesTargetRepo.deleteTarget(targetId)
  if (result.changes === 0) {
    throw new Error("Sales target not found")
  }

  return { success: true }
}

/**
 * Returns eligible sales representatives for target assignment.
 */
exports.getSalesReps = () => {
  return salesTargetRepo.getEligibleSalesReps()
}

exports.resolvePeriodDates = resolvePeriodDates
exports.PERIOD_TYPES = PERIOD_TYPES
exports.CATEGORIES = CATEGORIES
