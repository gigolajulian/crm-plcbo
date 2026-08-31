import type {
  Company,
  Contact,
  CustomField,
  LeadSource,
  NotificationPrefs,
  PipelineStage,
  Tag,
  TeamMember,
} from '../types'
import { DEFAULT_PIPELINE } from '../pipeline'
import { portrait } from '../images'
import { d } from './clock'

/* ------------------------------------------------------------ the studio -- */

export const team: TeamMember[] = [
  {
    id: 'tm_ivy',
    name: 'Ivy Marchetti',
    role: 'Founder & Photographer',
    permissionRole: 'owner',
    email: 'ivy@plcbo.studio',
    avatar: portrait(5),
    capacity: 32,
    active: true,
  },
  {
    id: 'tm_dez',
    name: 'Dez Okonkwo',
    role: 'First Assistant',
    permissionRole: 'admin',
    email: 'dez@plcbo.studio',
    avatar: portrait(12),
    capacity: 38,
    active: true,
  },
  {
    id: 'tm_salla',
    name: 'Salla Virtanen',
    role: 'Producer',
    permissionRole: 'admin',
    email: 'salla@plcbo.studio',
    avatar: portrait(9),
    capacity: 40,
    active: true,
  },
  {
    id: 'tm_marco',
    name: 'Marco Reyes',
    role: 'Digital Tech',
    permissionRole: 'member',
    email: 'marco@plcbo.studio',
    avatar: portrait(33),
    capacity: 40,
    active: true,
  },
  {
    id: 'tm_noor',
    name: 'Noor Haddad',
    role: 'Retoucher',
    permissionRole: 'member',
    email: 'noor@plcbo.studio',
    avatar: portrait(26),
    capacity: 30,
    active: true,
  },
  {
    id: 'tm_tomas',
    name: 'Tomás Bergeron',
    role: 'Second Assistant',
    permissionRole: 'member',
    email: 'tomas@plcbo.studio',
    avatar: portrait(60),
    capacity: 40,
    active: true,
  },
]

export const CURRENT_USER_ID = 'tm_ivy'

/* ----------------------------------------------------------------- tags -- */

export const tags: Tag[] = [
  { id: 'tag_editorial', label: 'Editorial', tone: 'lime' },
  { id: 'tag_campaign', label: 'Campaign', tone: 'info' },
  { id: 'tag_lookbook', label: 'Lookbook', tone: 'neutral' },
  { id: 'tag_food', label: 'Food', tone: 'lime' },
  { id: 'tag_interiors', label: 'Interiors', tone: 'neutral' },
  { id: 'tag_portrait', label: 'Portrait', tone: 'info' },
  { id: 'tag_studio', label: 'Studio', tone: 'neutral' },
  { id: 'tag_location', label: 'On location', tone: 'info' },
  { id: 'tag_talent', label: 'Talent booked', tone: 'caution' },
  { id: 'tag_retainer', label: 'Retainer', tone: 'positive' },
  { id: 'tag_priority', label: 'Priority', tone: 'critical' },
  { id: 'tag_referral', label: 'Referral', tone: 'positive' },
]

/* ------------------------------------------------------------- pipeline -- */

export const pipeline: PipelineStage[] = DEFAULT_PIPELINE

/* --------------------------------------------------------- lead sources -- */

export const leadSources: LeadSource[] = [
  { id: 'ls_referral_client', label: 'Client referral', category: 'referral', active: true },
  { id: 'ls_referral_crew', label: 'Crew referral', category: 'referral', active: true },
  { id: 'ls_instagram', label: 'Instagram', category: 'social', active: true },
  { id: 'ls_portfolio', label: 'Portfolio site', category: 'direct', active: true },
  { id: 'ls_agency', label: 'Agency roster', category: 'agency', active: true },
  { id: 'ls_repeat', label: 'Repeat client', category: 'repeat', active: true },
  { id: 'ls_directory', label: 'Photo directory', category: 'other', active: false },
]

/* ------------------------------------------------------------ companies -- */

export const companies: Company[] = [
  {
    id: 'co_fold',
    name: 'Fold & Field',
    industry: 'Furniture & interiors',
    website: 'foldandfield.com',
    location: 'Copenhagen, DK',
    size: '60–120 people',
    tags: ['tag_brand', 'tag_retainer', 'tag_sustainable'],
    notes:
      'Family-owned since 1978. Moving from a wholesale model to direct-to-consumer; every decision runs past Karin before it ships.',
    artSeed: 'fold-and-field',
    since: d(-880),
  },
  {
    id: 'co_marrow',
    name: 'Marrow Hospitality',
    industry: 'Restaurant group',
    website: 'marrow.group',
    location: 'Chicago, US',
    size: '200+ people',
    tags: ['tag_hospitality', 'tag_brand', 'tag_print'],
    notes:
      'Four restaurants, a fifth in build-out. Fast-moving and design-literate — they will push back, and they are usually right.',
    artSeed: 'marrow-hospitality',
    since: d(-410),
  },
  {
    id: 'co_northbound',
    name: 'Northbound Supply',
    industry: 'Outdoor apparel',
    website: 'northboundsupply.co',
    location: 'Portland, US',
    size: '120–200 people',
    tags: ['tag_campaign', 'tag_motion', 'tag_sustainable'],
    notes:
      'New CMO arrived last spring and is rebuilding the brand from the inside. Long lead times, big budgets, slow sign-off.',
    artSeed: 'northbound-supply',
    since: d(-300),
  },
  {
    id: 'co_thirdslope',
    name: 'Third Slope Coffee',
    industry: 'Specialty roaster',
    website: 'thirdslope.coffee',
    location: 'Melbourne, AU',
    size: '20–60 people',
    tags: ['tag_packaging', 'tag_sustainable', 'tag_referral'],
    notes:
      'Referred by Fold & Field. Small team, strong opinions on material and ink. Timezone means most feedback lands overnight.',
    artSeed: 'third-slope',
    since: d(-190),
  },
  {
    id: 'co_atrium',
    name: 'Atrium Works',
    industry: 'Architecture practice',
    website: 'atrium.works',
    location: 'Rotterdam, NL',
    size: '20–60 people',
    tags: ['tag_digital', 'tag_print', 'tag_brand'],
    notes:
      'Publishing their first monograph alongside the site relaunch. Everything is judged against the printed page first.',
    artSeed: 'atrium-works',
    since: d(-240),
  },
  {
    id: 'co_salttide',
    name: 'Salt & Tide',
    industry: 'Skincare',
    website: 'saltandtide.com',
    location: 'Lisbon, PT',
    size: '10–20 people',
    tags: ['tag_packaging', 'tag_campaign'],
    notes:
      'Launched the Ritual line with us in the spring. Quiet since — worth a check-in before their autumn planning.',
    artSeed: 'salt-and-tide',
    since: d(-520),
  },
]

/* ------------------------------------------------------------- contacts -- */

export const contacts: Contact[] = [
  {
    id: 'ct_karin',
    name: 'Karin Lindqvist',
    role: 'Brand Director',
    companyId: 'co_fold',
    email: 'karin@foldandfield.com',
    phone: '+45 32 14 88 02',
    avatar: portrait(1),
    tags: ['tag_brand', 'tag_priority'],
    location: 'Copenhagen',
    creativePrefs:
      'Prefers seeing two directions, never three. Hates anything that reads as "startup". Responds best to material samples over renders.',
    notes:
      'Signs off on everything. Books 30-minute slots and keeps to them — come with a decision to make, not an update.',
    lastTouchedAt: d(-2),
    favourite: true,
  },
  {
    id: 'ct_jonas',
    name: 'Jonas Bech',
    role: 'Head of Retail',
    companyId: 'co_fold',
    email: 'jonas@foldandfield.com',
    phone: '+45 32 14 88 19',
    avatar: portrait(51),
    tags: ['tag_retainer'],
    location: 'Copenhagen',
    creativePrefs: 'Practical. Wants to know how a thing gets built and what it costs to maintain.',
    notes: 'Owns the showroom rollout budget. Loops in Karin on anything customer-facing.',
    lastTouchedAt: d(-9),
    favourite: false,
  },
  {
    id: 'ct_rue',
    name: 'Rue Delacroix',
    role: 'Creative Director',
    companyId: 'co_marrow',
    email: 'rue@marrow.group',
    phone: '+1 312 555 0148',
    avatar: portrait(16),
    tags: ['tag_hospitality', 'tag_priority'],
    location: 'Chicago',
    creativePrefs:
      'Comes from editorial. Reads type first, everything else second. Will notice a bad kern from across the room.',
    notes:
      'Our strongest advocate inside Marrow. Prefers a phone call to a deck when something is going wrong.',
    lastTouchedAt: d(0),
    favourite: true,
  },
  {
    id: 'ct_theo',
    name: 'Theo Nakamura',
    role: 'Operations Lead',
    companyId: 'co_marrow',
    email: 'theo@marrow.group',
    phone: '+1 312 555 0192',
    avatar: portrait(11),
    tags: ['tag_print'],
    location: 'Chicago',
    creativePrefs: 'Cares about print runs, reorder cycles and what happens when a menu changes weekly.',
    notes: 'Gatekeeps the production budget and the printer relationship.',
    lastTouchedAt: d(-5),
    favourite: false,
  },
  {
    id: 'ct_wren',
    name: 'Wren Adeyemi',
    role: 'Chief Marketing Officer',
    companyId: 'co_northbound',
    email: 'wren@northboundsupply.co',
    phone: '+1 503 555 0117',
    avatar: portrait(20),
    tags: ['tag_campaign', 'tag_priority'],
    location: 'Portland',
    creativePrefs:
      'Wants the work to feel earned, not styled. Allergic to stock-looking imagery and drone shots for their own sake.',
    notes:
      'Joined 11 months ago with a mandate to rebuild the brand. Our sponsor — if she moves on, the retainer is at risk.',
    lastTouchedAt: d(-1),
    favourite: true,
  },
  {
    id: 'ct_pace',
    name: 'Pace Okafor',
    role: 'Senior Producer',
    companyId: 'co_northbound',
    email: 'pace@northboundsupply.co',
    phone: '+1 503 555 0163',
    avatar: portrait(52),
    tags: ['tag_motion'],
    location: 'Portland',
    creativePrefs: 'Schedule-first. Will trade an idea for a delivery date, every time.',
    notes: 'Runs the shoot logistics. Our day-to-day contact once a project is in production.',
    lastTouchedAt: d(-3),
    favourite: false,
  },
  {
    id: 'ct_mina',
    name: 'Mina Alvarez',
    role: 'Founder',
    companyId: 'co_thirdslope',
    email: 'mina@thirdslope.coffee',
    phone: '+61 3 9555 0184',
    avatar: portrait(31),
    tags: ['tag_packaging', 'tag_priority'],
    location: 'Melbourne',
    creativePrefs:
      'Obsessed with substrate. Wants uncoated stock, soy inks, and nothing that cannot be recycled kerbside.',
    notes:
      'Referred by Karin. Decides fast but changes her mind overnight — always confirm in writing the next morning.',
    lastTouchedAt: d(-4),
    favourite: false,
  },
  {
    id: 'ct_bo',
    name: 'Bo Tran',
    role: 'Head of Wholesale',
    companyId: 'co_thirdslope',
    email: 'bo@thirdslope.coffee',
    phone: '+61 3 9555 0190',
    avatar: portrait(56),
    tags: ['tag_packaging'],
    location: 'Melbourne',
    creativePrefs: 'Needs everything to survive a supermarket shelf at two metres.',
    notes: 'Brought in late on the packaging refresh — has opinions we did not brief for.',
    lastTouchedAt: d(-14),
    favourite: false,
  },
  {
    id: 'ct_elke',
    name: 'Elke Vandermeer',
    role: 'Partner',
    companyId: 'co_atrium',
    email: 'elke@atrium.works',
    phone: '+31 10 555 0121',
    avatar: portrait(24),
    tags: ['tag_digital', 'tag_print'],
    location: 'Rotterdam',
    creativePrefs:
      'Thinks in spreads. Judge every screen as though it were a printed page and she will be happy.',
    notes: 'Writes long, considered feedback. Give her 48 hours and it comes back excellent.',
    lastTouchedAt: d(-6),
    favourite: true,
  },
  {
    id: 'ct_sami',
    name: 'Sami Broek',
    role: 'Communications',
    companyId: 'co_atrium',
    email: 'sami@atrium.works',
    phone: '+31 10 555 0139',
    avatar: portrait(58),
    tags: ['tag_digital'],
    location: 'Rotterdam',
    creativePrefs: 'Keeps the tone plain and unglamorous. Cuts adjectives.',
    notes: 'Handles the day-to-day content and the monograph image licensing.',
    lastTouchedAt: d(-11),
    favourite: false,
  },
  {
    id: 'ct_lia',
    name: 'Lia Ferreira',
    role: 'Founder',
    companyId: 'co_salttide',
    email: 'lia@saltandtide.com',
    phone: '+351 21 555 0176',
    avatar: portrait(45),
    tags: ['tag_packaging'],
    location: 'Lisbon',
    creativePrefs: 'Restraint above all. If it needs explaining, it is not finished.',
    notes:
      'Ritual launched well. She hinted at a body-care extension for next spring — worth a call.',
    lastTouchedAt: d(-38),
    favourite: false,
  },
  {
    id: 'ct_gus',
    name: 'Gus Almeida',
    role: 'Head of Growth',
    companyId: 'co_salttide',
    email: 'gus@saltandtide.com',
    phone: '+351 21 555 0180',
    avatar: portrait(59),
    tags: ['tag_campaign', 'tag_new-business'],
    location: 'Lisbon',
    creativePrefs: 'Performance-minded. Wants variants and a reason for each one.',
    notes: 'New in role. Reached out about paid social creative for the autumn push.',
    lastTouchedAt: d(-7),
    favourite: false,
  },
]

/* --------------------------------------------------------- custom fields -- */

export const customFields: CustomField[] = [
  {
    id: 'cf_studio_rate',
    label: 'Rate card',
    type: 'select',
    entity: 'shoot',
    options: ['Standard', 'Retainer', 'Preferred', 'Pro bono'],
    required: false,
  },
  {
    id: 'cf_contract',
    label: 'Contract signed',
    type: 'checkbox',
    entity: 'shoot',
    required: true,
  },
  {
    id: 'cf_referral',
    label: 'Referred by',
    type: 'text',
    entity: 'company',
    required: false,
  },
  {
    id: 'cf_renewal',
    label: 'Renewal date',
    type: 'date',
    entity: 'company',
    required: false,
  },
  {
    id: 'cf_decision',
    label: 'Decision maker',
    type: 'checkbox',
    entity: 'contact',
    required: false,
  },
]

/* -------------------------------------------------------- notifications -- */

export const notifications: NotificationPrefs = {
  approvalRequests: true,
  taskAssignments: true,
  stageChanges: true,
  milestoneReminders: true,
  clientReplies: true,
  licenceExpiry: true,
  weeklyDigest: false,
  channel: 'both',
}
