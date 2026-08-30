import type { MoodItem, MoodSection, Moodboard, MoodPayload } from '../types'
import { fromSet, type PhotoSet } from '../images'
import { d, t } from './clock'

/* ============================================================================
   MOODBOARDS
   Written as a compact spec and expanded by `board()` below, so the content
   stays readable and every project gets a board worth opening.
   ========================================================================== */

type ItemSpec =
  | {
      k: 'image' | 'shot' | 'material'
      set: PhotoSet
      i: number
      ratio?: number
      cap: string
      tags?: string[]
      pin?: boolean
      note?: string
    }
  | { k: 'color'; hex: string; name: string; cap: string; tags?: string[]; pin?: boolean }
  | {
      k: 'type'
      family: string
      stack: string
      weight: number
      sample: string
      usage: string
      cap: string
      tags?: string[]
      pin?: boolean
    }
  | { k: 'link'; url: string; title: string; site: string; cap: string; tags?: string[]; pin?: boolean }
  | { k: 'note'; body: string; cap: string; tags?: string[]; pin?: boolean }

type SectionSpec = { title: string; description?: string; items: ItemSpec[] }

const boards: Moodboard[] = []
const sections: MoodSection[] = []
const items: MoodItem[] = []

let itemSeq = 0

function payloadFor(spec: ItemSpec, seedBase: string): MoodPayload {
  switch (spec.k) {
    case 'image':
    case 'shot':
    case 'material':
      return {
        kind: spec.k,
        url: fromSet(spec.set, spec.i, 'tile'),
        artSeed: `${seedBase}-${spec.i}`,
        ratio: spec.ratio ?? 4 / 3,
      }
    case 'color':
      return { kind: 'color', hex: spec.hex, name: spec.name }
    case 'type':
      return {
        kind: 'type',
        family: spec.family,
        stack: spec.stack,
        weight: spec.weight,
        sample: spec.sample,
        usage: spec.usage,
      }
    case 'link':
      return { kind: 'link', url: spec.url, title: spec.title, site: spec.site }
    case 'note':
      return { kind: 'note', body: spec.body }
  }
}

/** Rotate contributors so boards look like a team built them, not one person. */
const CONTRIBUTORS = ['tm_dez', 'tm_ivy', 'tm_noor', 'tm_tomas', 'tm_marco']

function board(
  projectId: string,
  title: string,
  updatedDaysAgo: number,
  specs: SectionSpec[],
): void {
  const boardId = `mb_${projectId.replace('pj_', '')}`
  boards.push({ id: boardId, projectId, title, updatedAt: t(-updatedDaysAgo, 15) })

  specs.forEach((section, sIndex) => {
    const sectionId = `${boardId}_s${sIndex}`
    sections.push({
      id: sectionId,
      boardId,
      title: section.title,
      description: section.description,
      order: sIndex,
    })

    section.items.forEach((spec, iIndex) => {
      itemSeq += 1
      items.push({
        id: `${sectionId}_i${iIndex}`,
        boardId,
        sectionId,
        order: iIndex,
        kind: spec.k,
        payload: payloadFor(spec, `${boardId}-${sIndex}-${iIndex}`),
        caption: spec.cap,
        tags: spec.tags ?? [],
        note: 'note' in spec ? spec.note : undefined,
        pinned: spec.pin ?? false,
        addedBy: CONTRIBUTORS[itemSeq % CONTRIBUTORS.length],
        createdAt: t(-(updatedDaysAgo + (specs.length - sIndex) * 2 + iIndex), 11, 20),
      })
    })
  })
}

/* --------------------------------------------------------- Quiet Objects -- */

board('pj_quiet', 'Quiet Objects — AW campaign', 1, [
  {
    title: 'The feeling',
    description: 'Rooms that look lived in. Nothing arranged for the camera.',
    items: [
      { k: 'image', set: 'interiors', i: 0, ratio: 3 / 4, cap: 'Morning, unmade. The reference for the whole film.', pin: true, tags: ['tag_campaign'] },
      { k: 'image', set: 'interiors', i: 3, ratio: 4 / 3, cap: 'Chair in use, not on a plinth' },
      { k: 'image', set: 'interiors', i: 9, ratio: 1, cap: 'Overcast light through a north window' },
      { k: 'note', body: 'Karin: "If it looks like a catalogue we have failed." Pin this at the top of every review.', cap: 'From the kick-off', pin: true },
      { k: 'image', set: 'interiors', i: 6, ratio: 3 / 4, cap: 'Depth of field — the object is not always sharp' },
      { k: 'image', set: 'interiors', i: 11, ratio: 4 / 3, cap: 'Wide, low, patient' },
    ],
  },
  {
    title: 'Palette',
    description: 'Pulled from the collection itself, not chosen separately.',
    items: [
      { k: 'color', hex: '#E7E4DC', name: 'Raw linen', cap: 'Base — 70% of every frame', pin: true },
      { k: 'color', hex: '#8A7F6F', name: 'Dry oak', cap: 'The wood as photographed, not as swatched' },
      { k: 'color', hex: '#2B2B28', name: 'Iron', cap: 'Frames, fixings, type' },
      { k: 'color', hex: '#9CA88B', name: 'Bay', cap: 'The single accent. Sparing.' },
      { k: 'material', set: 'texture', i: 3, ratio: 1, cap: 'Wool boucle — the AW upholstery' },
      { k: 'material', set: 'texture', i: 6, ratio: 1, cap: 'Unfinished oak end grain' },
    ],
  },
  {
    title: 'Type & titles',
    items: [
      { k: 'type', family: 'Instrument Serif', stack: "'Instrument Serif', Georgia, serif", weight: 400, sample: 'Quiet Objects', usage: 'End card only. Set large, set once.', cap: 'Film title card', pin: true },
      { k: 'type', family: 'Inter', stack: "'Inter', Helvetica, Arial, sans-serif", weight: 400, sample: 'Autumn / Winter', usage: 'Captions and product names. 11pt, wide tracking.', cap: 'Supporting' },
      { k: 'link', url: 'https://fontsinuse.com', title: 'Serif + grotesque pairings in furniture catalogues', site: 'fontsinuse.com', cap: 'Precedent for the pairing' },
    ],
  },
])

/* ---------------------------------------------------- Showroom identity -- */

board('pj_showroom', 'Showroom system', 4, [
  {
    title: 'Signage in architecture',
    description: 'Part of the building, not applied to it.',
    items: [
      { k: 'image', set: 'architecture', i: 0, ratio: 3 / 4, cap: 'Cut into the wall, not hung on it', pin: true },
      { k: 'image', set: 'architecture', i: 2, ratio: 4 / 3, cap: 'Shadow does the contrast work' },
      { k: 'image', set: 'architecture', i: 5, ratio: 1, cap: 'Edge-lit, no visible fixings' },
      { k: 'image', set: 'interiors', i: 5, ratio: 4 / 3, cap: 'Scale reference in a real store' },
    ],
  },
  {
    title: 'Materials',
    items: [
      { k: 'color', hex: '#B9AE9B', name: 'Oiled oak', cap: 'Primary — matches the fixtures' },
      { k: 'color', hex: '#3C3F3A', name: 'Powder steel', cap: 'Secondary, RAL 7026 nearest' },
      { k: 'material', set: 'texture', i: 0, ratio: 1, cap: 'Brushed finish direction matters' },
      { k: 'note', body: 'Copenhagen is a listed building — no penetrating fixings. Everything there is freestanding or magnet-mounted.', cap: 'Hard constraint', pin: true, tags: ['tag_priority'] },
    ],
  },
])

/* ------------------------------------------------------- Marrow No.3 --- */

board('pj_marrow3', 'Marrow No.3', 0, [
  {
    title: 'Room & mood',
    description: 'Warmer and looser than No.1. A room you stay in.',
    items: [
      { k: 'image', set: 'food', i: 7, ratio: 4 / 3, cap: 'Low light, high contrast, warm', pin: true },
      { k: 'image', set: 'food', i: 8, ratio: 3 / 4, cap: 'The bar as the centre of the room' },
      { k: 'image', set: 'food', i: 6, ratio: 4 / 3, cap: 'Full table, mid-meal, hands in frame' },
      { k: 'image', set: 'food', i: 0, ratio: 1, cap: 'Plating — restrained, not tweezered' },
      { k: 'image', set: 'food', i: 3, ratio: 3 / 4, cap: 'Texture close-up for the menu covers' },
    ],
  },
  {
    title: 'Type direction',
    description: 'Rue reads type first. Get this right and the rest follows.',
    items: [
      { k: 'type', family: 'Instrument Serif Italic', stack: "'Instrument Serif', Georgia, serif", weight: 400, sample: 'Marrow', usage: 'Wordmark candidate. Italic, tight, set by hand.', cap: 'Route A — editorial', pin: true },
      { k: 'type', family: 'Times New Roman', stack: "'Times New Roman', Times, serif", weight: 700, sample: 'No. 3', usage: 'Numerals only. Borrowed from the 1920s facade lettering.', cap: 'Route B — building' },
      { k: 'type', family: 'Courier New', stack: "'Courier New', Courier, monospace", weight: 400, sample: 'WEST LOOP', usage: 'Operational type — dockets, stamps, back-of-house.', cap: 'Utility layer' },
      { k: 'link', url: 'https://www.itsnicethat.com', title: 'Restaurant identities that age well', site: 'itsnicethat.com', cap: 'Sent by Rue, worth reading' },
    ],
  },
  {
    title: 'Palette & ink',
    items: [
      { k: 'color', hex: '#7A1F1F', name: 'Ox blood', cap: 'The one saturated accent', pin: true },
      { k: 'color', hex: '#E8E2D4', name: 'Uncoated cream', cap: 'Menu stock' },
      { k: 'color', hex: '#1A1815', name: 'Soot', cap: 'Text and rules' },
      { k: 'note', body: 'Facade is protected — nothing above the door line. All exterior identity has to work in the window and on the awning.', cap: 'Planning constraint', tags: ['tag_priority'] },
    ],
  },
])

/* --------------------------------------------------------- Menu system -- */

board('pj_menu', 'Menu & print', 9, [
  {
    title: 'Set by a non-designer',
    items: [
      { k: 'note', body: 'The real test: front-of-house sets Tuesday’s menu in fifteen minutes with no help. Every decision serves that.', cap: 'The brief in one line', pin: true },
      { k: 'image', set: 'food', i: 9, ratio: 4 / 3, cap: 'Reading conditions — this is the actual light level' },
      { k: 'type', family: 'Inter', stack: "'Inter', Helvetica, sans-serif", weight: 500, sample: 'Wood pigeon, quince', usage: 'One family, three sizes. 10pt minimum.', cap: 'The whole type system', pin: true },
      { k: 'color', hex: '#EFE9DC', name: 'House stock', cap: '120gsm uncoated, laser-safe' },
    ],
  },
])

/* -------------------------------------------------------- Trail Season -- */

board('pj_trail', 'Trail Season', 2, [
  {
    title: 'The middle of the trip',
    description: 'Not the summit. The fourth wet morning.',
    items: [
      { k: 'image', set: 'landscape', i: 4, ratio: 3 / 4, cap: 'Weather as a character', pin: true, tags: ['tag_motion'] },
      { k: 'image', set: 'landscape', i: 8, ratio: 4 / 3, cap: 'Fog — we shot two days of this and it is the best material' },
      { k: 'image', set: 'landscape', i: 1, ratio: 4 / 3, cap: 'Scale without a drone' },
      { k: 'image', set: 'landscape', i: 10, ratio: 1, cap: 'Ground texture, cutaway' },
      { k: 'image', set: 'landscape', i: 6, ratio: 3 / 4, cap: 'Last light, handheld' },
      { k: 'image', set: 'landscape', i: 2, ratio: 4 / 3, cap: 'The road out — closing frame candidate' },
    ],
  },
  {
    title: 'Grade',
    items: [
      { k: 'color', hex: '#4A5340', name: 'Wet moss', cap: 'Midtones sit here' },
      { k: 'color', hex: '#8E96A0', name: 'Rain grey', cap: 'No blue push. Keep it neutral.' },
      { k: 'color', hex: '#C97B4A', name: 'Shell orange', cap: 'The only saturated thing in frame — the jacket' },
      { k: 'material', set: 'texture', i: 4, ratio: 1, cap: 'Ripstop under water' },
      { k: 'note', body: 'Wren: no drone shots. If it could not be seen by someone walking, it does not go in.', cap: 'Non-negotiable', pin: true, tags: ['tag_priority'] },
    ],
  },
  {
    title: 'Sound',
    items: [
      { k: 'link', url: 'https://www.nfb.ca', title: 'Observational documentary sound design references', site: 'nfb.ca', cap: 'Marco’s reference reel' },
      { k: 'note', body: 'Music clearance still open — the temp track will not clear. Need two alternates before picture lock.', cap: 'Blocking picture lock', tags: ['tag_priority'] },
    ],
  },
])

/* ------------------------------------------------- Northbound discovery -- */

board('pj_nbrebrand', 'Rebrand discovery', 3, [
  {
    title: 'Category audit',
    description: 'Where everyone else already is.',
    items: [
      { k: 'image', set: 'landscape', i: 3, ratio: 4 / 3, cap: 'The category default: summit, sunrise, hero' },
      { k: 'image', set: 'landscape', i: 11, ratio: 4 / 3, cap: 'Also the default. Everyone owns this.' },
      { k: 'note', body: 'Eleven of the fourteen brands audited use the same three visual moves. The opportunity is in what they all avoid: boredom, wet, ordinary.', cap: 'Early finding', pin: true },
    ],
  },
  {
    title: 'Territory sketches',
    description: 'Mood and language only — no logos this early.',
    items: [
      { k: 'type', family: 'Inter', stack: "'Inter', Helvetica, sans-serif", weight: 600, sample: 'THE LONG WAY', usage: 'Territory 1 — plain, functional, unglamorous.', cap: 'Territory 1' },
      { k: 'type', family: 'Instrument Serif', stack: "'Instrument Serif', Georgia, serif", weight: 400, sample: 'Field Notes', usage: 'Territory 2 — observational, journal-like.', cap: 'Territory 2' },
      { k: 'color', hex: '#5C6B54', name: 'Territory 1 — Lichen', cap: 'Muted, worn-in' },
      { k: 'color', hex: '#2E3A46', name: 'Territory 2 — Slate', cap: 'Cold, documentary' },
    ],
  },
])

/* ------------------------------------------------------- Third Slope --- */

board('pj_slope', 'Packaging refresh', 5, [
  {
    title: 'Shelf reality',
    items: [
      { k: 'image', set: 'coffee', i: 0, ratio: 3 / 4, cap: 'Two metres away, poor light. The real test.', pin: true },
      { k: 'image', set: 'coffee', i: 2, ratio: 1, cap: 'Bag in hand — scale check' },
      { k: 'image', set: 'coffee', i: 4, ratio: 4 / 3, cap: 'Café context for the wholesale sack' },
      { k: 'note', body: 'Bo joined after approval and raised legibility at distance. He is right. The origin type needs to roughly double.', cap: 'Why this reopened', pin: true, tags: ['tag_priority'] },
    ],
  },
  {
    title: 'Substrate',
    description: 'Mina will judge this by touch before she looks at it.',
    items: [
      { k: 'material', set: 'texture', i: 7, ratio: 1, cap: 'Kraft, unbleached, visible fibre' },
      { k: 'material', set: 'texture', i: 5, ratio: 1, cap: 'One-colour soy ink on uncoated' },
      { k: 'color', hex: '#A8845C', name: 'Kraft', cap: 'The substrate is the base colour' },
      { k: 'color', hex: '#1F1B16', name: 'Soy black', cap: 'The only ink. One pass.' },
      { k: 'link', url: 'https://www.wearepapercut.com', title: 'Kerbside-recyclable coffee packaging suppliers', site: 'papercut.com', cap: 'Supplier shortlist' },
    ],
  },
])

/* ----------------------------------------------------- Atrium monograph -- */

board('pj_atrium', 'Site & monograph', 6, [
  {
    title: 'The page first',
    description: 'Elke judges every screen as a spread. Design the book, inherit the site.',
    items: [
      { k: 'image', set: 'architecture', i: 4, ratio: 4 / 3, cap: 'Generous margin, single image, no caption crowding', pin: true },
      { k: 'image', set: 'architecture', i: 1, ratio: 3 / 4, cap: 'Full bleed, once per chapter' },
      { k: 'image', set: 'architecture', i: 6, ratio: 4 / 3, cap: 'Plan drawings sit on the grid, not in a box' },
      { k: 'image', set: 'architecture', i: 7, ratio: 1, cap: 'Detail crop — archive entry test case' },
    ],
  },
  {
    title: 'Typography',
    items: [
      { k: 'type', family: 'Instrument Serif', stack: "'Instrument Serif', Georgia, serif", weight: 400, sample: 'On Repair', usage: 'Essay text and chapter openers. 11/16.', cap: 'Reading face', pin: true },
      { k: 'type', family: 'Inter', stack: "'Inter', Helvetica, sans-serif", weight: 400, sample: 'Rotterdam, 2019–2024', usage: 'Captions, credits, metadata. 8/12, all lining figures.', cap: 'Caption face' },
      { k: 'note', body: 'Some photographers have print-only licences. The archive schema needs a per-image "web permitted" flag or the site will breach.', cap: 'Schema requirement', pin: true },
    ],
  },
])

/* ------------------------------------------------------------- Ritual -- */

board('pj_ritual', 'Ritual line', 48, [
  {
    title: 'Delivered',
    description: 'Kept for reference — the range is in market.',
    items: [
      { k: 'image', set: 'water', i: 0, ratio: 3 / 4, cap: 'Launch key visual' },
      { k: 'image', set: 'water', i: 2, ratio: 4 / 3, cap: 'Wet stone, cold light' },
      { k: 'image', set: 'water', i: 4, ratio: 1, cap: 'Pack in situ' },
      { k: 'color', hex: '#D9D6CE', name: 'Sea salt', cap: 'Primary pack' },
      { k: 'color', hex: '#3F4B4E', name: 'Deep tide', cap: 'Refill pack' },
      { k: 'type', family: 'Inter', stack: "'Inter', Helvetica, sans-serif", weight: 300, sample: 'ritual', usage: 'Lowercase, very small, very wide.', cap: 'Wordmark as shipped' },
    ],
  },
])

export const moodboards = boards
export const moodSections = sections
export const moodItems = items

/** Convenience for the "last updated" copy on the moodboard index. */
export const MOODBOARD_UPDATED: Record<string, string> = Object.fromEntries(
  boards.map((b) => [b.id, b.updatedAt]),
)

export const MOODBOARD_SEED_DATE = d(0)
