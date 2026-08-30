/* ============================================================================
   PROFILE PICTURES

   Avatars are stored as a small square data URL on the record itself rather
   than as a file in object storage. That is a deliberate trade:

   - It works identically in local mode and connected mode, so the public demo
     is not a second-class experience.
   - It survives a reload. A signed Storage URL expires, and an avatar that
     quietly 404s after eight hours is worse than one that costs a few KB.
   - 256px of WebP is roughly 15–30KB, which is nothing next to a moodboard.

   Anything larger — the work itself — still goes to Storage via lib/uploads.
   ========================================================================== */

const SIZE = 256
const MAX_SOURCE_BYTES = 12 * 1024 * 1024

export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/gif'

export function validateAvatar(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'That is not an image. PNG, JPEG, WebP or AVIF.'
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Try one under 12MB.`
  }
  return null
}

/**
 * Centre-crop to a square and downscale to 256px, returning a data URL.
 * Cropping from the centre is the right default for faces and logos alike, and
 * it means the caller never has to reason about aspect ratio.
 */
export async function fileToAvatar(file: File): Promise<string> {
  const problem = validateAvatar(file)
  if (problem) throw new Error(problem)

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await load(objectUrl)

    const side = Math.min(image.naturalWidth, image.naturalHeight)
    const sx = (image.naturalWidth - side) / 2
    const sy = (image.naturalHeight - side) / 2

    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE

    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser could not process the image.')

    context.imageSmoothingQuality = 'high'
    context.drawImage(image, sx, sy, side, side, 0, 0, SIZE, SIZE)

    // WebP where it is supported, JPEG everywhere else.
    const webp = canvas.toDataURL('image/webp', 0.85)
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('That image could not be read.'))
    image.src = src
  })
}
