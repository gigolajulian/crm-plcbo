import type {
  ActivityEvent,
  Asset,
  AssetVersion,
  Comment,
  Invoice,
  License,
  Task,
} from '../types'
import { fromSet } from '../images'
import { d, t } from './clock'

/* ============================================================================
   LICENCES

   The record that earns its keep. Two of these end inside sixty days, which is
   the whole point: an expiring licence is renewal revenue that walks away
   quietly if nobody is watching the date.
   ========================================================================== */

export const licenses: License[] = [
  {
    id: 'lc_atrium_civic',
    shootId: 'sh_atrium_civic',
    companyId: 'co_atrium',
    name: 'Civic centre — awards, press and monograph',
    scope: 'Awards submissions, press distribution and the practice monograph',
    media: ['Print', 'Editorial', 'Website'],
    territory: 'Worldwide',
    startDate: d(-343),
    endDate: d(22),
    fee: 8600,
    exclusive: false,
    status: 'expiring',
    assetIds: [],
    notes:
      'The monograph goes to print in the spring. If this lapses first they cannot use the pictures in it — renewal is a service, not a shakedown.',
    createdAt: d(-350),
  },
  {
    id: 'lc_marrow_menu',
    shootId: 'sh_marrow_menu',
    companyId: 'co_marrow',
    name: 'Autumn menu — site, social and print',
    scope: 'Menus, website and organic social across all three rooms',
    media: ['Website', 'Social', 'Print'],
    territory: 'North America',
    startDate: d(-319),
    endDate: d(46),
    fee: 4800,
    exclusive: false,
    status: 'expiring',
    assetIds: [],
    notes: 'Theo has asked twice whether the pictures can stay up. That is a renewal conversation waiting to happen.',
    createdAt: d(-320),
  },
  {
    id: 'lc_fold_aw',
    shootId: 'sh_fold_aw',
    companyId: 'co_fold',
    name: 'Autumn/Winter campaign — all media',
    scope: 'Campaign usage across web, print and out-of-home',
    media: ['Website', 'Social', 'Print', 'OOH'],
    territory: 'European Union',
    startDate: d(-29),
    endDate: d(701),
    fee: 18000,
    exclusive: true,
    status: 'active',
    assetIds: [],
    notes: 'Exclusive for the full 24 months. Nothing from these three days can be licensed elsewhere until it ends.',
    createdAt: d(-29),
  },
  {
    id: 'lc_fold_showroom',
    shootId: 'sh_fold_showroom',
    companyId: 'co_fold',
    name: 'Showroom interiors — trade and wholesale',
    scope: 'Trade press and the wholesale site',
    media: ['Editorial', 'Website'],
    territory: 'Worldwide',
    startDate: d(-62),
    endDate: d(303),
    fee: 6500,
    exclusive: false,
    status: 'active',
    assetIds: [],
    notes: '',
    createdAt: d(-62),
  },
  {
    id: 'lc_salt_ritual',
    shootId: 'sh_salt_ritual',
    companyId: 'co_salttide',
    name: 'Ritual range — packaging and e-commerce',
    scope: 'Packaging and e-commerce, no expiry',
    media: ['Packaging', 'Website'],
    territory: 'Worldwide',
    startDate: d(-243),
    // Perpetual. Dated far out rather than left blank so every date comparison
    // in the app has something real to work with.
    endDate: d(7300),
    fee: 9200,
    exclusive: false,
    status: 'active',
    assetIds: [],
    notes: 'Bought outright at the time — it cost them more up front and there is nothing to chase.',
    createdAt: d(-243),
  },
  {
    id: 'lc_atrium_prior',
    shootId: 'sh_atrium_civic',
    companyId: 'co_atrium',
    name: 'Civic centre — initial press term',
    scope: 'Launch press only',
    media: ['Editorial'],
    territory: 'Worldwide',
    startDate: d(-708),
    endDate: d(-343),
    fee: 3200,
    exclusive: false,
    status: 'renewed',
    assetIds: [],
    notes: 'Rolled into the wider term when the monograph was commissioned.',
    createdAt: d(-708),
  },
]

/* ============================================================================
   INVOICES

   Each one holds its own copy of what it billed for, frozen at the point it
   was raised. Between them they cover every state the deposit tracker has to
   show: invoiced, received, balance outstanding, paid, and overdue.
   ========================================================================== */

export const invoices: Invoice[] = [
  /* Fold AW — deposit in, balance out and waiting */
  {
    id: 'in_faw_dep',
    shootId: 'sh_fold_aw',
    number: '0626',
    kind: 'deposit',
    lineItems: [{ id: 'li_in_faw_1', kind: 'shoot-fee', desc: 'Deposit — 50% of agreed fee', qty: 1, rate: 19045 }],
    status: 'paid',
    issuedAt: d(-68),
    dueAt: d(-54),
    paidAt: d(-59),
    notes: 'Payment due within 14 days. Shoot dates are held on receipt.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-68),
  },
  {
    id: 'in_faw_bal',
    shootId: 'sh_fold_aw',
    number: '0826',
    kind: 'balance',
    lineItems: [{ id: 'li_in_faw_2', kind: 'shoot-fee', desc: 'Balance due on delivery', qty: 1, rate: 19045 }],
    status: 'sent',
    issuedAt: d(-6),
    dueAt: d(8),
    notes: 'Payment due within 14 days. Late payment may delay delivery of final files.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-6),
  },

  /* Showroom — settled in full */
  {
    id: 'in_fsh_dep',
    shootId: 'sh_fold_showroom',
    number: '0426',
    kind: 'deposit',
    lineItems: [{ id: 'li_in_fsh_1', kind: 'shoot-fee', desc: 'Deposit — 50% of agreed fee', qty: 1, rate: 9515 }],
    status: 'paid',
    issuedAt: d(-110),
    dueAt: d(-96),
    paidAt: d(-101),
    notes: 'Payment due within 14 days.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-110),
  },
  {
    id: 'in_fsh_bal',
    shootId: 'sh_fold_showroom',
    number: '0526',
    kind: 'balance',
    lineItems: [{ id: 'li_in_fsh_2', kind: 'shoot-fee', desc: 'Balance due on delivery', qty: 1, rate: 9515 }],
    status: 'paid',
    issuedAt: d(-44),
    dueAt: d(-30),
    paidAt: d(-33),
    notes: 'Payment due within 14 days.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-44),
  },

  /* Marrow No.3 — booked, deposit received */
  {
    id: 'in_m3_dep',
    shootId: 'sh_marrow_three',
    number: '0726',
    kind: 'deposit',
    lineItems: [{ id: 'li_in_m3_1', kind: 'shoot-fee', desc: 'Deposit — 50% of agreed fee', qty: 1, rate: 9300 }],
    status: 'paid',
    issuedAt: d(-30),
    dueAt: d(-16),
    paidAt: d(-24),
    notes: 'Payment due within 14 days. Shoot dates are held on receipt.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-30),
  },

  /* Autumn menu — billed in one */
  {
    id: 'in_mm_full',
    shootId: 'sh_marrow_menu',
    number: '1025',
    kind: 'full',
    lineItems: [
      { id: 'li_in_mm_1', kind: 'shoot-fee', desc: 'Photography — 1 day', qty: 1, rate: 3800 },
      { id: 'li_in_mm_2', kind: 'post', desc: 'Colour and retouch — 22 finals', qty: 22, rate: 80 },
      { id: 'li_in_mm_3', kind: 'licensing', desc: 'Menu, site and social, North America, 12 months', qty: 1, rate: 4800 },
    ],
    status: 'paid',
    issuedAt: d(-306),
    dueAt: d(-292),
    paidAt: d(-298),
    notes: 'Payment due within 14 days.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-306),
  },

  /* Trail — deposit taken, balance not raised yet */
  {
    id: 'in_nt_dep',
    shootId: 'sh_north_trail',
    number: '0726-2',
    kind: 'deposit',
    lineItems: [{ id: 'li_in_nt_1', kind: 'shoot-fee', desc: 'Deposit — 50% of agreed fee', qty: 1, rate: 33050 }],
    status: 'paid',
    issuedAt: d(-48),
    dueAt: d(-34),
    paidAt: d(-41),
    notes: 'Payment due within 14 days. Shoot dates are held on receipt.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-48),
  },

  /* Roastery — the one that is late */
  {
    id: 'in_tr_dep',
    shootId: 'sh_third_roastery',
    number: '0826-2',
    kind: 'deposit',
    lineItems: [{ id: 'li_in_tr_1', kind: 'shoot-fee', desc: 'Deposit — 50% of agreed fee', qty: 1, rate: 5237.5 }],
    status: 'sent',
    issuedAt: d(-8),
    // Overdue as of today.
    dueAt: d(-1),
    notes: 'Payment due within 7 days. Shoot dates are held on receipt.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-8),
  },

  /* Civic centre and Ritual — historic, settled */
  {
    id: 'in_ac_full',
    shootId: 'sh_atrium_civic',
    number: '0925',
    kind: 'full',
    lineItems: [
      { id: 'li_in_ac_1', kind: 'shoot-fee', desc: 'Photography — 2 days, dawn and dusk', qty: 2, rate: 4000 },
      { id: 'li_in_ac_2', kind: 'post', desc: 'Perspective, blending and colour — 18 finals', qty: 18, rate: 140 },
      { id: 'li_in_ac_3', kind: 'licensing', desc: 'Awards, press and monograph, worldwide, 12 months', qty: 1, rate: 8600 },
    ],
    status: 'paid',
    issuedAt: d(-350),
    dueAt: d(-336),
    paidAt: d(-341),
    notes: 'Payment due within 14 days.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-350),
  },
  {
    id: 'in_sr_dep',
    shootId: 'sh_salt_ritual',
    number: '0125',
    kind: 'deposit',
    lineItems: [{ id: 'li_in_sr_1', kind: 'shoot-fee', desc: 'Deposit — 50% of agreed fee', qty: 1, rate: 10920 }],
    status: 'paid',
    issuedAt: d(-252),
    dueAt: d(-238),
    paidAt: d(-247),
    notes: 'Payment due within 14 days.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-252),
  },
  {
    id: 'in_sr_bal',
    shootId: 'sh_salt_ritual',
    number: '0225',
    kind: 'balance',
    lineItems: [{ id: 'li_in_sr_2', kind: 'shoot-fee', desc: 'Balance due on delivery', qty: 1, rate: 10920 }],
    status: 'paid',
    issuedAt: d(-226),
    dueAt: d(-212),
    paidAt: d(-219),
    notes: 'Payment due within 14 days.',
    signoff: 'Thank you,',
    paper: 'light',
    createdAt: d(-226),
  },
]

/* ============================================================================
   TASKS — overdue, today, this week and done, so every bucket has weight.
   ========================================================================== */

export const tasks: Task[] = [
  /* overdue */
  { id: 'tk_01', title: 'Chase the Third Slope deposit', detail: 'Invoice 0826-2 was due yesterday and the shoot is in seventeen days. Dates are not held until it lands.', status: 'todo', priority: 'urgent', dueDate: d(-1), assigneeId: 'tm_ivy', shootId: 'sh_third_roastery', contactId: 'ct_mina', createdAt: d(-8) },
  { id: 'tk_02', title: 'Follow up the Northbound lookbook quote', detail: 'Nine days out with no reply. Studio hold releases Friday.', status: 'todo', priority: 'high', dueDate: d(-2), assigneeId: 'tm_ivy', shootId: 'sh_north_lookbook', contactId: 'ct_pace', createdAt: d(-9) },
  { id: 'tk_03', title: 'Get releases back from the Marrow floor staff', detail: 'Two front-of-house appear in the kitchen frames. No release, no usable picture.', status: 'todo', priority: 'urgent', dueDate: d(-1), assigneeId: 'tm_noor', shootId: 'sh_marrow_three', createdAt: d(-12) },
  { id: 'tk_04', title: 'Price the third revision round for Jonas', detail: 'Both included rounds are used. Quote it before doing the work, not after.', status: 'todo', priority: 'high', dueDate: d(-3), assigneeId: 'tm_ivy', shootId: 'sh_fold_showroom', contactId: 'ct_jonas', createdAt: d(-6) },

  /* today */
  { id: 'tk_05', title: 'Send Third Slope pack-shot numbers', detail: 'Bo wants a figure by the end of the week. Came in through Mina, so it is warm.', status: 'todo', priority: 'high', dueDate: d(0), assigneeId: 'tm_ivy', shootId: 'sh_third_packs', contactId: 'ct_bo', createdAt: d(-2) },
  { id: 'tk_06', title: 'Kitchen frames — second colour pass', detail: 'Karin wants them warmer than the rest of the set.', status: 'in-progress', priority: 'high', dueDate: d(0), assigneeId: 'tm_salla', shootId: 'sh_fold_aw', createdAt: d(-4) },
  { id: 'tk_07', title: 'Open the Atrium licence renewal', detail: 'Twenty-two days left and the monograph prints in the spring.', status: 'todo', priority: 'high', dueDate: d(0), assigneeId: 'tm_ivy', shootId: 'sh_atrium_civic', contactId: 'ct_elke', createdAt: d(-5) },
  { id: 'tk_08', title: 'Confirm the Marrow call sheet', detail: 'Crew, stylist, call times and the dusk hold. Out to everyone by tonight.', status: 'in-progress', priority: 'normal', dueDate: d(0), assigneeId: 'tm_noor', shootId: 'sh_marrow_three', createdAt: d(-3) },

  /* this week */
  { id: 'tk_09', title: 'Cull the Trail take', detail: '4,100 frames from four days. First pass to 300, then down to the delivery count.', status: 'in-progress', priority: 'high', dueDate: d(3), assigneeId: 'tm_salla', shootId: 'sh_north_trail', createdAt: d(-8) },
  { id: 'tk_10', title: 'Window verticals from the AW masters', detail: 'Ten 4:5 crops. Every hero setup should yield one.', status: 'todo', priority: 'high', dueDate: d(3), assigneeId: 'tm_dez', shootId: 'sh_fold_aw', createdAt: d(-9) },
  { id: 'tk_11', title: 'Warn Jonas the showroom gallery expires', detail: 'Nine days. They have not pulled everything down yet.', status: 'todo', priority: 'normal', dueDate: d(2), assigneeId: 'tm_ivy', shootId: 'sh_fold_showroom', contactId: 'ct_jonas', createdAt: d(-1) },
  { id: 'tk_12', title: 'Book the food stylist for Marrow', status: 'done', priority: 'normal', dueDate: d(-6), assigneeId: 'tm_noor', shootId: 'sh_marrow_three', createdAt: d(-14), completedAt: t(-7, 11) },
  { id: 'tk_13', title: 'Raise the Trail balance invoice', detail: 'Once the selects are with the agency.', status: 'todo', priority: 'normal', dueDate: d(6), assigneeId: 'tm_ivy', shootId: 'sh_north_trail', createdAt: d(-2) },
  { id: 'tk_14', title: 'Back up the Trail catalog to the offsite drive', detail: 'Four days of material living in one place is not a backup.', status: 'todo', priority: 'urgent', dueDate: d(1), assigneeId: 'tm_salla', shootId: 'sh_north_trail', createdAt: d(-9) },
  { id: 'tk_15', title: 'Scout the Marrow frontage for the dusk hold', detail: 'Only worth keeping the 11th if the hoarding is down.', status: 'todo', priority: 'low', dueDate: d(7), assigneeId: 'tm_noor', shootId: 'sh_marrow_three', createdAt: d(-2) },

  /* later */
  { id: 'tk_16', title: 'Send Northbound the selects gallery', status: 'todo', priority: 'normal', dueDate: d(6), assigneeId: 'tm_ivy', shootId: 'sh_north_trail', contactId: 'ct_wren', createdAt: d(-2) },
  { id: 'tk_17', title: 'Re-approach Salt & Tide about founder portraits', detail: 'They shot it in-house under time pressure. Spring is the moment to offer again.', status: 'todo', priority: 'low', dueDate: d(24), assigneeId: 'tm_ivy', shootId: 'sh_salt_founder', contactId: 'ct_gus', createdAt: d(-58) },
  { id: 'tk_18', title: 'Ask Lia about the second Ritual range', detail: 'She raised it unprompted. Follow it up before someone else does.', status: 'todo', priority: 'normal', dueDate: d(11), assigneeId: 'tm_noor', shootId: 'sh_salt_ritual', contactId: 'ct_lia', createdAt: d(-4) },
  { id: 'tk_19', title: 'Archive the Civic centre catalog to cold storage', status: 'todo', priority: 'low', dueDate: d(30), assigneeId: 'tm_salla', shootId: 'sh_atrium_civic', createdAt: d(-20) },

  /* done */
  { id: 'tk_20', title: 'Deliver the AW print series', status: 'done', priority: 'high', dueDate: d(-14), assigneeId: 'tm_dez', shootId: 'sh_fold_aw', createdAt: d(-25), completedAt: t(-13, 16) },
  { id: 'tk_21', title: 'Book the mountain guide for the Trail days', status: 'done', priority: 'urgent', dueDate: d(-18), assigneeId: 'tm_noor', shootId: 'sh_north_trail', createdAt: d(-40), completedAt: t(-20, 9) },
  { id: 'tk_22', title: 'Get talent releases signed on location', status: 'done', priority: 'urgent', dueDate: d(-12), assigneeId: 'tm_salla', shootId: 'sh_north_trail', createdAt: d(-14), completedAt: t(-12, 6, 30) },
  { id: 'tk_23', title: 'Send the AW deposit invoice', status: 'done', priority: 'high', dueDate: d(-68), assigneeId: 'tm_ivy', shootId: 'sh_fold_aw', createdAt: d(-70), completedAt: t(-68, 10) },
  { id: 'tk_24', title: 'Confirm the Copenhagen flights', status: 'done', priority: 'normal', dueDate: d(-70), assigneeId: 'tm_noor', shootId: 'sh_fold_showroom', createdAt: d(-80), completedAt: t(-71, 15) },
]

/* ============================================================================
   ASSETS — what actually gets reviewed: selects, edits, and the paperwork.
   ========================================================================== */

export const assets: Asset[] = [
  { id: 'as_faw_heroes', shootId: 'sh_fold_aw', name: 'AW heroes — colour round', kind: 'photo', currentVersionId: 'av_faw_heroes_3', createdAt: d(-24) },
  { id: 'as_faw_windows', shootId: 'sh_fold_aw', name: 'Window verticals (4:5)', kind: 'photo', currentVersionId: 'av_faw_windows_2', createdAt: d(-18) },
  { id: 'as_faw_contract', shootId: 'sh_fold_aw', name: 'Signed contract — FF-04', kind: 'contract', currentVersionId: 'av_faw_contract_1', createdAt: d(-66) },
  { id: 'as_fsh_finals', shootId: 'sh_fold_showroom', name: 'Showroom finals', kind: 'photo', currentVersionId: 'av_fsh_finals_3', createdAt: d(-50) },
  { id: 'as_nt_selects', shootId: 'sh_north_trail', name: 'Trail selects — first cull', kind: 'photo', currentVersionId: 'av_nt_selects_2', createdAt: d(-7) },
  { id: 'as_nt_release', shootId: 'sh_north_trail', name: 'Model releases — 2 talent', kind: 'release', currentVersionId: 'av_nt_release_1', createdAt: d(-12) },
  { id: 'as_mm_finals', shootId: 'sh_marrow_menu', name: 'Autumn menu finals', kind: 'photo', currentVersionId: 'av_mm_finals_2', createdAt: d(-310) },
  { id: 'as_ac_finals', shootId: 'sh_atrium_civic', name: 'Civic centre finals', kind: 'photo', currentVersionId: 'av_ac_finals_2', createdAt: d(-355) },
  { id: 'as_sr_finals', shootId: 'sh_salt_ritual', name: 'Ritual product finals', kind: 'photo', currentVersionId: 'av_sr_finals_2', createdAt: d(-232) },
]

export const assetVersions: AssetVersion[] = [
  // AW heroes
  { id: 'av_faw_heroes_1', assetId: 'as_faw_heroes', label: 'v1', url: fromSet('interiors', 1, 'card'), artSeed: 'faw-heroes-1', ratio: 3 / 2, uploadedById: 'tm_salla', createdAt: t(-24, 18), status: 'changes-requested', decision: 'Selects are right. Colour is running cool across the whole set — warm it two hundred kelvin and try again.', decidedById: 'tm_ivy', decidedAt: t(-22, 10) },
  { id: 'av_faw_heroes_2', assetId: 'as_faw_heroes', label: 'v2', url: fromSet('interiors', 2, 'card'), artSeed: 'faw-heroes-2', ratio: 3 / 2, uploadedById: 'tm_salla', createdAt: t(-12, 17), status: 'changes-requested', decision: 'Much better everywhere except the kitchen, which has gone green. Fix before Karin sees it.', decidedById: 'tm_dez', decidedAt: t(-10, 9, 30) },
  { id: 'av_faw_heroes_3', assetId: 'as_faw_heroes', label: 'v3', url: fromSet('interiors', 8, 'card'), artSeed: 'faw-heroes-3', ratio: 3 / 2, uploadedById: 'tm_salla', createdAt: t(-1, 19), status: 'pending', notes: 'Warm pass on everything but the kitchen sequence. Going to Karin once that lands.' },

  // Window verticals
  { id: 'av_faw_windows_1', assetId: 'as_faw_windows', label: 'v1', url: fromSet('interiors', 6, 'card'), artSeed: 'faw-win-1', ratio: 4 / 5, uploadedById: 'tm_dez', createdAt: t(-18, 15), status: 'changes-requested', decision: 'The 4:5 crop is cutting the object. Reframe from the master rather than cropping the delivered file.', decidedById: 'ct_karin', decidedAt: t(-16, 8) },
  { id: 'av_faw_windows_2', assetId: 'as_faw_windows', label: 'v2', url: fromSet('interiors', 10, 'card'), artSeed: 'faw-win-2', ratio: 4 / 5, uploadedById: 'tm_dez', createdAt: t(-4, 14), status: 'approved', decision: 'Approved for print. Use this crop as the master for the other three formats.', decidedById: 'ct_karin', decidedAt: t(-3, 9, 15) },

  // Contract
  { id: 'av_faw_contract_1', assetId: 'as_faw_contract', label: 'Signed', artSeed: 'faw-contract', ratio: 1 / 1.414, uploadedById: 'tm_ivy', createdAt: t(-66, 11), status: 'approved', decision: 'Countersigned by Karin.', decidedById: 'ct_karin', decidedAt: t(-66, 16) },

  // Showroom finals
  { id: 'av_fsh_finals_1', assetId: 'as_fsh_finals', label: 'v1', url: fromSet('architecture', 1, 'card'), artSeed: 'fsh-1', ratio: 3 / 2, uploadedById: 'tm_ivy', createdAt: t(-56, 12), status: 'changes-requested', decision: 'Verticals are leaning in four of these. Worth another pass on the corrections.', decidedById: 'ct_jonas', decidedAt: t(-53, 16) },
  { id: 'av_fsh_finals_2', assetId: 'as_fsh_finals', label: 'v2', url: fromSet('architecture', 6, 'card'), artSeed: 'fsh-2', ratio: 3 / 2, uploadedById: 'tm_ivy', createdAt: t(-48, 11), status: 'changes-requested', decision: 'Verticals fixed. Now the Malmö room is too cool against the rest.', decidedById: 'ct_jonas', decidedAt: t(-46, 14) },
  { id: 'av_fsh_finals_3', assetId: 'as_fsh_finals', label: 'v3', url: fromSet('architecture', 7, 'card'), artSeed: 'fsh-3', ratio: 3 / 2, uploadedById: 'tm_ivy', createdAt: t(-45, 10), status: 'approved', decision: 'Approved and delivered. Thank you for the patience on the corrections.', decidedById: 'ct_jonas', decidedAt: t(-44, 9) },

  // Trail selects
  { id: 'av_nt_selects_1', assetId: 'as_nt_selects', label: 'v1', url: fromSet('landscape', 0, 'card'), artSeed: 'nt-1', ratio: 3 / 2, uploadedById: 'tm_salla', createdAt: t(-7, 20), status: 'changes-requested', decision: 'Too many from day one. The fog material from day three is the strongest thing here and it is under-represented.', decidedById: 'tm_ivy', decidedAt: t(-6, 10) },
  { id: 'av_nt_selects_2', assetId: 'as_nt_selects', label: 'v2', url: fromSet('landscape', 5, 'card'), artSeed: 'nt-2', ratio: 3 / 2, uploadedById: 'tm_salla', createdAt: t(-2, 19), status: 'pending', notes: 'Rebalanced towards day three. 312 selects — ready for the agency to cut to twenty heroes.' },

  // Releases
  { id: 'av_nt_release_1', assetId: 'as_nt_release', label: 'Signed', artSeed: 'nt-release', ratio: 1 / 1.414, uploadedById: 'tm_salla', createdAt: t(-12, 6, 30), status: 'approved', decision: 'Both signed on location before the first frame.', decidedById: 'tm_salla', decidedAt: t(-12, 6, 30) },

  // Historic finals
  { id: 'av_mm_finals_1', assetId: 'as_mm_finals', label: 'v1', url: fromSet('food', 4, 'card'), artSeed: 'mm-1', ratio: 4 / 5, uploadedById: 'tm_noor', createdAt: t(-312, 10), status: 'changes-requested', decision: 'Three of the dishes read grey. Everything else is right.', decidedById: 'ct_theo', decidedAt: t(-310, 9) },
  { id: 'av_mm_finals_2', assetId: 'as_mm_finals', label: 'v2', url: fromSet('food', 2, 'card'), artSeed: 'mm-2', ratio: 4 / 5, uploadedById: 'tm_noor', createdAt: t(-308, 13), status: 'approved', decision: 'Approved. These have been on the site for a year and still look new.', decidedById: 'ct_theo', decidedAt: t(-307, 14, 30) },

  { id: 'av_ac_finals_1', assetId: 'as_ac_finals', label: 'v1', url: fromSet('architecture', 4, 'card'), artSeed: 'ac-1', ratio: 3 / 2, uploadedById: 'tm_ivy', createdAt: t(-356, 12), status: 'changes-requested', decision: 'The dusk exterior is the picture. Can we get more separation on the west elevation?', decidedById: 'ct_elke', decidedAt: t(-354, 17) },
  { id: 'av_ac_finals_2', assetId: 'as_ac_finals', label: 'v2', url: fromSet('architecture', 5, 'card'), artSeed: 'ac-2', ratio: 3 / 2, uploadedById: 'tm_ivy', createdAt: t(-352, 12), status: 'approved', decision: 'Approved. This won us the regional award.', decidedById: 'ct_elke', decidedAt: t(-350, 10) },

  { id: 'av_sr_finals_1', assetId: 'as_sr_finals', label: 'v1', url: fromSet('water', 1, 'card'), artSeed: 'sr-1', ratio: 1, uploadedById: 'tm_marco', createdAt: t(-234, 14), status: 'changes-requested', decision: 'Glass edges are too hot. Everything else is beautiful.', decidedById: 'ct_lia', decidedAt: t(-232, 21) },
  { id: 'av_sr_finals_2', assetId: 'as_sr_finals', label: 'v2', url: fromSet('water', 3, 'card'), artSeed: 'sr-2', ratio: 1, uploadedById: 'tm_marco', createdAt: t(-229, 15), status: 'approved', decision: 'Approved for packaging and the store. Thank you.', decidedById: 'ct_lia', decidedAt: t(-227, 8, 45) },
]

/* ------------------------------------------------------------- comments -- */

export const comments: Comment[] = [
  { id: 'cm_01', targetType: 'assetVersion', targetId: 'av_faw_heroes_3', authorId: 'tm_dez', authorKind: 'team', body: 'The warm pass is right. The hallway frame is the best thing on the whole job.', createdAt: t(-1, 20, 15), resolved: false },
  { id: 'cm_02', targetType: 'assetVersion', targetId: 'av_faw_heroes_3', authorId: 'tm_ivy', authorKind: 'team', body: 'Agreed. Do not send until the kitchen is fixed — Karin will only see the green.', createdAt: t(0, 8, 40), resolved: false, pin: { x: 0.62, y: 0.44 } },
  { id: 'cm_03', targetType: 'assetVersion', targetId: 'av_nt_selects_2', authorId: 'ct_wren', authorKind: 'client', body: 'Three hundred is a lot to look at but the fog set is extraordinary. This is the campaign.', createdAt: t(-1, 16, 20), resolved: false },
  { id: 'cm_04', targetType: 'assetVersion', targetId: 'av_nt_selects_2', authorId: 'ct_pace', authorKind: 'client', body: 'Agreed. Can we have the twenty heroes shortlisted by Friday so legal can start on the buyout paperwork?', createdAt: t(-1, 17, 5), resolved: false },
  { id: 'cm_05', targetType: 'assetVersion', targetId: 'av_faw_windows_2', authorId: 'ct_karin', authorKind: 'client', body: 'Approved. The reframe makes it — please use this crop as the master for the other three formats.', createdAt: t(-3, 9, 15), resolved: true },
  { id: 'cm_06', targetType: 'assetVersion', targetId: 'av_fsh_finals_3', authorId: 'ct_jonas', authorKind: 'client', body: 'These are right. Sorry for the two rounds — the Malmö light caught us both out.', createdAt: t(-44, 9, 10), resolved: true },
  { id: 'cm_07', targetType: 'shoot', targetId: 'sh_marrow_three', authorId: 'ct_rue', authorKind: 'client', body: 'Chef wants the pass shot during actual service, not staged. Can we make that work on the second day?', createdAt: t(-2, 21, 45), resolved: false },
  { id: 'cm_08', targetType: 'shoot', targetId: 'sh_atrium_civic', authorId: 'ct_elke', authorKind: 'client', body: 'The monograph is confirmed for spring. We will need the licence to run past the print date.', createdAt: t(-6, 13, 25), resolved: false },
]

/* ============================================================================
   ACTIVITY — the studio's shared memory. Every entry points at a real record.
   ========================================================================== */

export const activity: ActivityEvent[] = [
  { id: 'ac_01', type: 'call', subject: 'Rue — running the call sheet for the 4th', body: 'Twenty minutes. Chef wants the pass shot in real service. Doable on day two if we stay out of the way.', actorId: 'tm_noor', actorKind: 'team', at: t(0, 9, 10), direction: 'outbound', links: { contactId: 'ct_rue', companyId: 'co_marrow', shootId: 'sh_marrow_three' } },
  { id: 'ac_02', type: 'invoice', subject: 'Deposit 0826-2 is overdue', body: 'Third Slope roastery. Due yesterday, shoot in seventeen days, dates not held until it clears.', actorId: 'tm_ivy', actorKind: 'system', at: t(0, 7), links: { invoiceId: 'in_tr_dep', shootId: 'sh_third_roastery', companyId: 'co_thirdslope' }, followUpAt: d(0), followUpDone: false },
  { id: 'ac_03', type: 'license', subject: 'Atrium civic licence ends in 22 days', body: 'Monograph prints in the spring. If it lapses first they cannot use the pictures in it.', actorId: 'tm_ivy', actorKind: 'system', at: t(-1, 7), links: { licenseId: 'lc_atrium_civic', shootId: 'sh_atrium_civic', companyId: 'co_atrium' }, followUpAt: d(0), followUpDone: false },
  { id: 'ac_04', type: 'approval', subject: 'Window verticals approved by Karin', actorId: 'ct_karin', actorKind: 'client', at: t(-3, 9, 15), links: { contactId: 'ct_karin', shootId: 'sh_fold_aw', assetVersionId: 'av_faw_windows_2' } },
  { id: 'ac_05', type: 'email', subject: 'Wren — first reaction to the Trail selects', body: 'Genuinely enthusiastic about the fog set. Wants twenty heroes shortlisted by Friday for the buyout paperwork.', actorId: 'ct_wren', actorKind: 'client', at: t(-1, 16, 20), direction: 'inbound', links: { contactId: 'ct_wren', companyId: 'co_northbound', shootId: 'sh_north_trail' }, threadUrl: 'https://mail.google.com/mail/u/0/#inbox/FMfcgz', followUpAt: d(2), followUpDone: false },
  { id: 'ac_06', type: 'status', subject: 'Northbound lookbook still in Quoted', body: 'Nine days without a reply. Third nudge is the last one before the studio hold goes.', actorId: 'tm_ivy', actorKind: 'system', at: t(-1, 8), links: { shootId: 'sh_north_lookbook', companyId: 'co_northbound', contactId: 'ct_pace' }, followUpAt: d(0), followUpDone: false },
  { id: 'ac_07', type: 'meeting', subject: 'Fold & Field — AW colour review', body: 'Ninety minutes with Karin. Everything approved except the kitchen sequence, which she also saw as green.', actorId: 'tm_ivy', actorKind: 'team', at: t(-3, 14), links: { contactId: 'ct_karin', companyId: 'co_fold', shootId: 'sh_fold_aw' }, followUpAt: d(1), followUpDone: false },
  { id: 'ac_08', type: 'note', subject: 'Jonas has used both revision rounds', body: 'He has asked for a third. Price it before doing it — this is exactly where the margin goes.', actorId: 'tm_ivy', actorKind: 'team', at: t(-2, 11, 30), links: { contactId: 'ct_jonas', companyId: 'co_fold', shootId: 'sh_fold_showroom' } },
  { id: 'ac_09', type: 'update', subject: 'Trail selects v2 uploaded', body: 'Rebalanced towards day three. 312 selects with the agency.', actorId: 'tm_salla', actorKind: 'team', at: t(-2, 17), links: { shootId: 'sh_north_trail', assetVersionId: 'av_nt_selects_2' } },
  { id: 'ac_10', type: 'email', subject: 'Bo — pack shots for the wholesale deck', body: 'Twelve bags on white plus six lifestyle. Wants a number by the end of the week. Came through Mina.', actorId: 'ct_bo', actorKind: 'client', at: t(-2, 10, 5), direction: 'inbound', links: { contactId: 'ct_bo', companyId: 'co_thirdslope', shootId: 'sh_third_packs' }, followUpAt: d(0), followUpDone: false },
  { id: 'ac_11', type: 'note', subject: 'Lia raised a second Ritual range, unprompted', body: 'Sell-through at 64% and refill attach at 34%. Both above target. Worth getting in front of.', actorId: 'tm_noor', actorKind: 'team', at: t(-4, 11), links: { contactId: 'ct_lia', companyId: 'co_salttide', shootId: 'sh_salt_ritual' }, followUpAt: d(4), followUpDone: false },
  { id: 'ac_12', type: 'update', subject: 'Trail shoot wrapped — four days', body: 'Three of them wet. The fog material from day three is the best work on the job.', actorId: 'tm_ivy', actorKind: 'team', at: t(-9, 19), links: { shootId: 'sh_north_trail', companyId: 'co_northbound' } },
  { id: 'ac_13', type: 'email', subject: 'Elke — monograph confirmed for spring', body: 'Which makes the licence end date a real problem rather than a diary note.', actorId: 'ct_elke', actorKind: 'client', at: t(-6, 13, 25), direction: 'inbound', links: { contactId: 'ct_elke', companyId: 'co_atrium', shootId: 'sh_atrium_civic' } },
  { id: 'ac_14', type: 'task', subject: 'Marrow releases still outstanding', actorId: 'tm_noor', actorKind: 'team', at: t(-1, 10), links: { shootId: 'sh_marrow_three', taskId: 'tk_03' } },
  { id: 'ac_15', type: 'invoice', subject: 'AW balance invoice sent — 0826', body: '$19,045 due in eight days. Deposit cleared back in June.', actorId: 'tm_ivy', actorKind: 'team', at: t(-6, 20, 10), links: { invoiceId: 'in_faw_bal', shootId: 'sh_fold_aw', contactId: 'ct_karin', companyId: 'co_fold' } },
  { id: 'ac_16', type: 'note', subject: 'Bo is the wholesale decision, not Mina', body: 'Third Slope splits retail and wholesale. Put Bo on every packaging quote from here.', actorId: 'tm_noor', actorKind: 'team', at: t(-4, 9, 50), links: { companyId: 'co_thirdslope', contactId: 'ct_bo', shootId: 'sh_third_packs' } },
  { id: 'ac_17', type: 'status', subject: 'Showroom gallery expires in nine days', body: 'Jonas has not pulled everything down. Warn him rather than letting it lapse.', actorId: 'tm_ivy', actorKind: 'system', at: t(-1, 7, 30), links: { shootId: 'sh_fold_showroom', companyId: 'co_fold' } },
  { id: 'ac_18', type: 'call', subject: 'Pace — lookbook quote follow-up', body: 'Left a message. He liked the number on the first call and has gone quiet since.', actorId: 'tm_ivy', actorKind: 'team', at: t(-4, 13, 20), direction: 'outbound', links: { contactId: 'ct_pace', companyId: 'co_northbound', shootId: 'sh_north_lookbook' } },
  { id: 'ac_19', type: 'approval', subject: 'Showroom finals approved by Jonas', body: 'Two rounds, both used. Delivered the same day.', actorId: 'ct_jonas', actorKind: 'client', at: t(-44, 9), links: { contactId: 'ct_jonas', shootId: 'sh_fold_showroom', assetVersionId: 'av_fsh_finals_3' } },
  { id: 'ac_20', type: 'license', subject: 'Marrow autumn menu licence ends in 46 days', body: 'Theo has already asked twice whether the pictures can stay up.', actorId: 'tm_noor', actorKind: 'system', at: t(-2, 7), links: { licenseId: 'lc_marrow_menu', shootId: 'sh_marrow_menu', companyId: 'co_marrow' } },
  { id: 'ac_21', type: 'meeting', subject: 'Marrow No.3 — pre-production', body: 'Rue, Theo and the chef. Warmer room than No.1 and the pictures should be too.', actorId: 'tm_noor', actorKind: 'team', at: t(-21, 10), links: { shootId: 'sh_marrow_three', companyId: 'co_marrow', contactId: 'ct_rue' } },
  { id: 'ac_22', type: 'status', subject: 'Salt & Tide founder portraits marked lost', body: 'Announcement moved forward two weeks and we could not move with it. Shot in-house. Try again in the spring.', actorId: 'tm_ivy', actorKind: 'team', at: t(-58, 14, 20), links: { shootId: 'sh_salt_founder', companyId: 'co_salttide', contactId: 'ct_gus' } },
]
