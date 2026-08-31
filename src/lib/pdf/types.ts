import type { LoadedFonts } from './fonts'

/* ============================================================================
   THE DRAW LIST

   One description of a page, consumed by both the SVG proof and the PDF
   writer. This is the load-bearing idea of the whole module: there is no
   second implementation of the layout for print, so the two cannot drift.

   Coordinates are PDF points with the origin at the TOP left, because that is
   how the reference document was measured. The PDF writer flips them.
   ========================================================================== */

/** A4 at 72dpi, matching the reference invoice exactly. */
export const PAGE_WIDTH = 594.95996
export const PAGE_HEIGHT = 841.91998

export interface Paper {
  PAGE: string
  BAND: string
  DARK: string
  GREY: string
  SLATE: string
  RULE: string
  BLUE: string
  /** Invert the mark so a black wordmark reads white on dark paper. */
  flipMark: boolean
}

/**
 * Two treatments. "light" is the reference document verbatim. "inverted" runs
 * the same three-step emphasis ladder downward from the ground instead of
 * upward, and lifts the band above the page the way the light paper drops it
 * below white. The brand blue is unchanged — it reads on both.
 */
export const PAPERS: Record<'light' | 'inverted', Paper> = {
  light: {
    PAGE: '#FFFFFF',
    BAND: '#FBFBFB',
    DARK: '#1F2229',
    GREY: '#828691',
    SLATE: '#9DA8BB',
    RULE: '#E7E8EC',
    BLUE: '#0099FF',
    flipMark: false,
  },
  inverted: {
    PAGE: '#141619',
    BAND: '#1A1D22',
    DARK: '#E9EBEF',
    GREY: '#A2A7B2',
    SLATE: '#737B8A',
    RULE: '#2C3038',
    BLUE: '#0099FF',
    flipMark: true,
  },
}

export type FontKey = 'sb' | 'rg'

export interface TextOp {
  x: number
  y: number
  size: number
  fill: string
  text: string
  font: FontKey
  anchor: 'start' | 'end'
}

export interface RectOp {
  x: number
  y: number
  w: number
  h: number
  fill: string
}

export interface LineOp {
  x1: number
  x2: number
  y: number
  c: string
}

export interface ImageOp {
  x: number
  y: number
  w: number
  h: number
}

export interface DrawList {
  text: TextOp[]
  rects: RectOp[]
  lines: LineOp[]
  images: ImageOp[]
  flipMark: boolean
  /** Anything the caller wants back out of the layout pass, e.g. the total. */
  total: number
}

/** Everything a template needs in order to draw. */
export interface TemplateContext {
  fonts: LoadedFonts
  paper: Paper
}

/** Small helper set every template builds its draw list with. */
export function createCanvas(paper: Paper) {
  const text: TextOp[] = []
  const rects: RectOp[] = []
  const lines: LineOp[] = []
  const images: ImageOp[] = []

  return {
    text,
    rects,
    lines,
    images,
    t(
      x: number,
      y: number,
      size: number,
      fill: string,
      value: string,
      font: FontKey = 'sb',
      anchor: 'start' | 'end' = 'start',
    ) {
      text.push({ x, y, size, fill, text: value, font, anchor })
    },
    rect(x: number, y: number, w: number, h: number, fill: string) {
      rects.push({ x, y, w, h, fill })
    },
    line(x1: number, y: number, x2: number, c: string) {
      lines.push({ x1, y, x2, c })
    },
    image(x: number, y: number, w: number, h: number) {
      images.push({ x, y, w, h })
    },
    finish(total: number): DrawList {
      return { text, rects, lines, images, flipMark: paper.flipMark, total }
    },
  }
}
