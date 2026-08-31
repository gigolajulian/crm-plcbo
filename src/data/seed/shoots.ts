import type { Milestone, Shoot } from '../types'
import { fromSet } from '../images'
import { d } from './clock'

/* ============================================================================
   ELEVEN SHOOTS, one in every stage of the lifecycle.

   Arranged so the app has something true to say the moment it opens: a quote
   that has gone quiet and needs chasing, a deposit that has not landed, two
   licences inside the 60-day window, a gallery about to expire, and a shoot
   on the calendar this week.
   ========================================================================== */

const emptyBrief = {
  objective: '',
  audience: '',
  direction: '',
  constraints: '',
  successCriteria: [] as string[],
}

export const shoots: Shoot[] = [
  /* --------------------------------------------- in the edit, money committed */
  {
    id: 'sh_fold_aw',
    name: 'Fold & Field — Autumn/Winter campaign',
    code: 'FF-04',
    summary:
      'Three days in two lived-in houses. Hero stills for the campaign, a print series, and cropped verticals for the store windows.',
    contactId: 'ct_karin',
    companyId: 'co_fold',
    coverUrl: fromSet('interiors', 0, 'cover'),
    artSeed: 'fold-aw',
    stageId: 'st_edited',
    health: 'on-track',
    shootType: 'commercial',
    ownerId: 'tm_ivy',
    memberIds: ['tm_ivy', 'tm_dez', 'tm_salla'],

    leadSourceId: 'ls_repeat',
    probability: 100,
    inquiredAt: d(-74),
    quotedAt: d(-70),

    lineItems: [
      { id: 'li_faw_1', kind: 'shoot-fee', desc: 'Photography — 3 days on location', qty: 3, rate: 4200 },
      { id: 'li_faw_2', kind: 'shoot-fee', desc: 'First assistant + digital tech', qty: 3, rate: 950 },
      { id: 'li_faw_3', kind: 'post', desc: 'Selects, colour and retouch — 40 finals', qty: 40, rate: 85 },
      { id: 'li_faw_4', kind: 'licensing', desc: 'Campaign usage — web, print, OOH, EU, 24 months', qty: 1, rate: 18000 },
      { id: 'li_faw_5', kind: 'studio', desc: 'Van hire, fuel and crew catering', qty: 1, rate: 1240 },
    ],
    depositPct: 50,
    expectedCloseDate: d(12),

    shootDates: [
      { id: 'sd_faw_1', date: d(-31), callTime: '07:30', wrapTime: '18:00', tentative: false, outdoor: false },
      { id: 'sd_faw_2', date: d(-30), callTime: '08:00', wrapTime: '17:30', tentative: false, outdoor: false },
      { id: 'sd_faw_3', date: d(-29), callTime: '08:00', wrapTime: '16:00', tentative: false, outdoor: true },
    ],
    locationIds: [],
    talentIds: [],

    deliverables: [
      { id: 'dv_faw_1', name: 'Campaign heroes', contracted: 12, delivered: 12, revisionsIncluded: 2, revisionsUsed: 1 },
      { id: 'dv_faw_2', name: 'Print series', contracted: 18, delivered: 11, revisionsIncluded: 2, revisionsUsed: 0 },
      { id: 'dv_faw_3', name: 'Window verticals (4:5)', contracted: 10, delivered: 0, revisionsIncluded: 1, revisionsUsed: 0 },
    ],
    promisedTurnaroundDays: 21,
    galleryUrl: 'https://gallery.plcbo.studio/fold-aw',
    galleryExpiresAt: d(38),
    catalogPath: '/Volumes/Work/2026/FF-04 Fold AW/FF-04.lrcat',

    contractStatus: 'signed',
    releaseStatus: 'not-required',

    tags: ['tag_campaign', 'tag_interiors', 'tag_retainer'],
    brief: {
      objective:
        'Make the collection feel like a house someone already lives in, not a catalogue. The pictures have to carry the shift to direct-to-consumer without announcing it.',
      audience:
        'Thirty to fifty, second home or first serious home. They have bought design before and can tell when they are being sold to.',
      direction:
        'Domestic, unstyled, slightly overcast. Objects shot in use rather than arranged. Long lenses, window light, nothing on set a real person would not own.',
      constraints:
        'Existing customer homes, no studio. Every frame must survive a 4:5 crop for the window vinyl. Available light only.',
      successCriteria: [
        'Karin can show it to the board without translating it',
        'Twelve heroes that hold at two metres wide',
        'A usable vertical from every hero setup',
      ],
    },
    notes: 'Karin wants the kitchen frames pushed warmer than the rest. Second round of colour goes back Thursday.',
    archived: false,
    createdAt: d(-74),
  },

  /* ------------------------------------------ delivered, gallery expiring soon */
  {
    id: 'sh_fold_showroom',
    name: 'Fold & Field — Showroom interiors',
    code: 'FF-05',
    summary: 'Interior coverage of the six flagship showrooms for the trade press pack and the wholesale site.',
    contactId: 'ct_jonas',
    companyId: 'co_fold',
    coverUrl: fromSet('interiors', 4, 'cover'),
    artSeed: 'fold-showroom',
    stageId: 'st_delivered',
    health: 'at-risk',
    shootType: 'commercial',
    ownerId: 'tm_ivy',
    memberIds: ['tm_ivy', 'tm_tomas'],

    leadSourceId: 'ls_repeat',
    probability: 100,
    inquiredAt: d(-118),
    quotedAt: d(-114),

    lineItems: [
      { id: 'li_fsh_1', kind: 'shoot-fee', desc: 'Photography — 2 days, Copenhagen', qty: 2, rate: 4200 },
      { id: 'li_fsh_2', kind: 'post', desc: 'Perspective correction and colour — 24 finals', qty: 24, rate: 95 },
      { id: 'li_fsh_3', kind: 'licensing', desc: 'Trade press and wholesale site, worldwide, 12 months', qty: 1, rate: 6500 },
      { id: 'li_fsh_4', kind: 'studio', desc: 'Flights and two nights', qty: 1, rate: 1850 },
    ],
    depositPct: 50,
    expectedCloseDate: d(-40),

    shootDates: [
      { id: 'sd_fsh_1', date: d(-63), callTime: '07:00', wrapTime: '19:00', tentative: false, outdoor: false },
      { id: 'sd_fsh_2', date: d(-62), callTime: '07:00', wrapTime: '18:00', tentative: false, outdoor: false },
    ],
    locationIds: [],
    talentIds: [],

    deliverables: [
      { id: 'dv_fsh_1', name: 'Showroom sets', contracted: 24, delivered: 24, revisionsIncluded: 2, revisionsUsed: 2 },
      { id: 'dv_fsh_2', name: 'Detail frames', contracted: 12, delivered: 12, revisionsIncluded: 1, revisionsUsed: 1 },
    ],
    promisedTurnaroundDays: 14,
    deliveredAt: d(-44),
    galleryUrl: 'https://gallery.plcbo.studio/fold-showrooms',
    // Inside the warning window — the client has not downloaded everything yet.
    galleryExpiresAt: d(9),
    catalogPath: '/Volumes/Work/2026/FF-05 Showrooms/FF-05.lrcat',

    contractStatus: 'signed',
    releaseStatus: 'not-required',

    tags: ['tag_interiors', 'tag_retainer'],
    brief: emptyBrief,
    notes: 'Both revision rounds used and Jonas has asked for a third. Chargeable — raise it before shooting anything else for him.',
    archived: false,
    createdAt: d(-118),
  },

  /* -------------------------------------------------- on the calendar this week */
  {
    id: 'sh_marrow_three',
    name: 'Marrow No.3 — Opening',
    code: 'MR-07',
    summary: 'Interiors, plated dishes and the kitchen pass on the night before the West Loop opening.',
    contactId: 'ct_rue',
    companyId: 'co_marrow',
    coverUrl: fromSet('food', 1, 'cover'),
    artSeed: 'marrow-three',
    stageId: 'st_scheduled',
    health: 'on-track',
    shootType: 'editorial',
    ownerId: 'tm_noor',
    memberIds: ['tm_noor', 'tm_dez'],

    leadSourceId: 'ls_referral_client',
    referredByContactId: 'ct_karin',
    probability: 90,
    inquiredAt: d(-38),
    quotedAt: d(-34),

    lineItems: [
      { id: 'li_m3_1', kind: 'shoot-fee', desc: 'Photography — 1 evening + 1 day', qty: 2, rate: 3800 },
      { id: 'li_m3_2', kind: 'shoot-fee', desc: 'Food stylist', qty: 1, rate: 1400 },
      { id: 'li_m3_3', kind: 'post', desc: 'Colour and retouch — 30 finals', qty: 30, rate: 80 },
      { id: 'li_m3_4', kind: 'licensing', desc: 'Site, social and press, North America, 18 months', qty: 1, rate: 7200 },
    ],
    depositPct: 50,
    expectedCloseDate: d(21),

    shootDates: [
      { id: 'sd_m3_1', date: d(4), callTime: '16:00', wrapTime: '23:00', tentative: false, outdoor: false },
      { id: 'sd_m3_2', date: d(5), callTime: '09:00', wrapTime: '15:00', tentative: false, outdoor: false },
      { id: 'sd_m3_3', date: d(11), callTime: '18:00', tentative: true, outdoor: true, note: 'Hold — exterior at dusk if the frontage is finished' },
    ],
    locationIds: [],
    talentIds: [],

    deliverables: [
      { id: 'dv_m3_1', name: 'Interiors', contracted: 12, delivered: 0, revisionsIncluded: 2, revisionsUsed: 0 },
      { id: 'dv_m3_2', name: 'Dishes', contracted: 14, delivered: 0, revisionsIncluded: 2, revisionsUsed: 0 },
      { id: 'dv_m3_3', name: 'Kitchen and team', contracted: 4, delivered: 0, revisionsIncluded: 1, revisionsUsed: 0 },
    ],
    promisedTurnaroundDays: 10,

    contractStatus: 'signed',
    releaseStatus: 'sent',

    tags: ['tag_food', 'tag_editorial', 'tag_priority'],
    brief: {
      objective: 'Pictures the press can run on the opening announcement, and that the site can live on for a year.',
      audience: 'Food press and the neighbourhood. People deciding where to eat on a Friday.',
      direction: 'Warm, close, candlelit. Steam and hands. Nothing overhead, nothing symmetrical.',
      constraints: 'The kitchen cannot stop service. One pass at the dining room before guests arrive at 18:00.',
      successCriteria: ['A frame that works as a full-bleed opener', 'Every dish on the launch menu', 'No empty-restaurant loneliness'],
    },
    notes: 'Releases still out with the two front-of-house staff who appear in the kitchen frames. Chase before the 4th.',
    archived: false,
    createdAt: d(-38),
  },

  /* ------------------------------- licence live, inside the 60-day expiry window */
  {
    id: 'sh_marrow_menu',
    name: 'Marrow — Autumn menu',
    code: 'MR-06',
    summary: 'Seasonal menu refresh across all three rooms. Shot flat for the site, loose for social.',
    contactId: 'ct_theo',
    companyId: 'co_marrow',
    coverUrl: fromSet('food', 4, 'cover'),
    artSeed: 'marrow-menu',
    stageId: 'st_licensed',
    health: 'on-track',
    shootType: 'commercial',
    ownerId: 'tm_noor',
    memberIds: ['tm_noor'],

    leadSourceId: 'ls_repeat',
    probability: 100,
    inquiredAt: d(-330),
    quotedAt: d(-326),

    lineItems: [
      { id: 'li_mm_1', kind: 'shoot-fee', desc: 'Photography — 1 day', qty: 1, rate: 3800 },
      { id: 'li_mm_2', kind: 'post', desc: 'Colour and retouch — 22 finals', qty: 22, rate: 80 },
      { id: 'li_mm_3', kind: 'licensing', desc: 'Menu, site and social, North America, 12 months', qty: 1, rate: 4800 },
    ],
    depositPct: 50,
    expectedCloseDate: d(-300),

    shootDates: [{ id: 'sd_mm_1', date: d(-318), callTime: '08:00', wrapTime: '17:00', tentative: false, outdoor: false }],
    locationIds: [],
    talentIds: [],

    deliverables: [
      { id: 'dv_mm_1', name: 'Menu stills', contracted: 22, delivered: 22, revisionsIncluded: 2, revisionsUsed: 1 },
    ],
    promisedTurnaroundDays: 10,
    deliveredAt: d(-306),
    galleryUrl: 'https://gallery.plcbo.studio/marrow-autumn',
    catalogPath: '/Volumes/Work/2025/MR-06 Autumn Menu/MR-06.lrcat',

    contractStatus: 'signed',
    releaseStatus: 'not-required',

    tags: ['tag_food', 'tag_retainer'],
    brief: emptyBrief,
    notes: 'Theo has already asked twice whether the pictures can stay up. Renewal conversation, not a favour.',
    archived: false,
    createdAt: d(-330),
  },

  /* ------------------------------------------------------ shot, waiting on edit */
  {
    id: 'sh_north_trail',
    name: 'Northbound — Trail series',
    code: 'NB-11',
    summary: 'Four days in the Cairngorms. Product on the body, in weather, at the two ends of the day.',
    contactId: 'ct_wren',
    companyId: 'co_northbound',
    coverUrl: fromSet('landscape', 2, 'cover'),
    artSeed: 'north-trail',
    stageId: 'st_shot',
    health: 'on-track',
    shootType: 'commercial',
    ownerId: 'tm_ivy',
    memberIds: ['tm_ivy', 'tm_salla', 'tm_marco'],

    leadSourceId: 'ls_agency',
    probability: 100,
    inquiredAt: d(-56),
    quotedAt: d(-52),

    lineItems: [
      { id: 'li_nt_1', kind: 'shoot-fee', desc: 'Photography — 4 days on location', qty: 4, rate: 4500 },
      { id: 'li_nt_2', kind: 'shoot-fee', desc: 'Assistant + digital tech, 4 days', qty: 4, rate: 1100 },
      { id: 'li_nt_3', kind: 'shoot-fee', desc: 'Talent — 2 models, 4 days, buyout inclusive', qty: 1, rate: 9600 },
      { id: 'li_nt_4', kind: 'post', desc: 'Selects, colour and retouch — 60 finals', qty: 60, rate: 90 },
      { id: 'li_nt_5', kind: 'licensing', desc: 'Global campaign, all media, 24 months', qty: 1, rate: 24000 },
      { id: 'li_nt_6', kind: 'studio', desc: 'Vehicles, lodge, mountain guide', qty: 1, rate: 4700 },
    ],
    depositPct: 50,
    expectedCloseDate: d(26),

    shootDates: [
      { id: 'sd_nt_1', date: d(-12), callTime: '05:00', wrapTime: '20:30', tentative: false, outdoor: true },
      { id: 'sd_nt_2', date: d(-11), callTime: '05:00', wrapTime: '20:30', tentative: false, outdoor: true },
      { id: 'sd_nt_3', date: d(-10), callTime: '06:00', wrapTime: '19:00', tentative: false, outdoor: true },
      { id: 'sd_nt_4', date: d(-9), callTime: '06:00', wrapTime: '16:00', tentative: false, outdoor: true },
    ],
    locationIds: [],
    talentIds: [],

    deliverables: [
      { id: 'dv_nt_1', name: 'Campaign heroes', contracted: 20, delivered: 0, revisionsIncluded: 2, revisionsUsed: 0 },
      { id: 'dv_nt_2', name: 'Product on-body', contracted: 30, delivered: 0, revisionsIncluded: 2, revisionsUsed: 0 },
      { id: 'dv_nt_3', name: 'Landscape plates', contracted: 10, delivered: 0, revisionsIncluded: 1, revisionsUsed: 0 },
    ],
    promisedTurnaroundDays: 28,
    catalogPath: '/Volumes/Work/2026/NB-11 Trail/NB-11.lrcat',

    contractStatus: 'signed',
    releaseStatus: 'signed',

    tags: ['tag_campaign', 'tag_location', 'tag_talent'],
    brief: {
      objective: 'Show the kit doing the job it was built for, in weather nobody would choose.',
      audience: 'People who already own good gear and are replacing it.',
      direction: 'Cold light, real distance, no posing. If it looks comfortable it is wrong.',
      constraints: 'Four days, two of them forecast wet. Everything carried in. No generators above the treeline.',
      successCriteria: ['Twenty heroes with genuine weather in them', 'Every SKU covered on-body', 'Nothing that looks like a studio backdrop'],
    },
    notes: 'Day three was fogged out and we made it work. 4,100 frames to cull — Salla starts Monday.',
    archived: false,
    createdAt: d(-56),
  },

  /* -------------------------------- quoted 9 days ago, gone quiet: chase this one */
  {
    id: 'sh_north_lookbook',
    name: 'Northbound — Spring lookbook',
    code: 'NB-12',
    summary: 'Studio lookbook for the spring range. Twenty-two pieces, two models, one day.',
    contactId: 'ct_pace',
    companyId: 'co_northbound',
    coverUrl: fromSet('landscape', 7, 'cover'),
    artSeed: 'north-lookbook',
    stageId: 'st_quoted',
    health: 'at-risk',
    shootType: 'commercial',
    ownerId: 'tm_ivy',
    memberIds: ['tm_ivy'],

    leadSourceId: 'ls_agency',
    probability: 30,
    inquiredAt: d(-14),
    // Quoted nine days ago with nothing back — past the 7-day nudge.
    quotedAt: d(-9),

    lineItems: [
      { id: 'li_nl_1', kind: 'shoot-fee', desc: 'Photography — 1 studio day', qty: 1, rate: 4200 },
      { id: 'li_nl_2', kind: 'shoot-fee', desc: 'Talent — 2 models, 1 day', qty: 1, rate: 2400 },
      { id: 'li_nl_3', kind: 'post', desc: 'Cut-out and colour — 44 finals', qty: 44, rate: 65 },
      { id: 'li_nl_4', kind: 'licensing', desc: 'Wholesale and site, 12 months', qty: 1, rate: 3800 },
      { id: 'li_nl_5', kind: 'studio', desc: 'Studio hire and lighting', qty: 1, rate: 1600 },
    ],
    depositPct: 50,
    expectedCloseDate: d(18),

    shootDates: [{ id: 'sd_nl_1', date: d(30), tentative: true, outdoor: false, note: 'Pencilled — releases on Friday if no reply' }],
    locationIds: [],
    talentIds: [],

    deliverables: [],
    promisedTurnaroundDays: 14,

    contractStatus: 'none',
    releaseStatus: 'none',

    tags: ['tag_lookbook', 'tag_studio'],
    brief: emptyBrief,
    notes: 'Pace liked the number on the call and then went quiet. Studio hold releases Friday.',
    archived: false,
    createdAt: d(-14),
  },

  /* ------------------------------------------- booked, deposit invoiced not paid */
  {
    id: 'sh_third_roastery',
    name: 'Third Slope — Roastery story',
    code: 'TS-03',
    summary: 'A working day at the roastery, from green bean intake to the last bag sealed.',
    contactId: 'ct_mina',
    companyId: 'co_thirdslope',
    coverUrl: fromSet('coffee', 0, 'cover'),
    artSeed: 'third-roastery',
    stageId: 'st_deposit',
    health: 'on-track',
    shootType: 'editorial',
    ownerId: 'tm_noor',
    memberIds: ['tm_noor'],

    leadSourceId: 'ls_instagram',
    probability: 70,
    inquiredAt: d(-25),
    quotedAt: d(-20),

    lineItems: [
      { id: 'li_tr_1', kind: 'shoot-fee', desc: 'Photography — 1 day', qty: 1, rate: 3200 },
      { id: 'li_tr_2', kind: 'post', desc: 'Colour and retouch — 25 finals', qty: 25, rate: 75 },
      { id: 'li_tr_3', kind: 'licensing', desc: 'Site, packaging and social, 24 months', qty: 1, rate: 5400 },
    ],
    depositPct: 50,
    expectedCloseDate: d(15),

    shootDates: [{ id: 'sd_tr_1', date: d(17), callTime: '06:30', wrapTime: '16:00', tentative: false, outdoor: false }],
    locationIds: [],
    talentIds: [],

    deliverables: [
      { id: 'dv_tr_1', name: 'Process story', contracted: 20, delivered: 0, revisionsIncluded: 2, revisionsUsed: 0 },
      { id: 'dv_tr_2', name: 'Team portraits', contracted: 5, delivered: 0, revisionsIncluded: 1, revisionsUsed: 0 },
    ],
    promisedTurnaroundDays: 14,

    contractStatus: 'sent',
    releaseStatus: 'sent',

    tags: ['tag_editorial', 'tag_portrait'],
    brief: emptyBrief,
    notes: 'Deposit invoice went out a week ago. Nothing in the account yet — shoot is in seventeen days.',
    archived: false,
    createdAt: d(-25),
  },

  /* ------------------------------------------------------------- brand new lead */
  {
    id: 'sh_third_packs',
    name: 'Third Slope — Pack shots',
    code: 'TS-04',
    summary: 'Twelve retail bags on white plus six lifestyle setups for the wholesale deck.',
    contactId: 'ct_bo',
    companyId: 'co_thirdslope',
    coverUrl: fromSet('coffee', 3, 'cover'),
    artSeed: 'third-packs',
    stageId: 'st_inquiry',
    health: 'on-track',
    shootType: 'product',
    ownerId: 'tm_ivy',
    memberIds: ['tm_ivy'],

    leadSourceId: 'ls_referral_crew',
    probability: 10,
    inquiredAt: d(-2),

    lineItems: [],
    depositPct: 50,
    expectedCloseDate: d(45),

    shootDates: [],
    locationIds: [],
    talentIds: [],
    deliverables: [],

    contractStatus: 'none',
    releaseStatus: 'none',

    tags: ['tag_studio'],
    brief: emptyBrief,
    notes: 'Came in through Mina. Wants a number by the end of the week.',
    archived: false,
    createdAt: d(-2),
  },

  /* --------------------------- licence live and expiring inside three weeks */
  {
    id: 'sh_atrium_civic',
    name: 'Atrium — Civic centre',
    code: 'AT-02',
    summary: 'Completed-building coverage for the awards submission and the practice monograph.',
    contactId: 'ct_elke',
    companyId: 'co_atrium',
    coverUrl: fromSet('architecture', 1, 'cover'),
    artSeed: 'atrium-civic',
    stageId: 'st_licensed',
    health: 'on-track',
    shootType: 'commercial',
    ownerId: 'tm_ivy',
    memberIds: ['tm_ivy', 'tm_tomas'],

    leadSourceId: 'ls_portfolio',
    probability: 100,
    inquiredAt: d(-400),
    quotedAt: d(-396),

    lineItems: [
      { id: 'li_ac_1', kind: 'shoot-fee', desc: 'Photography — 2 days, dawn and dusk', qty: 2, rate: 4000 },
      { id: 'li_ac_2', kind: 'post', desc: 'Perspective, blending and colour — 18 finals', qty: 18, rate: 140 },
      { id: 'li_ac_3', kind: 'licensing', desc: 'Awards, press and monograph, worldwide, 12 months', qty: 1, rate: 8600 },
    ],
    depositPct: 50,
    expectedCloseDate: d(-360),

    shootDates: [
      { id: 'sd_ac_1', date: d(-372), callTime: '05:30', wrapTime: '21:00', tentative: false, outdoor: true },
      { id: 'sd_ac_2', date: d(-371), callTime: '05:30', wrapTime: '21:00', tentative: false, outdoor: true },
    ],
    locationIds: [],
    talentIds: [],

    deliverables: [
      { id: 'dv_ac_1', name: 'Exteriors', contracted: 10, delivered: 10, revisionsIncluded: 2, revisionsUsed: 1 },
      { id: 'dv_ac_2', name: 'Interiors', contracted: 8, delivered: 8, revisionsIncluded: 2, revisionsUsed: 0 },
    ],
    promisedTurnaroundDays: 21,
    deliveredAt: d(-350),
    catalogPath: '/Volumes/Work/2025/AT-02 Civic/AT-02.lrcat',

    contractStatus: 'signed',
    releaseStatus: 'not-required',

    tags: ['tag_interiors', 'tag_location'],
    brief: emptyBrief,
    notes: 'Monograph goes to print in the spring. If the licence lapses first they cannot use the pictures in it.',
    archived: false,
    createdAt: d(-400),
  },

  /* ------------------------------------------------------------------- wrapped */
  {
    id: 'sh_salt_ritual',
    name: 'Salt & Tide — Ritual range',
    code: 'ST-05',
    summary: 'Product and texture for the new ritual range. Water, glass and a lot of very slow light.',
    contactId: 'ct_lia',
    companyId: 'co_salttide',
    coverUrl: fromSet('water', 0, 'cover'),
    artSeed: 'salt-ritual',
    stageId: 'st_wrapped',
    health: 'on-track',
    shootType: 'product',
    ownerId: 'tm_noor',
    memberIds: ['tm_noor', 'tm_marco'],

    leadSourceId: 'ls_referral_client',
    referredByContactId: 'ct_mina',
    probability: 100,
    inquiredAt: d(-260),
    quotedAt: d(-256),

    lineItems: [
      { id: 'li_sr_1', kind: 'shoot-fee', desc: 'Photography — 2 studio days', qty: 2, rate: 3600 },
      { id: 'li_sr_2', kind: 'post', desc: 'Retouch — 34 finals', qty: 34, rate: 110 },
      { id: 'li_sr_3', kind: 'licensing', desc: 'Packaging and e-commerce, perpetual', qty: 1, rate: 9200 },
      { id: 'li_sr_4', kind: 'studio', desc: 'Studio hire, 2 days', qty: 2, rate: 850 },
    ],
    depositPct: 50,
    expectedCloseDate: d(-230),

    shootDates: [
      { id: 'sd_sr_1', date: d(-244), callTime: '09:00', wrapTime: '19:00', tentative: false, outdoor: false },
      { id: 'sd_sr_2', date: d(-243), callTime: '09:00', wrapTime: '18:00', tentative: false, outdoor: false },
    ],
    locationIds: [],
    talentIds: [],

    deliverables: [
      { id: 'dv_sr_1', name: 'Product on white', contracted: 22, delivered: 22, revisionsIncluded: 2, revisionsUsed: 2 },
      { id: 'dv_sr_2', name: 'Texture and mood', contracted: 12, delivered: 12, revisionsIncluded: 1, revisionsUsed: 1 },
    ],
    promisedTurnaroundDays: 21,
    deliveredAt: d(-226),
    catalogPath: '/Volumes/Work/2025/ST-05 Ritual/ST-05.lrcat',

    contractStatus: 'signed',
    releaseStatus: 'not-required',

    tags: ['tag_studio', 'tag_campaign'],
    brief: emptyBrief,
    notes: 'Perpetual licence, so nothing to chase. Lia has already mentioned a second range for the spring.',
    archived: false,
    createdAt: d(-260),
  },

  /* ---------------------------------------------------------------------- lost */
  {
    id: 'sh_salt_founder',
    name: 'Salt & Tide — Founder portraits',
    code: 'ST-06',
    summary: 'Press portraits of the two founders for the funding announcement.',
    contactId: 'ct_gus',
    companyId: 'co_salttide',
    coverUrl: fromSet('water', 4, 'cover'),
    artSeed: 'salt-founder',
    stageId: 'st_lost',
    health: 'on-track',
    shootType: 'portrait',
    ownerId: 'tm_ivy',
    memberIds: ['tm_ivy'],

    leadSourceId: 'ls_repeat',
    probability: 0,
    inquiredAt: d(-70),
    quotedAt: d(-66),

    lineItems: [
      { id: 'li_sf_1', kind: 'shoot-fee', desc: 'Photography — half day', qty: 1, rate: 2200 },
      { id: 'li_sf_2', kind: 'post', desc: 'Retouch — 8 finals', qty: 8, rate: 120 },
      { id: 'li_sf_3', kind: 'licensing', desc: 'Press, worldwide, perpetual', qty: 1, rate: 1800 },
    ],
    depositPct: 50,
    expectedCloseDate: d(-50),

    shootDates: [],
    locationIds: [],
    talentIds: [],
    deliverables: [],

    contractStatus: 'none',
    releaseStatus: 'none',

    tags: ['tag_portrait'],
    brief: emptyBrief,
    notes: 'Announcement was pulled forward two weeks and we could not move. Their in-house team shot it. Worth another go in the spring.',
    archived: false,
    createdAt: d(-70),
    closedAt: d(-58),
  },
]

/* ============================================================================
   MILESTONES — the dates that actually move a shoot along.
   ========================================================================== */

export const milestones: Milestone[] = [
  { id: 'ms_faw_1', shootId: 'sh_fold_aw', name: 'Shoot days', date: d(-31), status: 'done' },
  { id: 'ms_faw_2', shootId: 'sh_fold_aw', name: 'First edit to Karin', date: d(-12), status: 'done' },
  { id: 'ms_faw_3', shootId: 'sh_fold_aw', name: 'Window verticals due', date: d(3), status: 'in-progress' },
  { id: 'ms_faw_4', shootId: 'sh_fold_aw', name: 'Final delivery', date: d(12), status: 'upcoming' },

  { id: 'ms_fsh_1', shootId: 'sh_fold_showroom', name: 'Delivered', date: d(-44), status: 'done' },
  { id: 'ms_fsh_2', shootId: 'sh_fold_showroom', name: 'Gallery expires', date: d(9), status: 'upcoming' },

  { id: 'ms_m3_1', shootId: 'sh_marrow_three', name: 'Releases back from staff', date: d(2), status: 'in-progress' },
  { id: 'ms_m3_2', shootId: 'sh_marrow_three', name: 'Evening shoot', date: d(4), status: 'upcoming' },
  { id: 'ms_m3_3', shootId: 'sh_marrow_three', name: 'Day shoot', date: d(5), status: 'upcoming' },
  { id: 'ms_m3_4', shootId: 'sh_marrow_three', name: 'Press selects to Rue', date: d(8), status: 'upcoming' },

  { id: 'ms_mm_1', shootId: 'sh_marrow_menu', name: 'Licence ends', date: d(46), status: 'upcoming' },

  { id: 'ms_nt_1', shootId: 'sh_north_trail', name: 'Location days', date: d(-12), status: 'done' },
  { id: 'ms_nt_2', shootId: 'sh_north_trail', name: 'Selects to agency', date: d(6), status: 'upcoming' },
  { id: 'ms_nt_3', shootId: 'sh_north_trail', name: 'Final delivery', date: d(19), status: 'upcoming' },

  { id: 'ms_nl_1', shootId: 'sh_north_lookbook', name: 'Studio hold releases', date: d(2), status: 'upcoming' },

  { id: 'ms_tr_1', shootId: 'sh_third_roastery', name: 'Deposit due', date: d(-1), status: 'missed' },
  { id: 'ms_tr_2', shootId: 'sh_third_roastery', name: 'Shoot day', date: d(17), status: 'upcoming' },

  { id: 'ms_ac_1', shootId: 'sh_atrium_civic', name: 'Licence ends', date: d(22), status: 'upcoming' },
]
