import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver } from "../helpers/backend"
import {
  SUPPLIER_TYPE_CODES,
  SUPPLIER_TYPE_METADATA,
  SUPPLIER_TYPE_OPTIONS,
  getSupplierTypeName,
  getSupplierTypeBadgeClass,
} from "../../src/shared/constants/supplierTypeConstants"

describe("SupplierTypeM and Supplier Types", () => {
  it("seeds SupplierTypeM and handles suppliers with types end-to-end", async () => {
    const backend = await bootBackend(await createSqlJsDriver())
    await backend.login()

    // 1. Verify SupplierTypeM lookup table contains seeded data
    const types = await backend.invoke("suppliers:getTypes")
    expect(types).toHaveLength(4)
    expect(types.map((t: any) => t.TypeCode)).toEqual(
      expect.arrayContaining(["tyr", "bat", "cns", "gen"])
    )

    const tyreType = types.find((t: any) => t.TypeCode === SUPPLIER_TYPE_CODES.TYRES)
    const batteryType = types.find((t: any) => t.TypeCode === SUPPLIER_TYPE_CODES.BATTERIES)
    expect(tyreType.TypeName).toBe("Tyres")
    expect(batteryType.TypeName).toBe("Batteries")

    // 2. Verify creating a supplier with Battery type
    const batterySupplierPayload = {
      SupplierCode: "SUP-BAT01",
      Name: "Apex Battery Distributors Ltd",
      TinNo: "9988776655",
      VatNo: "VAT-99887766",
      SupplierTypeCode: SUPPLIER_TYPE_CODES.BATTERIES,
      Contacts: [{ PhoneNumber: "0771234567", IsPrimary: 1 }],
      Emails: [{ EmailAddress: "orders@apexbattery.lk", IsPrimary: 1 }],
      Addresses: [
        {
          AddressType: "Warehouse",
          AddressLine1: "123 Battery Street",
          City: "Colombo",
          IsPrimary: 1,
        },
      ],
      Tyres: [],
    }

    const createdSupplier = await backend.invoke("suppliers:create", batterySupplierPayload)
    expect(createdSupplier.SupplierID).toBeDefined()
    expect(createdSupplier.Name).toBe("Apex Battery Distributors Ltd")
    expect(createdSupplier.SupplierTypeID).toBe(batteryType.Id)
    expect(createdSupplier.SupplierTypeCode).toBe("bat")
    expect(createdSupplier.SupplierTypeName).toBe("Batteries")

    // 3. Verify getSupplierById retrieves type fields
    const fetchedSupplier = await backend.invoke("suppliers:getById", createdSupplier.SupplierID)
    expect(fetchedSupplier.SupplierID).toBe(createdSupplier.SupplierID)
    expect(fetchedSupplier.SupplierTypeID).toBe(batteryType.Id)
    expect(fetchedSupplier.SupplierTypeCode).toBe("bat")
    expect(fetchedSupplier.SupplierTypeName).toBe("Batteries")

    // 4. Verify updateSupplier updates the type (switch from Batteries to Tyres)
    const updatePayload = {
      ...fetchedSupplier,
      SupplierTypeCode: SUPPLIER_TYPE_CODES.TYRES,
    }
    const updatedSupplier = await backend.invoke(
      "suppliers:update",
      createdSupplier.SupplierID,
      updatePayload
    )
    expect(updatedSupplier.SupplierTypeID).toBe(tyreType.Id)
    expect(updatedSupplier.SupplierTypeCode).toBe("tyr")
    expect(updatedSupplier.SupplierTypeName).toBe("Tyres")

    // 5. Verify suppliers:getAll includes type fields
    const allSuppliers = await backend.invoke("suppliers:getAll")
    const found = allSuppliers.find((s: any) => s.SupplierID === createdSupplier.SupplierID)
    expect(found).toBeDefined()
    expect(found.SupplierTypeCode).toBe("tyr")
    expect(found.SupplierTypeName).toBe("Tyres")

    // 6. Verify frontend constants helpers work correctly
    expect(getSupplierTypeName(SUPPLIER_TYPE_CODES.BATTERIES)).toBe("Batteries")
    expect(getSupplierTypeName(SUPPLIER_TYPE_CODES.TYRES)).toBe("Tyres")
    expect(getSupplierTypeBadgeClass(SUPPLIER_TYPE_CODES.BATTERIES)).toBe("status-badge type-badge-batteries")
    expect(SUPPLIER_TYPE_OPTIONS).toHaveLength(4)
  })
})
