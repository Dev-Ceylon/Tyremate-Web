import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("SalesRep Role and Inquiry RBAC", () => {
  beforeEach(() => {
    resetBackendModules()
  })

  it("seeds the SalesRep role and salesrep user with default password '1234'", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    // Log in as salesrep
    const loginResult = await backend.login("salesrep", "1234")
    expect(loginResult).toBeDefined()
    expect(loginResult.username).toBe("salesrep")
    expect(loginResult.displayName).toBe("Sales Representative")

    // Check roles
    const roleNames = loginResult.roles.map((r: any) => r.roleName)
    expect(roleNames).toContain("SalesRep")
    const salesRepRole = loginResult.roles.find((r: any) => r.roleName === "SalesRep")
    expect(salesRepRole.roleId).toBe(4)

    // Check permissions - strictly inquiry only
    expect(loginResult.permissions).toContain("inquiry.view")
    expect(loginResult.permissions).toContain("inquiry.create")
    expect(loginResult.permissions).toContain("inquiry.edit")
    expect(loginResult.permissions).toContain("inquiry.delete")

    // Ensure salesrep does NOT have other module permissions
    expect(loginResult.permissions).not.toContain("god")
    expect(loginResult.permissions).not.toContain("so.view")
    expect(loginResult.permissions).not.toContain("so.create")
    expect(loginResult.permissions).not.toContain("po.view")
    expect(loginResult.permissions).not.toContain("po.create")
    expect(loginResult.permissions).not.toContain("invoice.view")
    expect(loginResult.permissions).not.toContain("dag.view")
    expect(loginResult.permissions).not.toContain("reports.view")
    expect(loginResult.permissions).not.toContain("user.manage")
    expect(loginResult.permissions).not.toContain("settings.manage")
  })

  it("allows SalesRep to perform all inquiry operations while denying Master Data creation", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    // Seed master data as admin first so products and customers exist
    await backend.login("admin", "1234")
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Michelin",
      Size: "205/55R16",
      Pattern: "Primacy 4",
    })
    expect(tyre.Id).toBeDefined()

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-SR-01",
      Name: "Apex Logistics",
      Phone: "+94771122334",
      Email: "info@apexlogistics.lk",
    })
    expect(customer.CustomerID).toBeDefined()

    // Switch session to salesrep
    await backend.login("salesrep", "1234")

    // 1. SalesRep CANNOT create or modify Master Data (customers, tyres)
    await expect(
      backend.invoke("customers:create", {
        CustomerCode: "CUST-UNAUTH",
        Name: "Unauthorized Customer",
      }),
    ).rejects.toThrow(/do not have permission.*\(customers\.manage\)/)

    await expect(
      backend.invoke("tyres:create", {
        Brand: "Unauthorized Tyre",
        Size: "195/65R15",
      }),
    ).rejects.toThrow(/do not have permission.*\(inventory\.manage\)/)

    // 2. SalesRep CAN create an inquiry with existing customer & tyre
    const inquiry = await backend.invoke("inquiries:create", {
      Date: "2026-11-23",
      Category: "tyre",
      CustomerID: customer.CustomerID,
      Notes: "Fleet pricing requested for 10 tyres",
      lines: [
        {
          TyreID: tyre.Id,
          Price: 25000,
          Discount: 5,
          Qty: 10,
        },
      ],
    })
    expect(inquiry.InquiryID).toBeDefined()

    // 3. SalesRep can view inquiries list
    const inquiries = await backend.invoke("inquiries:getAll")
    expect(Array.isArray(inquiries)).toBe(true)
    const found = inquiries.find((i: any) => i.InquiryID === inquiry.InquiryID)
    expect(found).toBeDefined()

    // 4. SalesRep can view single inquiry
    const singleInquiry = await backend.invoke("inquiries:getById", inquiry.InquiryID)
    expect(singleInquiry.InquiryID).toBe(inquiry.InquiryID)
    expect(singleInquiry.Notes).toBe("Fleet pricing requested for 10 tyres")

    // 5. SalesRep can update inquiry notes/status
    const updated = await backend.invoke("inquiries:update", inquiry.InquiryID, {
      Date: "2026-11-23",
      Category: "tyre",
      CustomerID: customer.CustomerID,
      Notes: "Updated fleet pricing notes",
      lines: [
        {
          TyreID: tyre.Id,
          Price: 24500,
          Discount: 5,
          Qty: 10,
        },
      ],
    })
    expect(updated).toBeDefined()

    // 6. SalesRep can delete inquiry
    const deleteResult = await backend.invoke("inquiries:delete", inquiry.InquiryID)
    expect(deleteResult.success).toBe(true)

    // Verification of deletion
    const inquiriesAfterDelete = await backend.invoke("inquiries:getAll")
    expect(inquiriesAfterDelete.some((i: any) => i.InquiryID === inquiry.InquiryID)).toBe(false)
  })

  it("enforces permission denial when a user lacks inquiry permissions", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    // Log in as cashier (role 3), which does NOT have inquiry.* permissions
    await backend.login("cashier1", "1234").catch(async () => {
      // If cashier1 doesn't exist, create one using admin
      await backend.login("admin", "1234")
      await backend.invoke("admin:createUser", {
        username: "cashier_test",
        password: "password123",
        displayName: "Test Cashier",
        roleIds: [3],
      })
      await backend.login("cashier_test", "password123")
    })

    // Cashier attempting to view inquiries should be rejected with ForbiddenError (inquiry.view)
    await expect(backend.invoke("inquiries:getAll")).rejects.toThrow(
      /do not have permission.*\(inquiry\.view\)/,
    )

    // Cashier attempting to create an inquiry should be rejected with ForbiddenError (inquiry.create)
    await expect(
      backend.invoke("inquiries:create", {
        Date: "2026-11-23",
        Category: "tyre",
        Notes: "Unauthorized inquiry attempt",
        lines: [],
      }),
    ).rejects.toThrow(/do not have permission.*\(inquiry\.create\)/)

    // Switch to salesrep and ensure salesrep cannot perform unauthorized manager/admin actions
    await backend.login("salesrep", "1234")
    await expect(backend.invoke("admin:listUsers")).rejects.toThrow(
      /do not have permission.*\(user\.manage\)/,
    )
    await expect(
      backend.invoke("po:createStandalone", {
        SupplierID: 1,
        lines: [],
      }),
    ).rejects.toThrow(/do not have permission.*\(po\.create\)/)
  })
})
