import { Component, Suspense, lazy, type ReactNode } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { Button, ButtonLink, Skeleton } from '@/components/ui/primitives'
import { ErrorState } from '@/components/ui/feedback'

/* Route-level code splitting keeps the first paint fast. */
const Dashboard = lazy(() => import('@/features/dashboard/DashboardPage'))
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'))
const ProjectDetail = lazy(() => import('@/features/projects/ProjectDetail'))
const MoodboardIndex = lazy(() => import('@/features/moodboard/MoodboardIndex'))
const ContactsPage = lazy(() => import('@/features/contacts/ContactsPage'))
const ContactDetail = lazy(() => import('@/features/contacts/ContactDetail'))
const CompanyDetail = lazy(() => import('@/features/contacts/CompanyDetail'))
const DealsPage = lazy(() => import('@/features/deals/DealsPage'))
const DealDetail = lazy(() => import('@/features/deals/DealDetail'))
const TasksPage = lazy(() => import('@/features/tasks/TasksPage'))
const ActivityPage = lazy(() => import('@/features/activity/ActivityPage'))
const ApprovalsPage = lazy(() => import('@/features/approvals/ApprovalsPage'))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

export default function App() {
  return (
    <AppShell>
      <ErrorBoundary>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/moodboards" element={<MoodboardIndex />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/companies" element={<ContactsPage />} />
            <Route path="/companies/:id" element={<CompanyDetail />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/deals/:id" element={<DealDetail />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  )
}

/** Shown while a route chunk loads — mirrors the shape of a typical page. */
function RouteSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-title font-medium tracking-title">This page does not exist</h1>
      <p className="mt-2 text-body text-ink-muted">
        The link may be stale, or the record may have been deleted.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <ButtonLink to="/" variant="primary">
          Back to Today
        </ButtonLink>
        <ButtonLink to="/projects">Browse projects</ButtonLink>
      </div>
    </div>
  )
}

/** Catches render errors so one bad record cannot blank the whole workspace. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="py-16">
          <ErrorState
            title="This view could not be rendered"
            body={this.state.error.message}
            onRetry={() => this.setState({ error: undefined })}
          />
          <div className="mt-4 flex justify-center">
            <Link to="/">
              <Button variant="ghost">Back to Today</Button>
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
