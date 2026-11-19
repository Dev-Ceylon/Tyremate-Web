import { describe, expect, it } from "vitest"
import { MANUAL_IMAGES_VERSION } from "../../src/shell/web/assets"
// @ts-expect-error plain ESM script without types
import { listAssets, parseCloudinaryUrl, signParams } from "../../scripts/upload-cloudinary-assets.mjs"

describe("Cloudinary asset upload script", () => {
  it("signs parameters like Cloudinary's documented example", () => {
    // https://cloudinary.com/documentation/authentication_signatures
    const params = { eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 }
    expect(signParams(params, "abcd")).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e")
  })

  it("parses CLOUDINARY_URL", () => {
    expect(parseCloudinaryUrl("cloudinary://123:s3cr%40t@demo")).toEqual({ apiKey: "123", apiSecret: "s3cr@t", cloudName: "demo" })
    expect(() => parseCloudinaryUrl("https://x")).toThrow()
  })

  it("publishes brand images and every manual screenshot", () => {
    const assets = listAssets() as { publicId: string }[]
    expect(assets.map((a) => a.publicId)).toContain("tyremate/static/logo")
    expect(assets.filter((a) => a.publicId.includes("/manual/")).length).toBe(23)
    // The upload script and the app must agree on the screenshot set version.
    expect(assets.map((a) => a.publicId)).toContain(`tyremate/static/manual/${MANUAL_IMAGES_VERSION}/01_login`)
  })
})
