// Shared CMS types and helpers

export type ViewKey =
  | 'dashboard'
  | 'members'
  | 'resources'
  | 'projects'
  | 'finance'
  | 'evaluation'
  | 'ai'
  | 'communication'
  | 'audit'

export const NAV_ITEMS: { key: ViewKey; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Overview & analytics' },
  { key: 'members', label: 'Members', description: 'Community registry' },
  { key: 'resources', label: 'Resources', description: 'Inventory & approvals' },
  { key: 'projects', label: 'Projects', description: 'Initiatives & milestones' },
  { key: 'finance', label: 'Finance', description: 'Income & expenses' },
  { key: 'evaluation', label: 'M&E', description: 'Monitoring & evaluation' },
  { key: 'ai', label: 'AI Insights', description: 'Smart recommendations' },
  { key: 'communication', label: 'Communication', description: 'Announcements' },
  { key: 'audit', label: 'Audit Log', description: 'Security & activity' },
]

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en').format(n)
}

export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatRelative(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(date)
}

export function classNames(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(' ')
}

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  delayed: 'bg-red-100 text-red-700 border-red-200',
  planning: 'bg-amber-100 text-amber-700 border-amber-200',
  on_hold: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  distributed: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  addressed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-cyan-500',
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'System Administrator',
  leader: 'Community Leader',
  project_manager: 'Project Manager',
  finance: 'Finance Officer',
  volunteer: 'Volunteer',
  member: 'Community Member',
}
