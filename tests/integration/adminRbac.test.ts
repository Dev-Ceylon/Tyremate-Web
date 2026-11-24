import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("Admin vs SuperAdmin Role and Permissions RBAC", () => {
  beforeEach(() => {
    resetBackendModules()
  })

  it("verifies permissions distinction between SuperAdmin (role 0) and Admin (role 1)", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    // 1. SuperAdmin (developer/system admin) login
    const superAdminLogin = await backend.login("superadmin", "1234")
    expect(superAdminLogin.username).toBe("superadmin")
    expect(superAdminLogin.roles.some((r: any) => r.roleId === 0)).toBe(true)
    // SuperAdmin has god and settings.manage
    expect(superAdminLogin.permissions).toContain("god")
    expect(superAdminLogin.permissions).toContain("settings.manage")
    expect(superAdminLogin.permissions).toContain("user.manage")

    // 2. Admin (shop/business owner) login
    const adminLogin = await backend.login("admin", "1234")
    expect(adminLogin.username).toBe("admin")
    expect(adminLogin.roles.some((r: any) => r.roleId === 1)).toBe(true)
    // Admin has user management, operational permissions, and administrative settings parity
    expect(adminLogin.permissions).toContain("user.manage")
    expect(adminLogin.permissions).toContain("user.view")
    expect(adminLogin.permissions).toContain("inquiry.view")
    expect(adminLogin.permissions).toContain("po.view")
    expect(adminLogin.permissions).toContain("so.view")
    expect(adminLogin.permissions).toContain("inventory.manage")
    expect(adminLogin.permissions).toContain("customers.manage")
    expect(adminLogin.permissions).toContain("suppliers.manage")
    expect(adminLogin.permissions).toContain("settings.manage")
    expect(adminLogin.permissions).toContain("god")
  })

  it("denies non-admin staff access to developer database settings and schema operations", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    await backend.login("admin", "1234")
    await backend.invoke("admin:createUser", {
      username: "staff_cashier_rbac",
      displayName: "Front Desk Cashier",
      password: "password123",
      roleIds: [3],
    })

    await backend.login("staff_cashier_rbac", "password123")

    // Non-admin staff attempting schema status should be rejected
    await expect(backend.invoke("admin:getSchemaStatus")).rejects.toThrow(
      /do not have permission.*\(settings\.manage\)/,
    )

    // Non-admin staff attempting table counts should be rejected
    await expect(backend.invoke("admin:getTableCounts")).rejects.toThrow(
      /do not have permission.*\(settings\.manage\)/,
    )

    // Non-admin staff attempting sample seed should be rejected
    await expect(backend.invoke("admin:seedSampleData")).rejects.toThrow(
      /do not have permission.*\(settings\.manage\)/,
    )

    // Non-admin staff attempting Cloudinary configuration should be rejected
    await expect(
      backend.invoke("admin:setCloudinaryConfig", {
        cloudName: "my-cloud",
        uploadPreset: "preset",
        folder: "receipts",
      }),
    ).rejects.toThrow(/do not have permission.*\(settings\.manage\)/)
  })

  it("allows Admin to perform user management but prevents tampering with SuperAdmin accounts", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    await backend.login("admin", "1234")

    // 1. Admin can list users and roles
    const users = await backend.invoke("admin:listUsers")
    expect(Array.isArray(users)).toBe(true)
    expect(users.some((u: any) => u.username === "superadmin")).toBe(true)

    const roles = await backend.invoke("admin:listRoles")
    expect(Array.isArray(roles)).toBe(true)
    expect(roles.some((r: any) => r.roleName === "SalesRep")).toBe(true)

    // 2. Admin can create new staff (e.g. Cashier, SalesRep)
    const newUser = await backend.invoke("admin:createUser", {
      username: "staff_cashier1",
      displayName: "Front Desk Cashier",
      password: "password123",
      roleIds: [3],
    })
    expect(newUser.id).toBeDefined()

    // 3. Admin can update staff user
    const updateResult = await backend.invoke("admin:updateUser", newUser.id, {
      displayName: "Updated Cashier Name",
    })
    expect(updateResult.success).toBe(true)

    // 4. Admin can reset staff user password
    const resetResult = await backend.invoke("admin:resetPassword", newUser.id, "newpassword123")
    expect(resetResult.success).toBe(true)

    // 5. Admin CANNOT grant Super Admin role (roleId 0)
    await expect(
      backend.invoke("admin:createUser", {
        username: "fake_superadmin",
        password: "password123",
        roleIds: [0],
      }),
    ).rejects.toThrow(/Only a Super Admin can grant the Super Admin role/)

    // 6. Admin CANNOT reset SuperAdmin's password
    const superAdminUser = users.find((u: any) => u.username === "superadmin")
    await expect(
      backend.invoke("admin:resetPassword", superAdminUser.id, "hacked1234"),
    ).rejects.toThrow(/Only a Super Admin can reset a Super Admin password/)
  })

  it("allows SuperAdmin full technical settings and database management access", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    await backend.login("superadmin", "1234")

    // SuperAdmin can check schema status
    const schemaStatus = await backend.invoke("admin:getSchemaStatus")
    expect(schemaStatus).toBeDefined()
    expect(Array.isArray(schemaStatus.migrations)).toBe(true)
    expect(Array.isArray(schemaStatus.tables)).toBe(true)

    // SuperAdmin can check table counts
    const tableCounts = await backend.invoke("admin:getTableCounts")
    expect(Array.isArray(tableCounts)).toBe(true)
    expect(tableCounts.length).toBeGreaterThan(0)

    // SuperAdmin can configure Cloudinary
    const cloudinaryResult = await backend.invoke("admin:setCloudinaryConfig", {
      cloudName: "dev-cloud",
      uploadPreset: "dev-preset",
      folder: "dev-receipts",
    })
    expect(cloudinaryResult.configured).toBe(true)
    expect(cloudinaryResult.cloudName).toBe("dev-cloud")

    // SuperAdmin can seed sample data
    const seedResult = await backend.invoke("admin:seedSampleData", { includeStock: false })
    expect(seedResult.master).toBeDefined()
  })
})
