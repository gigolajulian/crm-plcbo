import type { Milestone, Project } from '../types'
import { fromSet } from '../images'
import { d } from './clock'

/* ============================================================================
   NINE PROJECTS spread across every stage and every health state, so each
   view (gallery, board, timeline, list) has something real to show.
   ========================================================================== */

export const projects: Project[] = [
  {
    id: 'pj_quiet',
    name: 'Quiet Objects',
    code: 'FF-04',
    summary:
      'Autumn/winter campaign for the Quiet Objects collection — a film, a print series, and the store window system.',
    clientContactId: 'ct_karin',
    companyId: 'co_fold',
    coverUrl: fromSet('interiors', 0, 'cover'),
    artSeed: 'quiet-objects',
    stage: 'production',
    health: 'on-track',
    leadId: 'tm_dez',
    memberIds: ['tm_dez', 'tm_marco', 'tm_tomas', 'tm_salla'],
    startDate: d(-52),
    dueDate: d(24),
    budget: 148000,
    spent: 91400,
    tags: ['tag_campaign', 'tag_brand', 'tag_retainer'],
    dealId: 'dl_fold_aw',
    archived: false,
    createdAt: d(-58),
    deliverables: [
      { id: 'dv_q1', name: 'Campaign film', quantity: '1 × 90s, 3 × 15s cutdowns', done: false },
      { id: 'dv_q2', name: 'Print series', quantity: '6 spreads', done: true },
      { id: 'dv_q3', name: 'Window system', quantity: '4 store formats', done: false },
      { id: 'dv_q4', name: 'Art direction guide', quantity: '1 PDF', done: true },
    ],
    brief: {
      objective:
        'Make Fold & Field feel like a house you would want to live in, not a catalogue you flick through. The campaign has to carry the shift to direct-to-consumer without announcing it.',
      audience:
        'Thirty-to-fifty, second-home or first-serious-home. They have bought design before and can tell when they are being sold to.',
      direction:
        'Domestic, unstyled, slightly overcast. Objects photographed in use rather than arranged. Long lenses, natural light, no set dressing that a real person would not own.',
      constraints:
        'Shot entirely in existing Fold & Field homes — no studio. Must work cropped to a 4:5 window vinyl. No on-screen type in the film until the final card.',
      successCriteria: [
        'Karin can show it to the board without translating it',
        'Window system installs in under two hours per store',
        'Film reads with the sound off',
      ],
    },
  },
  {
    id: 'pj_showroom',
    name: 'Showroom Identity System',
    code: 'FF-05',
    summary:
      'Wayfinding, signage and material language for the six flagship showrooms, rolling out from Copenhagen outwards.',
    clientContactId: 'ct_jonas',
    companyId: 'co_fold',
    coverUrl: fromSet('interiors', 4, 'cover'),
    artSeed: 'showroom-identity',
    stage: 'review',
    health: 'at-risk',
    leadId: 'tm_ivy',
    memberIds: ['tm_ivy', 'tm_tomas'],
    startDate: d(-96),
    dueDate: d(9),
    budget: 86000,
    spent: 79800,
    tags: ['tag_brand', 'tag_print', 'tag_retainer'],
    archived: false,
    createdAt: d(-101),
    deliverables: [
      { id: 'dv_s1', name: 'Wayfinding system', quantity: '1 system, 12 sign types', done: true },
      { id: 'dv_s2', name: 'Material palette', quantity: '1 spec + samples', done: true },
      { id: 'dv_s3', name: 'Install guide', quantity: '1 manual', done: false },
    ],
    brief: {
      objective:
        'One signage language that survives six very different buildings — a converted dairy, two malls, and three street-level stores.',
      audience: 'Walk-in customers and the install crews who have to build it six times.',
      direction:
        'Quiet, architectural, dimensional. Signage that looks like part of the building rather than applied to it. Oak, powder-coated steel, and one accent.',
      constraints:
        'Fixings cannot penetrate the listed walls in the Copenhagen store. Budget is fixed and already 93% committed.',
      successCriteria: [
        'A new store can be signed from the manual with no studio involvement',
        'Under €14k per store at rollout',
        'Legible at 8m in the mall formats',
      ],
    },
  },
  {
    id: 'pj_marrow3',
    name: 'Marrow No.3 — Launch Identity',
    code: 'MR-07',
    summary:
      'Naming, identity and opening campaign for the third Marrow restaurant, opening in the West Loop this winter.',
    clientContactId: 'ct_rue',
    companyId: 'co_marrow',
    coverUrl: fromSet('food', 1, 'cover'),
    artSeed: 'marrow-no-3',
    stage: 'concept',
    health: 'on-track',
    leadId: 'tm_noor',
    memberIds: ['tm_noor', 'tm_dez', 'tm_ivy'],
    startDate: d(-21),
    dueDate: d(46),
    budget: 112000,
    spent: 28900,
    tags: ['tag_hospitality', 'tag_brand', 'tag_priority'],
    dealId: 'dl_marrow_three',
    archived: false,
    createdAt: d(-26),
    deliverables: [
      { id: 'dv_m1', name: 'Name & verbal identity', quantity: '1 route', done: false },
      { id: 'dv_m2', name: 'Visual identity', quantity: '1 system', done: false },
      { id: 'dv_m3', name: 'Opening campaign', quantity: 'OOH + social', done: false },
    ],
    brief: {
      objective:
        'Give the third Marrow its own character without cutting it loose from the group. It should feel like a sibling, not a franchise.',
      audience:
        'West Loop regulars who already eat at the other two, plus a hotel crowd who will find it on a list.',
      direction:
        'Warmer and looser than Marrow No.1. Hand-set type, ink on uncoated paper, a single saturated accent. Nothing that looks designed by committee.',
      constraints:
        'Name must clear a US trademark search. The building has a protected 1920s facade — no exterior signage above the door line.',
      successCriteria: [
        'Rue can hand it to a printer without a call',
        'Reads as Marrow at a glance, reads as its own place up close',
        'Opening week fully booked',
      ],
    },
  },
  {
    id: 'pj_menu',
    name: 'Menu & Print System',
    code: 'MR-06',
    summary:
      'A weekly-changing menu system across all Marrow venues, built so the kitchen can set it themselves.',
    clientContactId: 'ct_theo',
    companyId: 'co_marrow',
    coverUrl: fromSet('food', 5, 'cover'),
    artSeed: 'marrow-menu',
    stage: 'delivery',
    health: 'on-track',
    leadId: 'tm_tomas',
    memberIds: ['tm_tomas', 'tm_dez'],
    startDate: d(-74),
    dueDate: d(4),
    budget: 38000,
    spent: 34100,
    tags: ['tag_print', 'tag_hospitality'],
    archived: false,
    createdAt: d(-80),
    deliverables: [
      { id: 'dv_n1', name: 'Menu templates', quantity: '5 formats', done: true },
      { id: 'dv_n2', name: 'Typesetting guide', quantity: '1 manual', done: true },
      { id: 'dv_n3', name: 'Printer handover', quantity: '1 session', done: false },
    ],
    brief: {
      objective:
        'Stop the kitchen re-typing menus in a word processor every Tuesday. Give them a system that stays on-brand without a designer.',
      audience: 'Front-of-house staff setting the menu, and guests reading it in low light.',
      direction:
        'Editorial and unfussy. One typeface, three sizes, a strict grid. The paper does the work.',
      constraints:
        'Must print on the venue laser printers as well as the trade press. Minimum 10pt for legibility at candlelight levels.',
      successCriteria: [
        'A new menu is set in under 15 minutes by a non-designer',
        'No reprints from typesetting errors in the first month',
      ],
    },
  },
  {
    id: 'pj_trail',
    name: 'Trail Season Film',
    code: 'NB-11',
    summary:
      'A six-minute documentary film and campaign cutdowns following three long-distance walkers across a season.',
    clientContactId: 'ct_pace',
    companyId: 'co_northbound',
    coverUrl: fromSet('landscape', 0, 'cover'),
    artSeed: 'trail-season',
    stage: 'production',
    health: 'at-risk',
    leadId: 'tm_marco',
    memberIds: ['tm_marco', 'tm_salla', 'tm_noor'],
    startDate: d(-63),
    dueDate: d(17),
    budget: 224000,
    spent: 168200,
    tags: ['tag_campaign', 'tag_motion', 'tag_priority'],
    dealId: 'dl_nb_film',
    archived: false,
    createdAt: d(-70),
    deliverables: [
      { id: 'dv_t1', name: 'Documentary film', quantity: '1 × 6min', done: false },
      { id: 'dv_t2', name: 'Campaign cutdowns', quantity: '6 × 30s', done: false },
      { id: 'dv_t3', name: 'Stills library', quantity: '~120 frames', done: true },
    ],
    brief: {
      objective:
        'Prove Northbound belongs to people who actually walk. No hero shots, no summit-flag moments — the ordinary middle of a long trip.',
      audience:
        'Serious walkers who own three of these already, and the much larger group who want to be them.',
      direction:
        'Observational, handheld, available light. Weather is a character. Sound design carries the film — voiceover only where a walker speaks for themselves.',
      constraints:
        'One shoot window per season, no reshoots. All product must be in-line for autumn. Talent are real walkers, not actors.',
      successCriteria: [
        'Wren shows it at the retail conference without an intro',
        'Cutdowns hold up muted in-feed',
        'Delivered before the autumn buy',
      ],
    },
  },
  {
    id: 'pj_nbrebrand',
    name: 'Northbound Rebrand — Discovery',
    code: 'NB-12',
    summary:
      'Six weeks of research and territory work ahead of a full identity project decision in the new year.',
    clientContactId: 'ct_wren',
    companyId: 'co_northbound',
    coverUrl: fromSet('landscape', 7, 'cover'),
    artSeed: 'northbound-discovery',
    stage: 'discovery',
    health: 'on-track',
    leadId: 'tm_noor',
    memberIds: ['tm_noor', 'tm_ivy'],
    startDate: d(-11),
    dueDate: d(31),
    budget: 46000,
    spent: 9200,
    tags: ['tag_brand', 'tag_new-business'],
    dealId: 'dl_nb_rebrand',
    archived: false,
    createdAt: d(-15),
    deliverables: [
      { id: 'dv_r1', name: 'Stakeholder interviews', quantity: '12 sessions', done: true },
      { id: 'dv_r2', name: 'Category audit', quantity: '1 report', done: false },
      { id: 'dv_r3', name: 'Territory routes', quantity: '3 directions', done: false },
    ],
    brief: {
      objective:
        'Work out whether Northbound needs a new identity or a better-run existing one — and be honest if it is the second.',
      audience: 'The board, who will fund it, and the retail team, who will live with it.',
      direction:
        'Evidence first. Territories shown as mood and language, not logos. Nothing that looks like a finished answer this early.',
      constraints:
        'Six weeks, fixed fee. Cannot interview retail partners directly under the current agreement.',
      successCriteria: [
        'A clear recommendation the board can vote on',
        'Three territories that are genuinely different, not three tints of one',
      ],
    },
  },
  {
    id: 'pj_slope',
    name: 'Packaging Refresh',
    code: 'TS-02',
    summary:
      'Retail bag, subscription box and wholesale sack system for the full Third Slope range.',
    clientContactId: 'ct_mina',
    companyId: 'co_thirdslope',
    coverUrl: fromSet('coffee', 0, 'cover'),
    artSeed: 'third-slope-packaging',
    stage: 'review',
    health: 'blocked',
    leadId: 'tm_dez',
    memberIds: ['tm_dez', 'tm_tomas'],
    startDate: d(-45),
    dueDate: d(-3),
    budget: 54000,
    spent: 48600,
    tags: ['tag_packaging', 'tag_sustainable', 'tag_priority'],
    archived: false,
    createdAt: d(-49),
    deliverables: [
      { id: 'dv_p1', name: 'Retail bag', quantity: '4 SKUs', done: true },
      { id: 'dv_p2', name: 'Subscription box', quantity: '2 sizes', done: true },
      { id: 'dv_p3', name: 'Wholesale sack', quantity: '1 format', done: false },
    ],
    brief: {
      objective:
        'A range that holds together on a shelf and still lets each origin have its own character.',
      audience: 'Home brewers buying by origin, and cafés buying by the sack.',
      direction:
        'Uncoated kraft, one-colour print, big honest type. The origin does the differentiating, not the illustration.',
      constraints:
        'Soy inks only, kerbside recyclable, no laminate. Must survive a Melbourne summer in a van.',
      successCriteria: [
        'Legible at two metres on a supermarket shelf',
        'Under AU$0.42 per unit at 10k run',
        'No new SKU needs a new design',
      ],
    },
  },
  {
    id: 'pj_atrium',
    name: 'Practice Site & Monograph',
    code: 'AT-03',
    summary:
      'A new website and a 240-page monograph, designed together so the archive works in both.',
    clientContactId: 'ct_elke',
    companyId: 'co_atrium',
    coverUrl: fromSet('architecture', 3, 'cover'),
    artSeed: 'atrium-monograph',
    stage: 'production',
    health: 'on-track',
    leadId: 'tm_ivy',
    memberIds: ['tm_ivy', 'tm_tomas', 'tm_noor'],
    startDate: d(-88),
    dueDate: d(38),
    budget: 132000,
    spent: 71500,
    tags: ['tag_digital', 'tag_print', 'tag_brand'],
    archived: false,
    createdAt: d(-92),
    deliverables: [
      { id: 'dv_a1', name: 'Monograph', quantity: '240pp', done: false },
      { id: 'dv_a2', name: 'Website', quantity: '6 templates', done: false },
      { id: 'dv_a3', name: 'Image archive spec', quantity: '1 schema', done: true },
    ],
    brief: {
      objective:
        'One archive, two outputs. A project should be catalogued once and appear correctly in the book and on the site.',
      audience: 'Clients commissioning buildings, students, and the practice itself.',
      direction:
        'Print-led. Generous margins, one serif for the essays, a plain grotesque for the captions. The site inherits the book, not the other way round.',
      constraints:
        'Image licensing varies by photographer — some may not appear online. Book goes to press eleven weeks before launch.',
      successCriteria: [
        'A project is entered once and published to both',
        'The book stands on its own on a shelf',
        'Site loads in under 2s on a slow connection',
      ],
    },
  },
  {
    id: 'pj_ritual',
    name: 'Ritual Line Launch',
    code: 'ST-01',
    summary:
      'Identity, packaging and launch campaign for the Ritual range — delivered in the spring and now in market.',
    clientContactId: 'ct_lia',
    companyId: 'co_salttide',
    coverUrl: fromSet('water', 0, 'cover'),
    artSeed: 'ritual-launch',
    stage: 'complete',
    health: 'on-track',
    leadId: 'tm_dez',
    memberIds: ['tm_dez', 'tm_noor', 'tm_salla'],
    startDate: d(-198),
    dueDate: d(-46),
    budget: 94000,
    spent: 92300,
    tags: ['tag_packaging', 'tag_campaign', 'tag_brand'],
    archived: false,
    createdAt: d(-205),
    deliverables: [
      { id: 'dv_l1', name: 'Range identity', quantity: '1 system', done: true },
      { id: 'dv_l2', name: 'Primary packaging', quantity: '6 SKUs', done: true },
      { id: 'dv_l3', name: 'Launch campaign', quantity: 'Film + stills', done: true },
    ],
    brief: {
      objective: 'Launch Ritual as a considered daily habit rather than another skincare range.',
      audience: 'Existing Salt & Tide customers first; a wider wellness audience second.',
      direction: 'Wet stone, cold light, slow motion. Almost no colour. Type set very small.',
      constraints: 'Glass only. Refill-first, so the primary pack has to last years.',
      successCriteria: [
        'Sell-through above 60% in the first quarter',
        'Refill attach rate above 30%',
      ],
    },
  },
]

/* ---------------------------------------------------------- milestones -- */

export const milestones: Milestone[] = [
  // Quiet Objects
  { id: 'ms_q1', projectId: 'pj_quiet', name: 'Direction locked', date: d(-38), status: 'done' },
  { id: 'ms_q2', projectId: 'pj_quiet', name: 'Shoot — Jutland houses', date: d(-16), status: 'done' },
  {
    id: 'ms_q3',
    projectId: 'pj_quiet',
    name: 'Film rough cut to Karin',
    date: d(2),
    status: 'in-progress',
    note: 'Grade still outstanding on the kitchen sequence.',
  },
  { id: 'ms_q4', projectId: 'pj_quiet', name: 'Window artwork to print', date: d(15), status: 'upcoming' },
  { id: 'ms_q5', projectId: 'pj_quiet', name: 'Campaign live', date: d(24), status: 'upcoming' },

  // Showroom
  { id: 'ms_s1', projectId: 'pj_showroom', name: 'Material samples approved', date: d(-30), status: 'done' },
  {
    id: 'ms_s2',
    projectId: 'pj_showroom',
    name: 'Copenhagen fixings sign-off',
    date: d(-4),
    status: 'missed',
    note: 'Blocked on the listed-building consent. Jonas chasing.',
  },
  { id: 'ms_s3', projectId: 'pj_showroom', name: 'Install manual delivered', date: d(9), status: 'upcoming' },

  // Marrow No.3
  { id: 'ms_m1', projectId: 'pj_marrow3', name: 'Name shortlist', date: d(-6), status: 'done' },
  {
    id: 'ms_m2',
    projectId: 'pj_marrow3',
    name: 'Trademark clearance',
    date: d(1),
    status: 'in-progress',
  },
  { id: 'ms_m3', projectId: 'pj_marrow3', name: 'Identity routes presented', date: d(18), status: 'upcoming' },
  { id: 'ms_m4', projectId: 'pj_marrow3', name: 'Opening campaign live', date: d(46), status: 'upcoming' },

  // Menu
  { id: 'ms_n1', projectId: 'pj_menu', name: 'Templates signed off', date: d(-12), status: 'done' },
  { id: 'ms_n2', projectId: 'pj_menu', name: 'Printer handover', date: d(4), status: 'upcoming' },

  // Trail Season
  { id: 'ms_t1', projectId: 'pj_trail', name: 'Season one shoot', date: d(-41), status: 'done' },
  { id: 'ms_t2', projectId: 'pj_trail', name: 'Season two shoot', date: d(-13), status: 'done' },
  {
    id: 'ms_t3',
    projectId: 'pj_trail',
    name: 'Picture lock',
    date: d(-1),
    status: 'missed',
    note: 'Waiting on music clearance before we can lock.',
  },
  { id: 'ms_t4', projectId: 'pj_trail', name: 'Final delivery', date: d(17), status: 'upcoming' },

  // Northbound discovery
  { id: 'ms_r1', projectId: 'pj_nbrebrand', name: 'Interviews complete', date: d(-2), status: 'done' },
  { id: 'ms_r2', projectId: 'pj_nbrebrand', name: 'Audit readout', date: d(12), status: 'upcoming' },
  { id: 'ms_r3', projectId: 'pj_nbrebrand', name: 'Board recommendation', date: d(31), status: 'upcoming' },

  // Third Slope
  { id: 'ms_p1', projectId: 'pj_slope', name: 'Retail bag approved', date: d(-19), status: 'done' },
  {
    id: 'ms_p2',
    projectId: 'pj_slope',
    name: 'Wholesale sack sign-off',
    date: d(-3),
    status: 'missed',
    note: 'Bo raised shelf-legibility concerns after approval. Reopened.',
  },
  { id: 'ms_p3', projectId: 'pj_slope', name: 'Production files to mill', date: d(6), status: 'upcoming' },

  // Atrium
  { id: 'ms_a1', projectId: 'pj_atrium', name: 'Archive schema agreed', date: d(-51), status: 'done' },
  { id: 'ms_a2', projectId: 'pj_atrium', name: 'Monograph first pass', date: d(3), status: 'in-progress' },
  { id: 'ms_a3', projectId: 'pj_atrium', name: 'Site build begins', date: d(20), status: 'upcoming' },
  { id: 'ms_a4', projectId: 'pj_atrium', name: 'To press', date: d(38), status: 'upcoming' },

  // Ritual
  { id: 'ms_l1', projectId: 'pj_ritual', name: 'Packaging to production', date: d(-96), status: 'done' },
  { id: 'ms_l2', projectId: 'pj_ritual', name: 'Launch', date: d(-46), status: 'done' },
]
