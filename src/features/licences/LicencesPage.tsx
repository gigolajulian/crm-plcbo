import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { AlertTriangle, Scale } from 'lucide-react'
import type { License } from '@/data/types'
import { LICENSE_STATUS } from '@/data/types'
import { useStore } from '@/store/useStore'
import { useExpiringLicenses } from '@/store/selectors'
import { cn, daysFromToday, formatCurrency, formatDate, sortBy, sum } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Button, Card, Pill, SegmentedControl } from '@/components/ui/primitives'
import { EmptyState, NoResults, toast } from '@/components/ui/feedback'
import { LinkedRecord } from '@/components/common/records'

/* ============================================================================
   LICENCES

   Rights sold, and — the part that matters — when they run out. A licence that
   lapses unnoticed is revenue that walked away without anyone deciding to let
   it go, so the default view is what expires soonest.
   ========================================================================== */

type Filter = 'watch' | 'active' | 'all'

/** Long enough for a renewal to be a conversation rather than a scramble. */
const WINDOW_DAYS = 60

export default function LicencesPage() {
  const [params, setParams] = useSearchParams()
  const licenses = useStore((s) => s.licenses)
  const shoots = useStore((s) => s.shoots)
  const expiring = useExpiringLicenses(WINDOW_DAYS)
  const [filter, setFilter] = useState<Filter>('watch')

  const highlighted = params.get('licence')

  const rows = useMemo(() => {
    const list = licenses.filter((license) => {
      const days = daysFromToday(license.endDate)
      if (filter === 'watch') return days <= WINDOW_DAYS && license.status !== 'renewed'
      if (filter === 'active') return license.status === 'active' || license.status === 'expiring'
      return true
    })
    return sortBy(list, (license) => license.endDate)
  }, [licenses, filter])

  const atRisk = expiring.filter((row) => row.daysLeft >= 0)
  const renewalValue = sum(atRisk.map((row) => row.license.fee))

  if (licenses.length === 0) {
    return (
      <div className="animate-in">
        <PageHeader title="Licences" description="What you have sold, and when it runs out." />
        <EmptyState
          icon={<Scale size={24} />}
          title="No licences recorded"
          body="Add one from a delivered shoot. Once a licence has an end date, CRMO starts watching it and tells you sixty days before it lapses."
          size="lg"
        />
      </div>
    )
  }

  return (
    <div className="animate-in">
      <PageHeader
        title="Licences"
        description="What you have sold, and when it runs out."
        meta={
          <>
            <Pill
              tone={atRisk.length > 0 ? 'caution' : 'neutral'}
              icon={<AlertTriangle size={12} />}
            >
              {atRisk.length} inside {WINDOW_DAYS} days
            </Pill>
            {renewalValue > 0 && (
              <Pill tone="lime">
                {formatCurrency(renewalValue, { compact: true })} up for renewal
              </Pill>
            )}
          </>
        }
        actions={
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            label="Filter licences"
            segments={[
              { value: 'watch', label: 'Expiring' },
              { value: 'active', label: 'Active' },
              { value: 'all', label: 'All' },
            ]}
          />
        }
      />

      {rows.length === 0 ? (
        <NoResults entity="licences" onClear={() => setFilter('all')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((license) => (
            <li key={license.id}>
              <LicenceCard
                license={license}
                shootName={shoots.find((s) => s.id === license.shootId)?.name}
                highlighted={license.id === highlighted}
                onDismissHighlight={() =>
                  setParams((current) => {
                    const next = new URLSearchParams(current)
                    next.delete('licence')
                    return next
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- card -- */

function LicenceCard({
  license,
  shootName,
  highlighted,
  onDismissHighlight,
}: {
  license: License
  shootName?: string
  highlighted: boolean
  onDismissHighlight: () => void
}) {
  const updateLicense = useStore((s) => s.updateLicense)
  const days = daysFromToday(license.endDate)
  const meta = LICENSE_STATUS[license.status]
  const urgent = days >= 0 && days <= WINDOW_DAYS
  const lapsed = days < 0 && license.status !== 'renewed'

  return (
    <Card
      variant={highlighted ? 'raised' : 'surface'}
      padding="md"
      radius="2xl"
      className={cn(
        'transition-shadow duration-base',
        highlighted && 'ring-2 ring-ink',
        lapsed && 'border-critical',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={lapsed ? 'critical' : urgent ? 'caution' : (meta.tone as never)} size="sm">
              {lapsed
                ? `Lapsed ${Math.abs(days)}d ago`
                : days === 0
                  ? 'Ends today'
                  : days > 3650
                    ? 'No expiry'
                    : `${days}d left`}
            </Pill>
            {license.exclusive && (
              <Pill tone="lime" size="sm">
                Exclusive
              </Pill>
            )}
            <Pill tone="neutral" size="sm">
              {license.territory || 'Territory not set'}
            </Pill>
          </div>

          <h2 className="mt-2 text-lg font-medium">
            {license.shootId ? (
              <Link to={`/shoots/${license.shootId}`} className="hover:underline">
                {license.name}
              </Link>
            ) : (
              license.name
            )}
          </h2>

          {license.scope && (
            <p className="mt-1 text-sm text-pretty text-ink-muted">{license.scope}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-faint">
            <span>
              {formatDate(license.startDate, 'short')} →{' '}
              {days > 3650 ? 'no end date' : formatDate(license.endDate, 'short')}
            </span>
            {shootName && <LinkedRecord kind="company" id={license.companyId} size="sm" />}
            {license.media.length > 0 && <span>{license.media.join(' · ')}</span>}
          </div>

          {license.notes && (
            <p className="mt-3 rounded-xl bg-canvas-sunk p-3 text-sm text-pretty text-ink-muted">
              {license.notes}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="tabular text-xl font-medium">{formatCurrency(license.fee)}</p>
          {(urgent || lapsed) && license.status !== 'renewed' && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  // A renewal is a new term, so the old record is closed off
                  // rather than edited — the history of what was sold matters.
                  updateLicense(license.id, { status: 'renewed' })
                  onDismissHighlight()
                  toast.success('Marked as renewed', {
                    detail: 'Add the new term as a fresh licence on the shoot.',
                    action: {
                      label: 'Undo',
                      onClick: () => updateLicense(license.id, { status: 'active' }),
                    },
                  })
                }}
              >
                Renewed
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  updateLicense(license.id, { status: 'lapsed' })
                  toast.warning('Marked as lapsed', {
                    action: {
                      label: 'Undo',
                      onClick: () => updateLicense(license.id, { status: 'active' }),
                    },
                  })
                }}
              >
                Let it lapse
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
