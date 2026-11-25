import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("Sales Targets & Performance Calculation Engine", () => {
  beforeEach(() => {
    resetBackendModules()
  })

  it("handles target assignment, dynamic actuals calculation, and enforces strict RBAC privacy", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    // 1. Log in as admin and verify seeded SalesRep user exists
    const adminLogin = await backend.login("admin", "1234")
    expect(adminLogin).toBeDefined()
    expect(adminLogin.permissions).toContain("targets.manage")

    // Admin fetches eligible sales reps
    const reps = await backend.invoke("salesTarget:getSalesReps")
    expect(Array.isArray(reps)).toBe(true)
    const salesRepUser = reps.find((r: any) => r.username === "salesrep")
    expect(salesRepUser).toBeDefined()
    expect(salesRepUser.id).toBeDefined()

    // Create a second sales rep user to verify multi-rep privacy
    const userAdmin = await backend.invoke("admin:createUser", {
      username: "john_sales",
      password: "password123",
      displayName: "John Sales Agent",
      roleIds: [4], // SalesRep role
    })
    expect(userAdmin.id).toBeDefined()

    // 2. Admin creates targets for rep 1 ('salesrep'): Daily, Weekly, and Annual
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

    const dailyTarget = await backend.invoke("salesTarget:create", {
      SalesRepID: salesRepUser.id,
      PeriodType: "daily",
      TargetAmount: 50000,
      TargetQty: 2,
      Category: "all",
      Notes: "Target for today",
    })
    expect(dailyTarget.TargetID).toBeDefined()
    expect(dailyTarget.StartDate).toBe(today)
    expect(dailyTarget.EndDate).toBe(today)
    expect(dailyTarget.TargetAmount).toBe(50000)
    expect(dailyTarget.ActualAmount).toBe(0)
    expect(dailyTarget.IsAchieved).toBe(0)
    expect(dailyTarget.Status).toBe("in_progress")

    const weeklyTarget = await backend.invoke("salesTarget:create", {
      SalesRepID: salesRepUser.id,
      PeriodType: "weekly",
      TargetAmount: 250000,
      TargetQty: 10,
      Category: "all",
      Notes: "Weekly target",
    })
    expect(weeklyTarget.TargetID).toBeDefined()
    expect(weeklyTarget.PeriodType).toBe("weekly")

    const annualTarget = await backend.invoke("salesTarget:create", {
      SalesRepID: salesRepUser.id,
      PeriodType: "annually",
      TargetAmount: 5000000,
      TargetQty: 200,
      Category: "all",
    })
    expect(annualTarget.TargetID).toBeDefined()
    expect(annualTarget.PeriodType).toBe("annually")

    // Admin also creates a target for rep 2 ('john_sales')
    const rep2Target = await backend.invoke("salesTarget:create", {
      SalesRepID: userAdmin.id,
      PeriodType: "daily",
      TargetAmount: 75000,
      TargetQty: 3,
      Category: "all",
    })
    expect(rep2Target.TargetID).toBeDefined()

    // Admin can see all targets
    const allTargetsForAdmin = await backend.invoke("salesTarget:getAll")
    expect(allTargetsForAdmin.length).toBeGreaterThanOrEqual(4)

    // 3. Switch login to 'salesrep'
    const repLogin = await backend.login("salesrep", "1234")
    expect(repLogin.permissions).toContain("targets.view_own")
    expect(repLogin.permissions).not.toContain("targets.manage")

    // Rep calls salesTarget:getMyActiveTargets
    const myActive = await backend.invoke("salesTarget:getMyActiveTargets")
    expect(myActive.daily).toBeDefined()
    expect(myActive.daily.TargetID).toBe(dailyTarget.TargetID)
    expect(myActive.weekly).toBeDefined()
    expect(myActive.weekly.TargetID).toBe(weeklyTarget.TargetID)
    expect(myActive.annually).toBeDefined()
    expect(myActive.annually.TargetID).toBe(annualTarget.TargetID)

    // Rep calls salesTarget:getAll -> MUST strictly return only targets for salesrep
    const repTargets = await backend.invoke("salesTarget:getAll")
    expect(repTargets.length).toBe(3)
    repTargets.forEach((t: any) => {
      expect(t.SalesRepID).toBe(salesRepUser.id)
    })

    // Rep attempts parameter tampering by injecting another rep's ID in filter
    const spoofedTargets = await backend.invoke("salesTarget:getAll", { repId: userAdmin.id })
    expect(spoofedTargets.length).toBe(3)
    spoofedTargets.forEach((t: any) => {
      expect(t.SalesRepID).toBe(salesRepUser.id) // Enforced to self
    })

    // 4. PRIVACY / RBAC ENFORCEMENT:
    // Sales rep attempts to fetch rep 2's target by ID -> rejected with ForbiddenError
    await expect(
      backend.invoke("salesTarget:getById", rep2Target.TargetID)
    ).rejects.toThrow(/only authorized to view your own sales targets/i)

    // Sales rep attempts to create, update, or delete target -> rejected with ForbiddenError
    await expect(
      backend.invoke("salesTarget:create", {
        SalesRepID: salesRepUser.id,
        PeriodType: "daily",
        TargetAmount: 10000,
      })
    ).rejects.toThrow(/permission.*targets\.manage/i)

    await expect(
      backend.invoke("salesTarget:delete", dailyTarget.TargetID)
    ).rejects.toThrow(/permission.*targets\.manage/i)

    await expect(
      backend.invoke("salesTarget:getSalesReps")
    ).rejects.toThrow(/permission.*targets\.manage/i)

    // 5. SALES ATTRIBUTION & PROGRESS ACCUMULATION
    // Admin creates customer and tyres, then creates an approved SO credited to salesrep
    await backend.login("admin", "1234")

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-TARGET-01",
      Name: "Apex Haulers Ltd",
      Phone: "+94771112233",
      Address: "45 Port Road",
    })

    const tyre = await backend.invoke("tyres:create", {
      Brand: "Bridgestone",
      Size: "195/65R15",
      Pattern: "Ecopia EP150",
    })

    // Create an approved SO for Rs 60,000 (qty 2 tyres @ 30,000 each) credited to salesrep
    const so = await backend.invoke("so:create", {
      Date: today,
      Category: "tyre",
      CustomerID: customer.CustomerID,
      SalesRepID: salesRepUser.id,
      IsAdminApproved: 1,
      IsCompleted: 0,
    })
    expect(so.SoID).toBeDefined()

    // Add tyre lines to SO
    await backend.invoke("soTyres:create", {
      SoID: so.SoID,
      TyreID: tyre.Id,
      Price: 30000,
      Discount: 0,
      Qty: 2,
      IsAdminApproved: 1,
    })

    // 6. Verify Daily Target Progress
    // Daily target was 50,000 Rs. Actual is now 60,000 Rs -> target is ACHIEVED!
    const updatedDaily = await backend.invoke("salesTarget:getById", dailyTarget.TargetID)
    expect(updatedDaily.ActualAmount).toBe(60000)
    expect(updatedDaily.ActualQty).toBe(2)
    expect(updatedDaily.RemainingAmount).toBe(0)
    expect(updatedDaily.RemainingQty).toBe(0)
    expect(updatedDaily.AmountPercentage).toBe(100)
    expect(updatedDaily.IsAchieved).toBe(1)
    expect(updatedDaily.Status).toBe("achieved")

    // Weekly target was 250,000 Rs. Actual is 60,000 Rs (24% achieved, in progress)
    const updatedWeekly = await backend.invoke("salesTarget:getById", weeklyTarget.TargetID)
    expect(updatedWeekly.ActualAmount).toBe(60000)
    expect(updatedWeekly.ActualQty).toBe(2)
    expect(updatedWeekly.RemainingAmount).toBe(190000)
    expect(updatedWeekly.RemainingQty).toBe(8)
    expect(updatedWeekly.AmountPercentage).toBe(24)
    expect(updatedWeekly.IsAchieved).toBe(0)
    expect(updatedWeekly.Status).toBe("in_progress")

    // Verify SalesRep sees the live progress on their dashboard
    await backend.login("salesrep", "1234")
    const repActiveUpdated = await backend.invoke("salesTarget:getMyActiveTargets")
    expect(repActiveUpdated.daily.ActualAmount).toBe(60000)
    expect(repActiveUpdated.daily.IsAchieved).toBe(1)
    expect(repActiveUpdated.daily.Status).toBe("achieved")
    expect(repActiveUpdated.weekly.ActualAmount).toBe(60000)
    expect(repActiveUpdated.weekly.Status).toBe("in_progress")
  })

  it("handles category-specific targets, target updates, and prevents duplicate target periods", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login("admin", "1234")

    const reps = await backend.invoke("salesTarget:getSalesReps")
    const rep = reps[0]

    // 1. Create a monthly target for batteries only
    const batteryTarget = await backend.invoke("salesTarget:create", {
      SalesRepID: rep.id,
      PeriodType: "monthly",
      TargetAmount: 150000,
      TargetQty: 5,
      Category: "battery",
      Notes: "Monthly Battery Target",
    })
    expect(batteryTarget.TargetID).toBeDefined()
    expect(batteryTarget.Category).toBe("battery")
    expect(batteryTarget.PeriodType).toBe("monthly")

    // 2. Prevent duplicate target for same rep, period, and category
    await expect(
      backend.invoke("salesTarget:create", {
        SalesRepID: rep.id,
        PeriodType: "monthly",
        TargetAmount: 200000,
        Category: "battery",
      })
    ).rejects.toThrow(/already exists/i)

    // 3. Update target amount and notes
    const updated = await backend.invoke("salesTarget:update", batteryTarget.TargetID, {
      TargetAmount: 180000,
      Notes: "Revised Monthly Battery Target",
    })
    expect(updated.TargetAmount).toBe(180000)
    expect(updated.Notes).toBe("Revised Monthly Battery Target")

    // 4. Delete target
    const deleteResult = await backend.invoke("salesTarget:delete", batteryTarget.TargetID)
    expect(deleteResult.success).toBe(true)

    // Verify target is deleted
    await expect(
      backend.invoke("salesTarget:getById", batteryTarget.TargetID)
    ).rejects.toThrow(/not found/i)
  })

  it("enforces that unapproved draft SOs do not count towards targets, and decrements upon SO deletion", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login("admin", "1234")

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

    const reps = await backend.invoke("salesTarget:getSalesReps")
    const rep = reps[0]

    const target = await backend.invoke("salesTarget:create", {
      SalesRepID: rep.id,
      PeriodType: "daily",
      TargetAmount: 100000,
      TargetQty: 4,
      Category: "all",
    })
    expect(target.ActualAmount).toBe(0)

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-REV-01",
      Name: "Reversion Test Customer",
    })

    const tyre = await backend.invoke("tyres:create", {
      Brand: "Yokohama",
      Size: "215/60R16",
    })

    // 1. Create a DRAFT unapproved SO (IsAdminApproved = 0)
    const draftSo = await backend.invoke("so:create", {
      Date: today,
      Category: "tyre",
      CustomerID: customer.CustomerID,
      SalesRepID: rep.id,
      IsAdminApproved: 0,
      IsCompleted: 0,
    })
    await backend.invoke("soTyres:create", {
      SoID: draftSo.SoID,
      TyreID: tyre.Id,
      Price: 40000,
      Discount: 0,
      Qty: 2,
      IsAdminApproved: 0,
    })

    // Unapproved SO must NOT count towards target
    const targetWithDraft = await backend.invoke("salesTarget:getById", target.TargetID)
    expect(targetWithDraft.ActualAmount).toBe(0)
    expect(targetWithDraft.ActualQty).toBe(0)

    // 2. Admin approves the SO -> Target actuals now increase
    await backend.invoke("so:update", draftSo.SoID, {
      Date: today,
      Category: "tyre",
      IsAdminApproved: 1,
      IsCompleted: 0,
    })

    const targetWithApproved = await backend.invoke("salesTarget:getById", target.TargetID)
    expect(targetWithApproved.ActualAmount).toBe(80000)
    expect(targetWithApproved.ActualQty).toBe(2)
    expect(targetWithApproved.RemainingAmount).toBe(20000)

    // 3. Admin deletes the SO -> Target actuals must immediately revert to 0!
    await backend.invoke("so:delete", draftSo.SoID)

    const targetAfterDelete = await backend.invoke("salesTarget:getById", target.TargetID)
    expect(targetAfterDelete.ActualAmount).toBe(0)
    expect(targetAfterDelete.ActualQty).toBe(0)
    expect(targetAfterDelete.RemainingAmount).toBe(100000)
    expect(targetAfterDelete.IsAchieved).toBe(0)
  })

  it("handles category isolation: tyre sales do not count towards battery target and vice versa", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login("admin", "1234")

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

    const reps = await backend.invoke("salesTarget:getSalesReps")
    const rep = reps[0]

    // Create a Tyre-only target and a Battery-only target for the same rep
    const tyreTarget = await backend.invoke("salesTarget:create", {
      SalesRepID: rep.id,
      PeriodType: "daily",
      TargetAmount: 80000,
      TargetQty: 2,
      Category: "tyre",
    })

    const batteryTarget = await backend.invoke("salesTarget:create", {
      SalesRepID: rep.id,
      PeriodType: "daily",
      TargetAmount: 40000,
      TargetQty: 1,
      Category: "battery",
    })

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-CAT-01",
      Name: "Category Separation Logistics",
    })

    const tyre = await backend.invoke("tyres:create", {
      Brand: "Goodyear",
      Size: "205/65R15",
    })

    const battery = await backend.invoke("batteries:create", {
      Brand: "Exide",
      Model: "Matrix 45Ah",
      Voltage: "12V",
      Capacity: "45Ah",
      Technology: "Lead-Acid",
      Application: "Automotive",
      ActualSellingPrice: 42000,
    })

    // Create an approved Tyre SO
    const tyreSo = await backend.invoke("so:create", {
      Date: today,
      Category: "tyre",
      CustomerID: customer.CustomerID,
      SalesRepID: rep.id,
      IsAdminApproved: 1,
      IsCompleted: 0,
    })
    await backend.invoke("soTyres:create", {
      SoID: tyreSo.SoID,
      TyreID: tyre.Id,
      Price: 40000,
      Discount: 0,
      Qty: 2,
      IsAdminApproved: 1,
    })

    // Check Tyre target: achieved (80,000 Rs, 2 tyres)
    const checkedTyreTarget = await backend.invoke("salesTarget:getById", tyreTarget.TargetID)
    expect(checkedTyreTarget.ActualAmount).toBe(80000)
    expect(checkedTyreTarget.ActualQty).toBe(2)
    expect(checkedTyreTarget.IsAchieved).toBe(1)

    // Check Battery target: MUST STILL BE 0! (Tyre sales must not leak into battery target)
    const checkedBatteryTarget = await backend.invoke("salesTarget:getById", batteryTarget.TargetID)
    expect(checkedBatteryTarget.ActualAmount).toBe(0)
    expect(checkedBatteryTarget.ActualQty).toBe(0)
    expect(checkedBatteryTarget.IsAchieved).toBe(0)
  })

  it("enforces role boundaries: Manager can manage targets while Cashier is completely blocked", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login("admin", "1234")

    // Create a Manager user (Role 2)
    await backend.invoke("admin:createUser", {
      username: "manager_user",
      password: "password123",
      displayName: "Branch Manager",
      roleIds: [2],
    })

    // Create a Cashier user (Role 3)
    await backend.invoke("admin:createUser", {
      username: "cashier_user",
      password: "password123",
      displayName: "Front Desk Cashier",
      roleIds: [3],
    })

    const reps = await backend.invoke("salesTarget:getSalesReps")
    const rep = reps[0]

    // 1. Manager Login: can manage targets
    await backend.login("manager_user", "password123")
    const managerCreatedTarget = await backend.invoke("salesTarget:create", {
      SalesRepID: rep.id,
      PeriodType: "daily",
      TargetAmount: 30000,
      Category: "all",
      Notes: "Target assigned by Branch Manager",
    })
    expect(managerCreatedTarget.TargetID).toBeDefined()
    expect(managerCreatedTarget.TargetAmount).toBe(30000)

    // 2. Cashier Login: completely blocked with ForbiddenError from all target endpoints
    await backend.login("cashier_user", "password123")

    await expect(
      backend.invoke("salesTarget:getAll")
    ).rejects.toThrow(/do not have permission.*targets/i)

    await expect(
      backend.invoke("salesTarget:getMyActiveTargets")
    ).rejects.toThrow(/do not have permission.*targets/i)

    await expect(
      backend.invoke("salesTarget:create", {
        SalesRepID: rep.id,
        PeriodType: "daily",
        TargetAmount: 20000,
      })
    ).rejects.toThrow(/do not have permission.*targets/i)

    await expect(
      backend.invoke("salesTarget:delete", managerCreatedTarget.TargetID)
    ).rejects.toThrow(/do not have permission.*targets/i)
  })
})
