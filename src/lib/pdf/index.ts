import type { BillingProfile, Company, Contact, Invoice, LineItem, Shoot } from '@/data/types'
import { loadDocumentFonts } from './fonts'
import { buildPDF, loadMark, type RasterMark } from './doc'
import { buildSVG } from './svg'
import { PAPERS, type DrawList } from './types'
import { layoutInvoice, type DocumentData } from './templates/invoice'
import markUrl from '@/assets/mark.png'

export { MAX_LINE_ITEMS } from './templates/invoice'
export { PAPERS } from './types'
export type { DrawList } from './types'

/* ============================================================================
   DOCUMENTS

   The one entry point the UI uses. It resolves fonts and the mark, runs the
   template, and hands back both renderings of the same draw list.
   ========================================================================== */

export type Paper = 'light' | 'inverted'

export interface DocumentRequest {
  kind: 'invoice' | 'quote'
  paper: Paper
  number: string
  date: string
  items: LineItem[]
  notes: string
  signoff: string
  billing: BillingProfile
  currency: string
  contact?: Contact
  company?: Company
}

/** Cached across documents — decoding the mark is not free. */
let markCache: Promise<RasterMark | undefined> | null = null

function resolveMark(dataUrl?: string): Promise<RasterMark | undefined> {
  if (dataUrl) return loadMark(dataUrl).catch(() => undefined)
  if (!markCache) {
    markCache = loadMark(markUrl).catch(() => undefined)
  }
  return markCache
}

function toDocumentData(request: DocumentRequest): DocumentData {
  const isQuote = request.kind === 'quote'
  return {
    title: isQuote ? 'QUOTE' : 'INVOICE',
    numberLabel: isQuote ? 'QUOTE NO.' : 'INVOICE NO.',
    dateLabel: isQuote ? 'QUOTE DATE' : 'INVOICE DATE',
    number: request.number,
    date: request.date,
    recipientName: request.company?.name ?? request.contact?.name ?? '',
    recipientEmail: request.contact?.email ?? '',
    recipientPhone: request.contact?.phone ?? '',
    items: request.items,
    notes: request.notes,
    signoff: request.signoff,
    billing: request.billing,
    currency: request.currency,
  }
}

/** The draw list plus the proof, for rendering on screen. */
export async function renderProof(
  request: DocumentRequest,
): Promise<{ svg: string; draw: DrawList; total: number }> {
  const fonts = await loadDocumentFonts()
  const draw = layoutInvoice(toDocumentData(request), {
    fonts,
    paper: PAPERS[request.paper],
  })
  const svg = buildSVG(draw, { markDataUrl: request.billing.logoDataUrl ?? markUrl })
  return { svg, draw, total: draw.total }
}

/** The same document as a real PDF, fonts embedded. */
export async function renderPDF(request: DocumentRequest): Promise<Blob> {
  const fonts = await loadDocumentFonts()
  const draw = layoutInvoice(toDocumentData(request), {
    fonts,
    paper: PAPERS[request.paper],
  })
  const mark = await resolveMark(request.billing.logoDataUrl)
  return buildPDF(draw, fonts, mark)
}

/* --------------------------------------------------------------- helpers -- */

/** M/D/YYYY, matching the reference document. */
export function documentDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${m}/${d}/${y}`
}

/** Strips anything a filesystem would object to. */
export function documentFilename(request: DocumentRequest): string {
  const who = (request.company?.name ?? request.contact?.name ?? 'Client')
    .replace(/\([^)]*\)/g, '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
  return `${request.kind === 'quote' ? 'QUOTE' : 'INVOICE'} ${request.number} - ${who}.pdf`
}

/** Builds the request for an invoice that already exists in the store. */
export function invoiceRequest(args: {
  invoice: Invoice
  billing: BillingProfile
  currency: string
  contact?: Contact
  company?: Company
}): DocumentRequest {
  const { invoice } = args
  return {
    kind: 'invoice',
    paper: invoice.paper,
    number: invoice.number,
    date: documentDate(invoice.issuedAt ?? invoice.createdAt),
    items: invoice.lineItems,
    notes: invoice.notes,
    signoff: invoice.signoff,
    billing: args.billing,
    currency: args.currency,
    contact: args.contact,
    company: args.company,
  }
}

/** Builds the request for a quote drawn straight off a shoot's line items. */
export function quoteRequest(args: {
  shoot: Shoot
  billing: BillingProfile
  currency: string
  paper?: Paper
  contact?: Contact
  company?: Company
}): DocumentRequest {
  return {
    kind: 'quote',
    paper: args.paper ?? 'light',
    number: args.shoot.code || args.shoot.id.slice(-4).toUpperCase(),
    date: documentDate(args.shoot.quotedAt ?? args.shoot.inquiredAt),
    items: args.shoot.lineItems,
    notes: args.billing.defaultNotes,
    signoff: args.billing.defaultSignoff,
    billing: args.billing,
    currency: args.currency,
    contact: args.contact,
    company: args.company,
  }
}
