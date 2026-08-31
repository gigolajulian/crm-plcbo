import { parseTTF, type FontMetrics } from './ttf'

/* ============================================================================
   FONT LOADING

   The two Inter weights are ~1.4MB of TrueType between them. They are fetched
   on demand rather than inlined, for three reasons: the PDF writer needs the
   raw bytes anyway, base64 in a bundle costs a third more than the file, and a
   real asset gets cached by the browser between visits.

   Everything downstream is async because of this, which is why the document
   screens await `loadDocumentFonts()` before they draw anything.
   ========================================================================== */

export interface LoadedFonts {
  /** Inter SemiBold — the default face on these documents. */
  sb: FontMetrics
  /** Inter Regular — used for the client name and the sender email. */
  rg: FontMetrics
  /** Raw bytes, embedded into the PDF as FontFile2. */
  sbBytes: Uint8Array
  rgBytes: Uint8Array
}

const FILES = {
  sb: 'Inter-SemiBold.ttf',
  rg: 'Inter-Regular.ttf',
} as const

let cache: Promise<LoadedFonts> | null = null

/** Resolves the font URL against the deployed base path, not the site root. */
function fontUrl(file: string): string {
  return new URL(`fonts/${file}`, document.baseURI).href
}

async function fetchFont(file: string): Promise<Uint8Array> {
  const response = await fetch(fontUrl(file))
  if (!response.ok) throw new Error(`Could not load ${file} (${response.status})`)
  return new Uint8Array(await response.arrayBuffer())
}

/**
 * Loads and parses both faces once per session, and registers them with the
 * document so the on-screen proof renders in the same metal the PDF embeds.
 */
export function loadDocumentFonts(): Promise<LoadedFonts> {
  if (cache) return cache

  cache = (async () => {
    const [sbBytes, rgBytes] = await Promise.all([fetchFont(FILES.sb), fetchFont(FILES.rg)])

    // Register for the SVG preview. Not fatal if it fails — the PDF, which is
    // the thing being sent, does not depend on the browser having the face.
    try {
      const faces = [
        new FontFace('InterSB', sbBytes.buffer as ArrayBuffer),
        new FontFace('InterRG', rgBytes.buffer as ArrayBuffer),
      ]
      const loaded = await Promise.all(faces.map((face) => face.load()))
      for (const face of loaded) document.fonts.add(face)
    } catch {
      /* proof falls back to a system face; the PDF is unaffected */
    }

    return {
      sb: parseTTF(sbBytes.buffer as ArrayBuffer),
      rg: parseTTF(rgBytes.buffer as ArrayBuffer),
      sbBytes,
      rgBytes,
    }
  })().catch((error) => {
    // A failed load must not poison the cache, or every later attempt fails too.
    cache = null
    throw error
  })

  return cache
}
