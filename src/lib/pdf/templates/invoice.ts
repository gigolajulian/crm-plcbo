import type { BillingProfile, LineItem } from '@/data/types'
import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  createCanvas,
  type DrawList,
  type TemplateContext,
} from '../types'

/* ============================================================================
   INVOICE / QUOTE

   Geometry measured from the reference PDF and kept to the decimal — this is
   the studio's existing document, not a new one. Every coordinate below was
   derived from the original rather than eyeballed, which is why they are odd
   numbers.

   The only structural change from the standalone generator is that the sender
   block, the recipient and the line items are read from the CRM instead of
   being typed in.
   ========================================================================== */

/** Right margin of the right-hand column. */
const RIGHT = 535.7
/** First table row baseline, and the distance between rows. */
const ROW0 = 407.75
const PITCH = 19
/** Height of the tinted band behind the header. */
const BAND_H = 347
/** The notes block starts here, which is what caps the table at eight lines. */
export const MAX_LINE_ITEMS = 8

export interface DocumentData {
  /** Masthead word — "INVOICE" or "QUOTE". */
  title: string
  number: string
  /** Already formatted for display, e.g. "8/31/2026". */
  date: string
  numberLabel: string
  dateLabel: string
  recipientName: string
  recipientEmail: string
  recipientPhone: string
  items: LineItem[]
  notes: string
  signoff: string
  billing: BillingProfile
  /** ISO 4217 code printed after each figure. */
  currency: string
}

export function layoutInvoice(data: DocumentData, ctx: TemplateContext): DrawList {
  const { paper, fonts } = ctx
  const { DARK, GREY, SLATE, BLUE, RULE } = paper
  const c = createCanvas(paper)

  const money = (n: number) => `${n.toFixed(2)} ${data.currency}`
  const W = (s: string, size: number, font: 'sb' | 'rg' = 'sb') =>
    (font === 'rg' ? fonts.rg : fonts.sb).width(s, size)

  c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, paper.PAGE)
  c.rect(0, 0, PAGE_WIDTH, BAND_H, paper.BAND)
  c.image(59, 51, 72, 72)
  c.image(471, 791, 42, 42)

  /* ------------------------------------------------------------- header -- */
  c.t(445.0, 195.31, 22, DARK, data.title)
  c.t(58.44, 196.75, 8, DARK, 'RECIPIENT')
  c.t(58.44, 224.58, 11, GREY, data.recipientName, 'rg')

  if (data.recipientPhone) {
    c.t(58.0, 299.85, 8, BLUE, 'm')
    c.t(72.2, 299.85, 8, GREY, data.recipientPhone)
  }
  if (data.recipientEmail) {
    c.t(59.4, 312.85, 8, BLUE, 'e')
    c.t(68.2, 312.85, 8, GREY, data.recipientEmail)
  }

  c.t(487.0, 222.75, 8, DARK, data.numberLabel)
  c.t(RIGHT, 235.75, 8, GREY, data.number, 'sb', 'end')
  c.t(480.0, 261.75, 8, DARK, data.dateLabel)
  c.t(RIGHT, 274.75, 8, GREY, data.date, 'sb', 'end')

  /* Sender contact — right-aligned, with the icon keeping its measured gap. */
  const billing = data.billing
  if (billing.email) {
    const emailLeft = RIGHT - W(billing.email, 8, 'rg')
    c.t(emailLeft - 8.01 - W('@', 8), 134.75, 8, BLUE, '@')
    c.t(emailLeft, 135.75, 8, GREY, billing.email, 'rg')
  }
  if (billing.phone) {
    const phoneLeft = RIGHT - W(billing.phone, 8)
    c.t(phoneLeft - 9.82 - W('m', 8), 149.75, 8, BLUE, 'm')
    c.t(phoneLeft, 149.75, 8, GREY, billing.phone)
  }

  const [a1 = '', a2 = '', a3 = ''] = billing.addressLines
  c.t(RIGHT, 70.41, 8, GREY, billing.businessName, 'sb', 'end')
  c.t(RIGHT, 83.41, 8, GREY, `${a1} ${a2}`.trim(), 'sb', 'end')
  c.t(RIGHT, 96.41, 8, GREY, a3, 'sb', 'end')

  /* -------------------------------------------------------------- table -- */
  c.t(58.03, 375.85, 8, SLATE, 'TASK DESCRIPTION')
  c.t(300.0, 375.75, 8, SLATE, 'ITEM')
  c.t(427.7, 375.75, 8, SLATE, 'RATE', 'sb', 'end')
  c.t(RIGHT, 375.75, 8, SLATE, 'AMOUNT', 'sb', 'end')

  const rows = data.items.slice(0, MAX_LINE_ITEMS)
  let total = 0
  rows.forEach((item, index) => {
    const y = ROW0 + index * PITCH
    const amount = item.qty * item.rate
    total += amount
    c.t(58.0, y, 8, DARK, item.desc)
    c.t(307.0, y + 0.1, 8, DARK, String(item.qty))
    c.t(427.7, y + 1.1, 8, DARK, money(item.rate), 'sb', 'end')
    c.t(RIGHT, y, 8, DARK, money(amount), 'sb', 'end')
  })

  /* Everything below the table shifts down with it. */
  const dy = (Math.max(rows.length, 1) - 1) * PITCH

  c.line(58, 433.0 + dy, 536, RULE)
  c.t(300.0, 450.75 + dy, 8, SLATE, 'SUBTOTAL')
  c.t(RIGHT, 450.75 + dy, 8, DARK, money(total), 'sb', 'end')
  c.line(300, 466.0 + dy, 536, RULE)
  c.t(298.0, 489.75 + dy, 8, DARK, 'TOTAL')
  c.t(RIGHT, 486.63 + dy, 12, BLUE, money(total), 'sb', 'end')
  if (billing.taxId) c.t(RIGHT, 523.41 + dy, 8, GREY, billing.taxId, 'sb', 'end')

  /* -------------------------------------------------------------- notes -- */
  c.t(58.0, 695.65, 8, DARK, 'NOTES')
  let ny = 721.31
  for (const line of wrap(data.notes, 478, (s) => W(s, 8))) {
    c.t(58.0, ny, 8, GREY, line)
    ny += 13
  }

  ny = 760.31
  const signer = billing.businessName.replace(/\b(\w)(\w*)/g, (_, a: string, b: string) => a + b.toLowerCase())
  for (const line of [data.signoff, signer]) {
    c.t(58.0, ny, 8, GREY, line)
    ny += 13
  }

  /* ------------------------------------------------------------- footer -- */
  c.line(58.5, 782.78, 535.5, RULE)
  c.t(58.0, 806.46, 6, GREY, a1)
  c.t(58.0, 816.46, 6, GREY, a2)
  c.t(58.0, 826.46, 6, GREY, a3)
  if (billing.email) {
    c.t(220.0, 805.92, 6, BLUE, '@')
    c.t(234.0, 805.92, 6, GREY, billing.email)
  }
  if (billing.phone) {
    c.t(220.0, 816.92, 6, BLUE, 'm')
    c.t(232.0, 816.92, 6, GREY, billing.phone)
  }

  return c.finish(total)
}

/** Greedy wrap against the measured line length of the template. */
function wrap(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const out: string[] = []
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      out.push('')
      continue
    }
    let line = words[0]
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${line} ${words[i]}`
      if (measure(candidate) > maxWidth) {
        out.push(line)
        line = words[i]
      } else {
        line = candidate
      }
    }
    out.push(line)
  }
  return out
}
