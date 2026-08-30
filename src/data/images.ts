/**
 * Curated photography.
 *
 * Each id was checked to resolve, then reviewed on a contact sheet and sorted
 * into a themed set so a project's cover and its moodboard read as one body of
 * work rather than a random assortment. If a URL ever fails, `Img` swaps in the
 * generated artwork from lib/art.ts, so nothing here is load-bearing.
 */

type Preset = 'cover' | 'card' | 'tile' | 'thumb' | 'full'

const SIZES: Record<Preset, { w: number; h?: number; q: number }> = {
  full: { w: 1600, q: 80 },
  cover: { w: 1200, q: 75 },
  card: { w: 800, q: 72 },
  tile: { w: 560, q: 70 },
  thumb: { w: 160, h: 160, q: 60 },
}

export function photo(id: string, preset: Preset = 'card'): string {
  const size = SIZES[preset]
  const params = new URLSearchParams({
    auto: 'format',
    fit: 'crop',
    w: String(size.w),
    q: String(size.q),
  })
  if (size.h) params.set('h', String(size.h))
  return `https://images.unsplash.com/photo-${id}?${params.toString()}`
}

/** Themed sets, matched to the demo client roster. */
export const PHOTO_SETS = {
  /** Fold & Field — furniture and interiors. */
  interiors: [
    '1502672260266-1c1ef2d93688',
    '1567016432779-094069958ea5',
    '1558211583-d26f610c1eb1',
    '1567538096630-e0c55bd6374c',
    '1594026112284-02bb6f3352fe',
    '1616486338812-3dadae4b4ace',
    '1616627547584-bf28cee262db',
    '1631679706909-1844bbd07221',
    '1586023492125-27b2c045efd7',
    '1615873968403-89e068629265',
    '1618220179428-22790b461013',
    '1616137466211-f939a420be84',
  ],
  /** Marrow — restaurant group. */
  food: [
    '1414235077428-338989a2e8c0',
    '1467003909585-2f8a72700288',
    '1476224203421-9ac39bcb3327',
    '1482049016688-2d3e1b311543',
    '1504674900247-0877df9cc836',
    '1600891964092-4316c288032e',
    '1533777419517-3e4017e2e15a',
    '1517248135467-4c7edcad34c4',
    '1521017432531-fbd92d768814',
    '1555396273-367ea4eb4db5',
  ],
  /** Northbound — outdoor and travel. */
  landscape: [
    '1426604966848-d7adac402bff',
    '1441974231531-c6227db76b6e',
    '1444927714506-8492d94b4e3d',
    '1447752875215-b2761acb3c5d',
    '1476820865390-c52aeebb9891',
    '1493246507139-91e8fad9978e',
    '1500534314209-a25ddb2bd429',
    '1502082553048-f009c37129b9',
    '1509316975850-ff9c5deb0cd9',
    '1513694203232-719a280e022f',
    '1518495973542-4542c06a5843',
    '1524429656589-6633a470097c',
  ],
  /** Third Slope — coffee roaster. */
  coffee: [
    '1447933601403-0c6688de566e',
    '1495474472287-4d71bcdd2085',
    '1509042239860-f550ce710b93',
    '1544787219-7f47ccb76574',
    '1559496417-e7f25cb247f3',
  ],
  /** Atrium — architecture practice. */
  architecture: [
    '1487958449943-2429e8be8625',
    '1497366754035-f200968a6e72',
    '1524230572899-a752b3835840',
    '1600566753190-17f0baa2a6c3',
    '1600585154340-be6161a56a0c',
    '1600585154526-990dced4db0d',
    '1600607686527-6fb886090705',
    '1600566752355-35792bedcfea',
  ],
  /** Salt & Tide — wellness and skincare. */
  water: [
    '1505144808419-1957a94ca61e',
    '1507525428034-b723cf961d3e',
    '1615529328331-f8917597711f',
    '1449247709967-d4461a6a6103',
    '1481277542470-605612bd2d61',
    '1519710164239-da123dc03ef4',
    '1567225557594-88d73e55f2cb',
  ],
  /** Studio life — used for activity, team and process imagery. */
  studio: [
    '1493421419110-74f4e85ba126',
    '1497215842964-222b430dc094',
    '1517245386807-bb43f82c33c4',
    '1522202176988-66273c2fd55f',
    '1524758631624-e2822e304c36',
    '1531403009284-440f080d1e12',
    '1531482615713-2afd69097998',
    '1531973576160-7125cd663d86',
    '1552664730-d307ca884978',
    '1553877522-43269d4ea984',
    '1600880292203-757bb62b4baf',
    '1519389950473-47ba0277781c',
  ],
  /** Abstract fields used for material and texture references. */
  texture: [
    '1550684376-efcbd6e3f031',
    '1541701494587-cb58502866ab',
    '1618005182384-a83a8bd57fbe',
    '1616627561950-9f746e330187',
    '1550745165-9bc0b252726f',
    '1461988320302-91bde64fc8e4',
    '1513475382585-d06e58bcb0e0',
    '1439066615861-d1af74d74000',
  ],
} as const

export type PhotoSet = keyof typeof PHOTO_SETS

/** Deterministically pick the nth photo from a set, wrapping around. */
export function fromSet(set: PhotoSet, index: number, preset: Preset = 'card'): string {
  const list = PHOTO_SETS[set]
  return photo(list[index % list.length], preset)
}

/**
 * Portraits. Uses the `pravatar` avatar service, which returns a stable face
 * for a given id — the `Avatar` component falls back to tinted initials.
 */
export function portrait(seed: number): string {
  return `https://i.pravatar.cc/240?img=${seed}`
}
