/**
 * Static brand/documentation assets are hosted on Cloudinary (CDN, automatic
 * format/quality). Each asset is also shipped in /public as a fallback so the
 * app keeps working if the CDN copy is missing or the cloud is not configured.
 */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""
const STATIC_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_STATIC_FOLDER ?? "tyremate/static"
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

const BRAND = {
  favicon: { publicId: "favicon", file: "favicon.svg", resource: "image", format: "svg" },
  logo: { publicId: "logo", file: "logo.svg", resource: "image", format: "svg" },
} as const

export type BrandAsset = keyof typeof BRAND

export function localAsset(file: string): string {
  return `${BASE_PATH}/${file.replace(/^\/+/, "")}`
}

export function cloudinaryImageUrl(publicId: string, transform = "f_auto,q_auto"): string | null {
  if (!CLOUD_NAME) return null
  const t = transform ? `${transform}/` : ""
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}${STATIC_FOLDER}/${publicId}`
}

export function brandAsset(name: BrandAsset): string {
  const asset = BRAND[name]
  // SVGs are delivered untouched (no f_auto) to keep them vector.
  return cloudinaryImageUrl(`${asset.publicId}.${asset.format}`, "") ?? localAsset(asset.file)
}

export function brandAssetFallback(name: BrandAsset): string {
  return localAsset(BRAND[name].file)
}

/** User-manual screenshot (docs/images/<file>), served from Cloudinary as optimised images. */
export function manualImage(file: string): { src: string; fallback: string } {
  const publicId = `manual/${file.replace(/\.[a-z]+$/i, "")}`
  return {
    src: cloudinaryImageUrl(publicId, "f_auto,q_auto,w_1600,c_limit") ?? localAsset(`manual/${file}`),
    fallback: localAsset(`manual/${file}`),
  }
}

export const cloudinaryCloudName = CLOUD_NAME
