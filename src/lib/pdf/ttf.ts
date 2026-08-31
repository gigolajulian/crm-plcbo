/* ============================================================================
   TRUETYPE METRICS

   Just enough of the font format to measure text and to fill in a PDF's
   /Widths array: the header, the character map, and the horizontal metrics.

   Measuring in the app rather than trusting the browser is what lets the SVG
   proof and the PDF agree to the decimal — both ask this the same question and
   get the same answer, so right-aligned figures land in the same place on
   screen as they do in the file.
   ========================================================================== */

export interface FontMetrics {
  /** Units per em, from `head`. */
  upem: number
  /** [xMin, yMin, xMax, yMax] in font units. */
  bbox: [number, number, number, number]
  /** Glyph id for a code point, 0 when unmapped. */
  gid: (codePoint: number) => number
  /** Advance width in font units. */
  advUnits: (codePoint: number) => number
  /** Width of a string at a given point size. */
  width: (text: string, size: number) => number
}

export function parseTTF(buffer: ArrayBuffer): FontMetrics {
  const dv = new DataView(buffer)
  const tableCount = dv.getUint16(4)

  const tables: Record<string, { off: number; len: number }> = {}
  for (let i = 0; i < tableCount; i += 1) {
    let tag = ''
    for (let k = 0; k < 4; k += 1) tag += String.fromCharCode(dv.getUint8(12 + i * 16 + k))
    tables[tag.trim()] = {
      off: dv.getUint32(12 + i * 16 + 8),
      len: dv.getUint32(12 + i * 16 + 12),
    }
  }

  const head = tables.head.off
  const upem = dv.getUint16(head + 18)
  const bbox: [number, number, number, number] = [
    dv.getInt16(head + 36),
    dv.getInt16(head + 38),
    dv.getInt16(head + 40),
    dv.getInt16(head + 42),
  ]
  const numHMetrics = dv.getUint16(tables.hhea.off + 34)

  /* cmap, format 4 — the Unicode BMP subtable every text font carries. */
  const cmap = tables.cmap.off
  const subtableCount = dv.getUint16(cmap + 2)
  let sub: number | null = null
  for (let i = 0; i < subtableCount; i += 1) {
    const platform = dv.getUint16(cmap + 4 + i * 8)
    const encoding = dv.getUint16(cmap + 6 + i * 8)
    const offset = dv.getUint32(cmap + 8 + i * 8)
    if ((platform === 3 && (encoding === 1 || encoding === 0)) || platform === 0) {
      sub = cmap + offset
    }
  }

  const map = new Map<number, number>()
  if (sub !== null && dv.getUint16(sub) === 4) {
    const segX2 = dv.getUint16(sub + 6)
    const segments = segX2 / 2
    const endOffset = sub + 14
    const startOffset = endOffset + segX2 + 2
    const deltaOffset = startOffset + segX2
    const rangeOffset = deltaOffset + segX2

    for (let s = 0; s < segments; s += 1) {
      const end = dv.getUint16(endOffset + s * 2)
      const start = dv.getUint16(startOffset + s * 2)
      const delta = dv.getInt16(deltaOffset + s * 2)
      const range = dv.getUint16(rangeOffset + s * 2)

      for (let u = start; u <= end && u !== 0xffff; u += 1) {
        let glyph: number
        if (range === 0) {
          glyph = (u + delta) & 0xffff
        } else {
          const index = rangeOffset + s * 2 + range + (u - start) * 2
          if (index + 1 >= dv.byteLength) continue
          glyph = dv.getUint16(index)
          if (glyph) glyph = (glyph + delta) & 0xffff
        }
        if (glyph) map.set(u, glyph)
      }
    }
  }

  // Glyphs past numHMetrics all share the last advance, per the spec.
  const advance = (glyph: number) =>
    dv.getUint16(tables.hmtx.off + (glyph < numHMetrics ? glyph : numHMetrics - 1) * 4)

  return {
    upem,
    bbox,
    gid: (cp) => map.get(cp) ?? 0,
    advUnits: (cp) => advance(map.get(cp) ?? 0),
    width: (text, size) => {
      let total = 0
      for (const char of text) total += advance(map.get(char.codePointAt(0)!) ?? 0)
      return (total * size) / upem
    },
  }
}
