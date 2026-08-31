import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Send, Wallet } from 'lucide-react'
import type { Invoice } from '@/data/types'
import { INVOICE_KINDS, INVOICE_STATUS } from '@/data/types'
import { useStore } from '@/store/useStore'
import { lineItemsTotal, useOutstandingInvoices } from '@/store/selectors'
import { cn, daysFromToday, formatCurrency, formatDate, sortBy, sum } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Button, Card, Pill, SegmentedControl } from '@/components/ui/primitives'
import { EmptyState, NoResults, toast } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/overlay'
import { SearchInput } from '@/components/ui/form'
import { DocumentProof } from './DocumentProof'

/* ============================================================================
   BILLING

   Every invoice the studio has raised, and the document itself alongside it.
   The list answers "who owes me money"; the proof answers "what exactly did I
   send them" — which is the question you actually need answered when a client
   rings up about it.
   ========================================================================== */

type Filter = 'all' | 'outstanding' | 'draft' | 'paid'

export default function BillingPage() {
  const [params, setParams] = useSearchParams()
  const invoices = useStore((s) => s.invoices)
  const shoots = useStore((s) => s.shoots)
  const outstanding = useOutstandingInvoices()

  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const selectedId = params.get('invoice')
  const selected = invoices.find((inv) => inv.id === selectedId)

  function select(id: string | null) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (id) next.set('invoice', id)
      else next.delete('invoice')
      return next
    })
  }

  // Land on something rather than an empty panel.
  useEffect(() => {
    if (!selectedId && invoices.length > 0) select(sortBy(invoices, (i) => i.issuedAt ?? i.createdAt, -1)[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices.length])

  const shootName = (id: string) => shoots.find((s) => s.id === id)?.name ?? 'No shoot'

  const rows = useMemo(() => {
    const list = invoices.filter((invoice) => {
      if (filter === 'outstanding' && invoice.status !== 'sent') return false
      if (filter === 'draft' && invoice.status !== 'draft') return false
      if (filter === 'paid' && invoice.status !== 'paid') return false
      if (query) {
        const haystack = `${invoice.number} ${shootName(invoice.shootId)}`.toLowerCase()
        if (!haystack.includes(query.toLowerCase())) return false
      }
      return true
    })
    return sortBy(list, (i) => i.issuedAt ?? i.createdAt, -1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, shoots, filter, query])

  const owed = sum(outstanding.map((i) => lineItemsTotal(i.lineItems)))
  const overdue = outstanding.filter((i) => i.dueAt && daysFromToday(i.dueAt) < 0)
  const overdueValue = sum(overdue.map((i) => lineItemsTotal(i.lineItems)))

  if (invoices.length === 0) {
    return (
      <div className="animate-in">
        <PageHeader title="Billing" description="Deposits, balances and what is still owed." />
        <EmptyState
          icon={<FileText size={24} />}
          title="No invoices yet"
          body="Open a shoot, build up its line items, then raise a deposit or a full invoice from there. The document is generated here."
          size="lg"
        />
      </div>
    )
  }

  return (
    <div className="animate-in">
      <PageHeader
        title="Billing"
        description="Deposits, balances and what is still owed."
        meta={
          <>
            <Pill tone={overdue.length > 0 ? 'critical' : 'neutral'} icon={<Wallet size={12} />}>
              {formatCurrency(owed, { compact: true })} outstanding
            </Pill>
            {overdue.length > 0 && (
              <Pill tone="critical">
                {formatCurrency(overdueValue, { compact: true })} overdue
              </Pill>
            )}
          </>
        }
        actions={
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            label="Filter invoices"
            segments={[
              { value: 'all', label: 'All' },
              { value: 'outstanding', label: 'Outstanding' },
              { value: 'draft', label: 'Drafts' },
              { value: 'paid', label: 'Paid' },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search invoices"
            label="Search invoices"
          />

          {rows.length === 0 ? (
            <NoResults onClear={() => { setQuery(''); setFilter('all') }} />
          ) : (
            <ul className="flex flex-col gap-2">
              {rows.map((invoice) => (
                <li key={invoice.id}>
                  <InvoiceRow
                    invoice={invoice}
                    shoot={shootName(invoice.shootId)}
                    selected={invoice.id === selectedId}
                    onSelect={() => select(invoice.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {selected ? (
            <InvoicePanel invoice={selected} />
          ) : (
            <EmptyState title="Pick an invoice" body="Its document appears here." />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ row -- */

function InvoiceRow({
  invoice,
  shoot,
  selected,
  onSelect,
}: {
  invoice: Invoice
  shoot: string
  selected: boolean
  onSelect: () => void
}) {
  const total = lineItemsTotal(invoice.lineItems)
  const days = invoice.dueAt ? daysFromToday(invoice.dueAt) : undefined
  const late = invoice.status === 'sent' && days !== undefined && days < 0
  const meta = INVOICE_STATUS[invoice.status]

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'w-full rounded-2xl border p-3.5 text-left transition-colors duration-base',
        selected
          ? 'border-ink bg-surface-raised'
          : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="tabular text-base font-medium">{invoice.number}</span>
        <span className="tabular text-base">{formatCurrency(total, { compact: true })}</span>
      </div>
      <p className="mt-0.5 truncate text-sm text-ink-muted">{shoot}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tone={late ? 'critical' : (meta.tone as never)} size="sm">
          {late ? `${Math.abs(days!)}d overdue` : meta.label}
        </Pill>
        <Pill tone="neutral" size="sm">
          {INVOICE_KINDS[invoice.kind]}
        </Pill>
      </div>
    </button>
  )
}

/* ---------------------------------------------------------------- panel -- */

function InvoicePanel({ invoice }: { invoice: Invoice }) {
  const updateInvoice = useStore((s) => s.updateInvoice)
  const markInvoicePaid = useStore((s) => s.markInvoicePaid)
  const deleteInvoice = useStore((s) => s.deleteInvoice)
  const shoot = useStore((s) => s.shoots.find((p) => p.id === invoice.shootId))
  const contact = useStore((s) => s.contacts.find((c) => c.id === shoot?.contactId))
  const company = useStore((s) => s.companies.find((c) => c.id === shoot?.companyId))
  const workspace = useStore((s) => s.settings.workspace)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const total = lineItemsTotal(invoice.lineItems)

  return (
    <div className="flex flex-col gap-4">
      <Card variant="surface" padding="md" radius="2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">
              {INVOICE_KINDS[invoice.kind]} · {company?.name ?? 'No client'}
            </p>
            <h2 className="tabular mt-1 text-2xl font-medium">{invoice.number}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {shoot?.name}
              {invoice.issuedAt && ` · issued ${formatDate(invoice.issuedAt, 'short')}`}
              {invoice.dueAt && ` · due ${formatDate(invoice.dueAt, 'short')}`}
              {invoice.paidAt && ` · paid ${formatDate(invoice.paidAt, 'short')}`}
            </p>
          </div>
          <p className="tabular text-2xl font-medium">{formatCurrency(total)}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {invoice.status === 'draft' && (
            <Button
              variant="primary"
              icon={<Send size={15} />}
              onClick={() => {
                updateInvoice(invoice.id, { status: 'sent' })
                toast.success(`Invoice ${invoice.number} marked as sent`, {
                  detail: 'Download the PDF and send it from your own email.',
                })
              }}
            >
              Mark as sent
            </Button>
          )}
          {invoice.status === 'sent' && (
            <Button
              variant="primary"
              icon={<Wallet size={15} />}
              onClick={() => {
                markInvoicePaid(invoice.id)
                toast.success(`Invoice ${invoice.number} marked paid`)
              }}
            >
              Mark as paid
            </Button>
          )}
          {invoice.status !== 'void' && (
            <Button
              onClick={() => {
                updateInvoice(invoice.id, { status: 'void' })
                toast.warning(`Invoice ${invoice.number} voided`, {
                  action: {
                    label: 'Undo',
                    onClick: () => updateInvoice(invoice.id, { status: 'draft' }),
                  },
                })
              }}
            >
              Void
            </Button>
          )}
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </Card>

      <DocumentProof
        request={{
          kind: 'invoice',
          paper: invoice.paper,
          number: invoice.number,
          date: invoice.issuedAt ?? invoice.createdAt,
          items: invoice.lineItems,
          notes: invoice.notes,
          signoff: invoice.signoff,
          billing: workspace.billing,
          currency: workspace.currency,
          contact,
          company,
        }}
        onPaperChange={(paper) => updateInvoice(invoice.id, { paper })}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteInvoice(invoice.id)
          setConfirmDelete(false)
          toast.success('Invoice deleted')
        }}
        title={`Delete invoice ${invoice.number}?`}
        body="The document and its record of what was billed both go. This cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </div>
  )
}

