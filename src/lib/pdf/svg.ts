import { PAGE_HEIGHT, PAGE_WIDTH, type DrawList } from './types'

/* ============================================================================
   THE PROOF

   The same draw list the PDF writer consumes, rendered as SVG so the document
   can be looked at before it is sent. Text is positioned rather than flowed,
   and kerning and ligatures are switched off, so what is on screen is what
   lands in the file.
   ========================================================================== */

const esc = (value: string) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function buildSVG(
  draw: DrawList,
  options: { markDataUrl?: string } = {},
): string {
  const filter = draw.flipMark
    ? '<filter id="flipmark" color-interpolation-filters="sRGB">' +
      '<feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"/></filter>'
    : ''
  const markFilter = draw.flipMark ? ' filter="url(#flipmark)"' : ''

  const body = [
    ...draw.rects.map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}"/>`,
    ),
    ...(options.markDataUrl
      ? draw.images.map(
          (i) =>
            `<image href="${options.markDataUrl}" x="${i.x}" y="${i.y}" width="${i.w}" height="${i.h}"${markFilter}/>`,
        )
      : []),
    ...draw.lines.map(
      (l) =>
        `<line x1="${l.x1}" y1="${l.y}" x2="${l.x2}" y2="${l.y}" stroke="${l.c}" stroke-width="1"/>`,
    ),
    ...draw.text
      .filter((o) => o.text !== '')
      .map(
        (o) =>
          `<text x="${o.x}" y="${o.y}" text-anchor="${o.anchor}" font-family="${
            o.font === 'sb' ? 'InterSB' : 'InterRG'
          }" font-size="${o.size}" fill="${o.fill}">${esc(o.text)}</text>`,
      ),
  ].join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}pt" height="${PAGE_HEIGHT}pt" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">
<defs>${filter}<style>
text{font-kerning:none;font-variant-ligatures:none;white-space:pre}
</style></defs>
${body}
</svg>`
}
