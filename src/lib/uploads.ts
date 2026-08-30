import { STORAGE_BUCKET, isRemote, requireSupabase } from './supabase'
import { uid } from './utils'

/* ============================================================================
   UPLOADS

   Files go to Supabase Storage under <workspace_id>/<folder>/<file>. That first
   path segment is the tenancy check the storage policy reads, so a member of
   one studio cannot reach another's files.

   In local mode there is nowhere to put a file, so the caller falls back to the
   curated library instead — `canUpload` says which world we are in.
   ========================================================================== */

export const canUpload = () => isRemote

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/avif,image/gif'

export interface UploadResult {
  /** Signed URL for display. Expires, so it is refreshed on read. */
  url: string
  /** Durable pointer stored on the record. */
  path: string
  width?: number
  height?: number
  ratio: number
}

/** Human-readable reason a file was rejected, or null if it is fine. */
export function validateFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'That is not an image. PNG, JPEG, WebP, AVIF or GIF.'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 10MB.`
  }
  return null
}

/** Read the natural dimensions so the masonry can reserve the right space. */
async function measure(file: File): Promise<{ width: number; height: number; ratio: number }> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Could not read that image.'))
      image.src = url
    })
    const ratio = image.naturalHeight ? image.naturalWidth / image.naturalHeight : 4 / 3
    return { width: image.naturalWidth, height: image.naturalHeight, ratio }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function uploadImage(
  file: File,
  workspaceId: string,
  folder: string,
): Promise<UploadResult> {
  const problem = validateFile(file)
  if (problem) throw new Error(problem)

  const supabase = requireSupabase()
  const { width, height, ratio } = await measure(file)

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${workspaceId}/${folder}/${uid('f')}.${extension}`

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw new Error(error.message)

  return { url: await signedUrl(path), path, width, height, ratio }
}

/** The bucket is private, so display needs a short-lived signed URL. */
export async function signedUrl(path: string, seconds = 60 * 60 * 8): Promise<string> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, seconds)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export async function removeUpload(path: string): Promise<void> {
  if (!isRemote) return
  await requireSupabase().storage.from(STORAGE_BUCKET).remove([path])
}
