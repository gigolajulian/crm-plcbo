/* ============================================================================
   PASTED IMAGE URLS

   References mostly arrive by being copied out of somewhere else — a Cosmos
   board, a shop listing, an archive. This turns a block of pasted lines into
   something the moodboard can actually lay out, which means knowing each
   image's real aspect ratio: the masonry sizes rows from it, and guessing
   makes the grid wrong in a way that is obvious and ugly.
   ========================================================================== */

/** Cosmos serves from an imgix-style CDN whose width is a query parameter. */
const COSMOS_CDN = 'cdn.cosmos.so'

/** Below this a reference looks soft blown up to a board tile. */
const MIN_WIDTH = 1200

/**
 * Accepts only https. Not fussiness: a pasted `javascript:` or `data:` URL
 * ends up in an `<img src>`, and an http one is blocked as mixed content on
 * the deployed site anyway, so it would silently never load.
 *
 * A Cosmos share link usually carries `w=400` — a thumbnail. That one host
 * gets its width raised, keeping `rect` and `format`, which encode the crop
 * the user chose. Every other host is left exactly as pasted; rewriting a
 * stranger's query string is how images break.
 */
export function normaliseImageUrl(input: string): string | undefined {
  const value = input.trim()
  if (!value) return undefined

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return undefined
  }
  if (url.protocol !== 'https:') return undefined

  if (url.hostname === COSMOS_CDN) {
    const width = Number(url.searchParams.get('w'))
    if (!width || width < MIN_WIDTH) url.searchParams.set('w', String(MIN_WIDTH))
  }

  return url.toString()
}

export interface MeasuredImage {
  url: string
  ratio: number
}

/**
 * Loads the image to read its real dimensions. Resolves to undefined when it
 * cannot be loaded at all — a 404, a host that blocks hotlinking, a typo —
 * so the caller can name what failed instead of adding a broken tile.
 */
export function measureImage(url: string, timeoutMs = 12_000): Promise<MeasuredImage | undefined> {
  return new Promise((resolve) => {
    const img = new Image()
    let settled = false

    const done = (result: MeasuredImage | undefined) => {
      if (settled) return
      settled = true
      img.onload = null
      img.onerror = null
      resolve(result)
    }

    img.onload = () =>
      done({
        url,
        ratio: img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1,
      })
    img.onerror = () => done(undefined)
    // A host that never answers must not hang the form open.
    setTimeout(() => done(undefined), timeoutMs)

    img.src = url
  })
}

export interface PastedImages {
  ok: MeasuredImage[]
  /** The lines that could not be used, as pasted, for reporting back. */
  failed: string[]
}

/** One URL per line. Blank lines are ignored; everything else is accounted for. */
export async function measurePastedUrls(text: string): Promise<PastedImages> {
  const lines = text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)

  const results = await Promise.all(
    lines.map(async (line) => {
      const url = normaliseImageUrl(line)
      if (!url) return { line, measured: undefined }
      return { line, measured: await measureImage(url) }
    }),
  )

  return {
    ok: results.flatMap((r) => (r.measured ? [r.measured] : [])),
    failed: results.filter((r) => !r.measured).map((r) => r.line),
  }
}

/* --------------------------------------------------------------- drops -- */

/**
 * Pulls image URLs out of a drag or a paste.
 *
 * Dragging a picture from another tab is how references actually move — it is
 * the browser doing what browsers do, no API and no scraping. What lands in
 * the DataTransfer varies by source: some pages hand over `text/uri-list`,
 * some only `text/html` with the `<img>` in it, some just plain text. Read all
 * three and take whatever looks like an image.
 */
export function urlsFromTransfer(data: DataTransfer): string[] {
  const found: string[] = []

  const uriList = data.getData('text/uri-list')
  if (uriList) {
    // The format is newline-separated with # comments.
    found.push(...uriList.split('\n').filter((line) => line && !line.startsWith('#')))
  }

  const html = data.getData('text/html')
  if (html) {
    /*
     * Parsed rather than pattern-matched, because the fragment is real HTML:
     * a query string arrives escaped, and `?a=1&amp;b=2` picked out by a regex
     * becomes a URL with a parameter called "amp;b". The parser decodes it.
     * This never executes anything — the document is inert, and only the src
     * attribute is read.
     */
    const doc = new DOMParser().parseFromString(html, 'text/html')
    for (const img of doc.querySelectorAll('img')) {
      const src = img.getAttribute('src')
      // Absolute only; a relative src would resolve against our own origin.
      if (src && /^https?:\/\//i.test(src)) found.push(src)
    }
  }

  const text = data.getData('text/plain')
  if (text) found.push(...text.split(/\s+/).filter((t) => t.startsWith('http')))

  // A drag often carries the same image in two flavours; keep the first of each.
  return [...new Set(found.map((u) => u.trim()).filter(Boolean))]
}
