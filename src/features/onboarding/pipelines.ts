import type { PipelineStage } from '@/data/types'

/**
 * Pipeline templates offered at setup.
 *
 * Every template ends in a won and a lost stage — the reports depend on knowing
 * which stages close a deal, so those two are not optional. Stages can be
 * renamed, reordered and added to afterwards in Settings.
 */
export interface PipelineTemplate {
  id: string
  label: string
  hint: string
  /** Open stages only; won and lost are appended automatically. */
  stages: Array<{ name: string; probability: number }>
}

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'studio',
    label: 'Studio',
    hint: 'The usual five. A good default if you are not sure.',
    stages: [
      { name: 'Lead', probability: 10 },
      { name: 'Qualified', probability: 25 },
      { name: 'Proposal sent', probability: 50 },
      { name: 'Negotiation', probability: 75 },
    ],
  },
  {
    id: 'simple',
    label: 'Simple',
    hint: 'Three steps. For studios that decide fast.',
    stages: [
      { name: 'Enquiry', probability: 15 },
      { name: 'Talking', probability: 40 },
      { name: 'Proposal', probability: 70 },
    ],
  },
  {
    id: 'agency',
    label: 'Agency',
    hint: 'Longer sales cycle, with scoping and contracting split out.',
    stages: [
      { name: 'Enquiry', probability: 10 },
      { name: 'Discovery call', probability: 20 },
      { name: 'Scoping', probability: 35 },
      { name: 'Proposal', probability: 55 },
      { name: 'Negotiation', probability: 75 },
      { name: 'Contract out', probability: 90 },
    ],
  },
]

/** Expand a template (with any renamed stages) into real pipeline records. */
export function buildPipeline(stages: Array<{ name: string; probability: number }>): PipelineStage[] {
  const open: PipelineStage[] = stages
    .filter((stage) => stage.name.trim().length > 0)
    .map((stage, index) => ({
      id: `ps_${slug(stage.name)}_${index}`,
      name: stage.name.trim(),
      order: index,
      probability: stage.probability,
      kind: 'production' as const,
    }))

  return [
    ...open,
    { id: 'ps_won', name: 'Won', order: open.length, probability: 100, kind: 'won' },
    { id: 'ps_lost', name: 'Lost', order: open.length + 1, probability: 0, kind: 'lost' },
  ]
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 12) || 'stage'
  )
}

/** The services a studio sells, offered as starting tags. */
export const SERVICE_TAGS = [
  'Brand',
  'Campaign',
  'Packaging',
  'Digital',
  'Motion',
  'Print',
  'Editorial',
  'Photography',
  'Strategy',
  'Environment',
  'Product',
  'Retainer',
]
