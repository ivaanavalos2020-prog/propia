/**
 * Safely extracts the first photo URL from a photo_urls field that may be
 * null, undefined, or a non-array value (defensive against DB inconsistencies).
 */
export function getFirstPhoto(photoUrls: unknown): string | null {
  return Array.isArray(photoUrls) && photoUrls.length > 0 ? (photoUrls[0] as string) : null
}
