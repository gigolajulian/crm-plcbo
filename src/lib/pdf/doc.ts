import type { FontMetrics } from './ttf'
import type { LoadedFonts } from './fonts'
import { PAGE_HEIGHT, PAGE_WIDTH, type DrawList } from './types'

/* ============================================================================
   PDF WRITER

   A complete PDF 1.4 in about two hundred lines, with no dependency. It writes
   a single page, embeds both TrueType faces so the document renders identically
   on a machine that has never heard of Inter, and optionally paints a raster
   mark with an alpha channel.

   Deliberately hand-rolled rather than a library: the document is one fixed
   layout measured from a reference PDF, and a generic engine would cost several
   hundred kilobytes to do less exactly.
   ========================================================================== */

const enc = (s: string) => {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i) & 0xff
  return out
}

const concat = (parts: Uint8Array[]) => {
  let length = 0
  for (const part of parts) length += part.length
  const out = new Uint8Array(length)
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}

/**
 * A zlib stream of stored (uncompressed) DEFLATE blocks — a valid
 * /FlateDecode with no codec involved. Used when CompressionStream is
 * unavailable, so a PDF can always be produced even if it is larger.
 */
function zlibStored(data: Uint8Array): Uint8Array {
  let a = 1
  let b = 0
  for (let i = 0; i < data.length; i += 1) {
    a = (a + data[i]) % 65521
    b = (b + a) % 65521
  }

  const parts: Uint8Array[] = [new Uint8Array([0x78, 0x01])]
  const MAX = 65535
  let offset = 0
  do {
    const len = Math.min(MAX, data.length - offset)
    const last = offset + len >= data.length ? 1 : 0
    parts.push(new Uint8Array([last, len & 255, len >> 8, ~len & 255, (~len >> 8) & 255]))
    if (len) parts.push(data.subarray(offset, offset + len))
    offset += len
  } while (offset < data.length)

  const adler = ((b << 16) | a) >>> 0
  parts.push(new Uint8Array([adler >>> 24, (adler >>> 16) & 255, (adler >>> 8) & 255, adler & 255]))
  return concat(parts)
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === 'function') {
    try {
      const stream = new Blob([data as BlobPart])
        .stream()
        .pipeThrough(new CompressionStream('deflate'))
      return new Uint8Array(await new Response(stream).arrayBuffer())
    } catch {
      /* fall through to stored blocks */
    }
  }
  return zlibStored(data)
}

/* WinAnsi differs from Latin-1 between 0x80 and 0x9F. Mapping both ways keeps
   the bytes written and the widths declared in agreement. */
const WIN_HI: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
}
const UNI_WIN: Record<number, number> = Object.fromEntries(
  Object.entries(WIN_HI).map(([byte, unicode]) => [unicode, Number(byte)]),
)

/** Anything outside WinAnsi becomes '?' rather than corrupting the stream. */
const winByte = (cp: number) => UNI_WIN[cp] ?? (cp < 256 ? cp : 63)

const pesc = (value: string) => {
  let out = ''
  for (const char of String(value)) {
    const byte = winByte(char.codePointAt(0)!)
    const c = String.fromCharCode(byte)
    out += c === '\\' || c === '(' || c === ')' ? `\\${c}` : c
  }
  return out
}

const hex2rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
]

const f = (n: number) => (Math.round(n * 1000) / 1000).toString()

function widthsArray(font: FontMetrics): number[] {
  const widths: number[] = []
  for (let c = 32; c <= 255; c += 1) {
    widths.push(Math.round((font.advUnits(WIN_HI[c] ?? c) * 1000) / font.upem))
  }
  return widths
}

/** A raster mark, split into the greyscale plane and its alpha channel. */
export interface RasterMark {
  width: number
  height: number
  gray: Uint8Array
  alpha: Uint8Array
}

/**
 * Decodes an image into the two planes the PDF needs. Runs on a canvas, so it
 * only works in the browser — which is where documents are generated.
 */
export function loadMark(src: string): Promise<RasterMark> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('Canvas is unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const pixels = ctx.getImageData(0, 0, width, height).data

      const gray = new Uint8Array(width * height)
      const alpha = new Uint8Array(width * height)
      for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
        // Rec.601 luma, integer-only.
        gray[p] = (pixels[i] * 77 + pixels[i + 1] * 150 + pixels[i + 2] * 29) >> 8
        alpha[p] = pixels[i + 3]
      }
      resolve({ width, height, gray, alpha })
    }
    img.onerror = () => reject(new Error('Could not decode the mark'))
    img.src = src
  })
}

export async function buildPDF(
  draw: DrawList,
  fonts: LoadedFonts,
  mark?: RasterMark,
): Promise<Blob> {
  /* ------------------------------------------------------ content stream */
  let stream = ''

  for (const rect of draw.rects) {
    const [r, g, b] = hex2rgb(rect.fill)
    stream += `${f(r)} ${f(g)} ${f(b)} rg ${f(rect.x)} ${f(PAGE_HEIGHT - rect.y - rect.h)} ${f(rect.w)} ${f(rect.h)} re f\n`
  }

  if (mark) {
    for (const image of draw.images) {
      stream += `q ${f(image.w)} 0 0 ${f(image.h)} ${f(image.x)} ${f(PAGE_HEIGHT - image.y - image.h)} cm /Im0 Do Q\n`
    }
  }

  for (const line of draw.lines) {
    const [r, g, b] = hex2rgb(line.c)
    stream += `${f(r)} ${f(g)} ${f(b)} RG 1 w ${f(line.x1)} ${f(PAGE_HEIGHT - line.y)} m ${f(line.x2)} ${f(PAGE_HEIGHT - line.y)} l S\n`
  }

  for (const op of draw.text) {
    if (op.text === '') continue
    const font = op.font === 'sb' ? fonts.sb : fonts.rg
    // Right alignment is resolved here, against the same metrics the SVG used.
    const x = op.anchor === 'end' ? op.x - font.width(op.text, op.size) : op.x
    const [r, g, b] = hex2rgb(op.fill)
    stream +=
      `BT ${f(r)} ${f(g)} ${f(b)} rg /${op.font === 'sb' ? 'F1' : 'F2'} ${op.size} Tf ` +
      `1 0 0 1 ${f(x)} ${f(PAGE_HEIGHT - op.y)} Tm (${pesc(op.text)}) Tj ET\n`
  }

  const content = await deflate(enc(stream))
  const sbZ = await deflate(fonts.sbBytes)
  const rgZ = await deflate(fonts.rgBytes)

  /* --------------------------------------------------------------- objects */
  const objects: Array<string | Uint8Array> = []
  const put = (body: string | Uint8Array) => objects.push(body)
  const streamObj = (dict: string, bytes: Uint8Array) =>
    concat([enc(`${dict}\nstream\n`), bytes, enc('\nendstream')])

  const descriptor = (font: FontMetrics, name: string, stemV: number, fileId: number) => {
    const k = 1000 / font.upem
    const bb = font.bbox.map((v) => Math.round(v * k))
    return (
      `<< /Type /FontDescriptor /FontName /${name} /Flags 32 ` +
      `/FontBBox [${bb.join(' ')}] /ItalicAngle 0 /Ascent 969 /Descent -241 ` +
      `/CapHeight 727 /StemV ${stemV} /FontFile2 ${fileId} 0 R >>`
    )
  }

  const resources =
    `/Font << /F1 5 0 R /F2 8 0 R >>` + (mark ? ` /XObject << /Im0 11 0 R >>` : '')

  put('<< /Type /Catalog /Pages 2 0 R >>') // 1
  put('<< /Type /Pages /Count 1 /Kids [3 0 R] >>') // 2
  put(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << ${resources} >> /Contents 4 0 R >>`,
  ) // 3
  put(streamObj(`<< /Length ${content.length} /Filter /FlateDecode >>`, content)) // 4
  put(
    `<< /Type /Font /Subtype /TrueType /BaseFont /Inter-SemiBold /FirstChar 32 /LastChar 255 ` +
      `/Widths [${widthsArray(fonts.sb).join(' ')}] /Encoding /WinAnsiEncoding /FontDescriptor 6 0 R >>`,
  ) // 5
  put(descriptor(fonts.sb, 'Inter-SemiBold', 80, 7)) // 6
  put(
    streamObj(
      `<< /Length ${sbZ.length} /Length1 ${fonts.sbBytes.length} /Filter /FlateDecode >>`,
      sbZ,
    ),
  ) // 7
  put(
    `<< /Type /Font /Subtype /TrueType /BaseFont /Inter-Regular /FirstChar 32 /LastChar 255 ` +
      `/Widths [${widthsArray(fonts.rg).join(' ')}] /Encoding /WinAnsiEncoding /FontDescriptor 9 0 R >>`,
  ) // 8
  put(descriptor(fonts.rg, 'Inter-Regular', 60, 10)) // 9
  put(
    streamObj(
      `<< /Length ${rgZ.length} /Length1 ${fonts.rgBytes.length} /Filter /FlateDecode >>`,
      rgZ,
    ),
  ) // 10

  if (mark) {
    const grayZ = await deflate(mark.gray)
    const alphaZ = await deflate(mark.alpha)
    put(
      streamObj(
        `<< /Type /XObject /Subtype /Image /Width ${mark.width} /Height ${mark.height} ` +
          `/ColorSpace /DeviceGray /BitsPerComponent 8 ${draw.flipMark ? '/Decode [1 0] ' : ''}` +
          `/SMask 12 0 R /Filter /FlateDecode /Length ${grayZ.length} >>`,
        grayZ,
      ),
    ) // 11
    put(
      streamObj(
        `<< /Type /XObject /Subtype /Image /Width ${mark.width} /Height ${mark.height} ` +
          `/ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${alphaZ.length} >>`,
        alphaZ,
      ),
    ) // 12
  }

  /* -------------------------------------------------------------- assemble */
  const chunks: Uint8Array[] = [enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')]
  let position = chunks[0].length
  const offsets: number[] = []

  objects.forEach((body, index) => {
    offsets.push(position)
    const head = enc(`${index + 1} 0 obj\n`)
    const tail = enc('\nendobj\n')
    const middle = body instanceof Uint8Array ? body : enc(body)
    chunks.push(head, middle, tail)
    position += head.length + middle.length + tail.length
  })

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF\n`
  chunks.push(enc(xref))

  return new Blob([concat(chunks) as BlobPart], { type: 'application/pdf' })
}
