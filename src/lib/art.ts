import { seededRandom, hashCode } from './utils'

/**
 * Deterministic generative cover art.
 *
 * Used as the fallback whenever a remote photograph fails to load (offline, a
 * dead URL) and as the identity mark for records that have no photo of their
 * own. The same seed always produces the same artwork, so a project's visual
 * identity is stable across sessions and reloads.
 *
 * The five programs are drawn from the reference material: clustered spheres,
 * diagonal hatch fields, concentric arcs, soft blob meshes, and dot matrices.
 */

export type ArtProgram = 'spheres' | 'hatch' | 'arcs' | 'mesh' | 'matrix'

const PALETTES: Array<{ bg: string; ink: string; accent: string; soft: string }> = [
  { bg: '#e7e7e5', ink: '#0a0a0a', accent: '#c7f33c', soft: '#e1f2ae' },
  { bg: '#0a0a0a', ink: '#f2f2f0', accent: '#c7f33c', soft: '#5c7017' },
  { bg: '#e1f2ae', ink: '#1c2408', accent: '#0a0a0a', soft: '#c7f33c' },
  { bg: '#dedeDB', ink: '#0a0a0a', accent: '#b2dd2a', soft: '#f2f2f0' },
  { bg: '#c7f33c', ink: '#0a0a0a', accent: '#0a0a0a', soft: '#eff8d5' },
]

const PROGRAMS: ArtProgram[] = ['spheres', 'hatch', 'arcs', 'mesh', 'matrix']

function esc(svg: string): string {
  // encodeURIComponent keeps the data URI valid for '#' and '<' without base64.
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`
}

function spheres(rand: () => number, p: (typeof PALETTES)[number], w: number, h: number): string {
  const count = 16 + Math.floor(rand() * 14)
  const cx = w * (0.35 + rand() * 0.3)
  const cy = h * (0.4 + rand() * 0.25)
  let out = ''
  for (let i = 0; i < count; i += 1) {
    const angle = rand() * Math.PI * 2
    const dist = Math.pow(rand(), 0.6) * Math.min(w, h) * 0.42
    const r = (1 - dist / (Math.min(w, h) * 0.5)) * (Math.min(w, h) * 0.11) + rand() * 8 + 4
    const x = cx + Math.cos(angle) * dist
    const y = cy + Math.sin(angle) * dist * 0.85
    const fill = i % 5 === 0 ? p.soft : p.accent
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="${(0.55 + rand() * 0.45).toFixed(2)}"/>`
    // A small offset highlight reads as a specular dot, giving the cluster volume.
    out += `<circle cx="${(x - r * 0.3).toFixed(1)}" cy="${(y - r * 0.34).toFixed(1)}" r="${(r * 0.26).toFixed(1)}" fill="#ffffff" opacity="0.3"/>`
  }
  // A scatter of fine grains echoes the particle dissolve in the references.
  for (let i = 0; i < 40; i += 1) {
    out += `<circle cx="${(rand() * w).toFixed(1)}" cy="${(rand() * h).toFixed(1)}" r="${(rand() * 2.4 + 0.6).toFixed(1)}" fill="${p.accent}" opacity="${(rand() * 0.5).toFixed(2)}"/>`
  }
  return out
}

function hatch(rand: () => number, p: (typeof PALETTES)[number], w: number, h: number): string {
  const gap = 7 + rand() * 6
  let lines = ''
  for (let x = -h; x < w + h; x += gap) {
    lines += `<line x1="${x.toFixed(1)}" y1="0" x2="${(x + h).toFixed(1)}" y2="${h}" stroke="${p.ink}" stroke-width="1.1" opacity="0.14"/>`
  }
  const bandCount = 2 + Math.floor(rand() * 2)
  let bands = ''
  for (let i = 0; i < bandCount; i += 1) {
    const by = rand() * h * 0.7
    const bh = h * (0.1 + rand() * 0.22)
    bands += `<rect x="0" y="${by.toFixed(1)}" width="${w}" height="${bh.toFixed(1)}" fill="${i === 0 ? p.accent : p.soft}" opacity="${(0.55 + rand() * 0.35).toFixed(2)}"/>`
  }
  return `${bands}${lines}`
}

function arcs(rand: () => number, p: (typeof PALETTES)[number], w: number, h: number): string {
  const cx = w * (0.2 + rand() * 0.6)
  const cy = h * (0.3 + rand() * 0.5)
  const rings = 5 + Math.floor(rand() * 5)
  let out = ''
  for (let i = rings; i > 0; i -= 1) {
    const r = (i / rings) * Math.max(w, h) * 0.62
    const filled = i % 3 === 0
    out += filled
      ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${i % 2 === 0 ? p.accent : p.soft}" opacity="0.5"/>`
      : `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${p.ink}" stroke-width="1.2" opacity="0.2"/>`
  }
  out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(Math.max(w, h) * 0.08).toFixed(1)}" fill="${p.accent}"/>`
  return out
}

function mesh(rand: () => number, p: (typeof PALETTES)[number], w: number, h: number): string {
  let out = ''
  const blobs = 3 + Math.floor(rand() * 3)
  for (let i = 0; i < blobs; i += 1) {
    const cx = rand() * w
    const cy = rand() * h
    const r = (0.28 + rand() * 0.4) * Math.max(w, h)
    const fill = i === 0 ? p.accent : i === 1 ? p.soft : p.ink
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity="${(0.2 + rand() * 0.4).toFixed(2)}" filter="url(#soften)"/>`
  }
  return out
}

function matrix(rand: () => number, p: (typeof PALETTES)[number], w: number, h: number): string {
  const cols = 9 + Math.floor(rand() * 5)
  const cell = w / cols
  const rows = Math.ceil(h / cell)
  let out = ''
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const roll = rand()
      if (roll < 0.42) continue
      const pad = cell * 0.12
      const fill = roll > 0.86 ? p.accent : roll > 0.66 ? p.soft : p.ink
      const opacity = fill === p.ink ? 0.08 : 0.9
      out += `<rect x="${(c * cell + pad).toFixed(1)}" y="${(r * cell + pad).toFixed(1)}" width="${(cell - pad * 2).toFixed(1)}" height="${(cell - pad * 2).toFixed(1)}" rx="${(cell * 0.22).toFixed(1)}" fill="${fill}" opacity="${opacity}"/>`
    }
  }
  return out
}

/**
 * Build an inline SVG data URI for the given seed.
 * @param seed  any stable string — a record id works well
 * @param ratio width/height of the artwork box
 */
export function generateArt(seed: string, ratio = 4 / 3, program?: ArtProgram): string {
  const rand = seededRandom(seed)
  const palette = PALETTES[hashCode(seed) % PALETTES.length]
  const chosen = program ?? PROGRAMS[hashCode(`${seed}-p`) % PROGRAMS.length]
  const w = 800
  const h = Math.round(w / ratio)

  const body =
    chosen === 'spheres'
      ? spheres(rand, palette, w, h)
      : chosen === 'hatch'
        ? hatch(rand, palette, w, h)
        : chosen === 'arcs'
          ? arcs(rand, palette, w, h)
          : chosen === 'mesh'
            ? mesh(rand, palette, w, h)
            : matrix(rand, palette, w, h)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <filter id="soften" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="${chosen === 'mesh' ? 58 : 0}"/>
      </filter>
      <clipPath id="frame"><rect width="${w}" height="${h}"/></clipPath>
    </defs>
    <rect width="${w}" height="${h}" fill="${palette.bg}"/>
    <g clip-path="url(#frame)">${body}</g>
  </svg>`

  return esc(svg)
}

/**
 * A tiny square mark for companies that have no logo — the monogram sits on
 * generated art so directory rows still feel designed rather than empty.
 */
export function generateMark(seed: string): string {
  return generateArt(seed, 1, PROGRAMS[hashCode(seed) % PROGRAMS.length])
}

/** Stable avatar background for a person with no photo. */
export function avatarTint(seed: string): { bg: string; fg: string } {
  const tints = [
    { bg: '#e1f2ae', fg: '#2a3410' },
    { bg: '#dedeDB', fg: '#0a0a0a' },
    { bg: '#0a0a0a', fg: '#f2f2f0' },
    { bg: '#c7f33c', fg: '#0a0a0a' },
    { bg: '#cdd8e6', fg: '#1d2a3a' },
    { bg: '#e9d9c8', fg: '#3a2a1d' },
  ]
  return tints[hashCode(seed) % tints.length]
}

/* ============================================================================
   GENERATED PORTRAITS

   The demo studio used to point at a third-party avatar service. That made a
   person's face depend on someone else's uptime, which is a silly thing for a
   CRM to be fragile about. These are drawn locally from the same seed the rest
   of the identity system uses, so they cannot 404, work offline, and stay
   stable for a given person forever.

   A real uploaded picture always wins over one of these.
   ========================================================================== */

/** Deterministic abstract portrait: a figure in the studio palette. */
export function generatePortrait(seed: string): string {
  const rand = seededRandom(`${seed}-portrait`)
  const palette = PALETTES[hashCode(`${seed}-p`) % PALETTES.length]
  const size = 256

  // Head sits slightly above centre, shoulders run off the bottom edge.
  const cx = size / 2 + (rand() - 0.5) * 14
  const headR = size * (0.19 + rand() * 0.04)
  const headY = size * (0.38 + rand() * 0.03)
  const shoulderR = size * (0.34 + rand() * 0.06)
  const shoulderY = headY + headR + shoulderR * 0.62

  // One accent shape behind the figure keeps them from reading as identical.
  const arcR = size * (0.3 + rand() * 0.22)
  const arcX = rand() * size
  const arcY = rand() * size * 0.6

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${palette.bg}"/>
    <circle cx="${arcX.toFixed(1)}" cy="${arcY.toFixed(1)}" r="${arcR.toFixed(1)}" fill="${palette.accent}" opacity="0.32"/>
    <circle cx="${cx.toFixed(1)}" cy="${shoulderY.toFixed(1)}" r="${shoulderR.toFixed(1)}" fill="${palette.ink}" opacity="0.9"/>
    <circle cx="${cx.toFixed(1)}" cy="${headY.toFixed(1)}" r="${headR.toFixed(1)}" fill="${palette.ink}" opacity="0.9"/>
    <circle cx="${(cx - headR * 0.32).toFixed(1)}" cy="${(headY - headR * 0.3).toFixed(1)}" r="${(headR * 0.28).toFixed(1)}" fill="${palette.bg}" opacity="0.18"/>
  </svg>`

  return esc(svg)
}
