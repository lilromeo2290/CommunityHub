// Clear ALL data from the database, then re-seed default categories
// so dropdowns still work. Run with: bun run scripts/clear-data.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Clearing ALL data from database...')

  // Delete in dependency order (children first, parents last)
  const deletes = [
    ['AuditLog', () => db.auditLog.deleteMany()],
    ['Alert', () => db.alert.deleteMany()],
    ['Announcement', () => db.announcement.deleteMany()],
    ['Feedback', () => db.feedback.deleteMany()],
    ['Contribution', () => db.contribution.deleteMany()],
    ['Transaction', () => db.transaction.deleteMany()],
    ['Milestone', () => db.milestone.deleteMany()],
    ['ResourceAllocation', () => db.resourceAllocation.deleteMany()],
    ['Project', () => db.project.deleteMany()],
    ['Resource', () => db.resource.deleteMany()],
    ['Member', () => db.member.deleteMany()],
    ['User', () => db.user.deleteMany()],
    ['Category', () => db.category.deleteMany()],
  ] as const

  for (const [name, fn] of deletes) {
    const result = await fn()
    console.log(`  ✓ ${name}: ${result.count} records deleted`)
  }

  console.log('\nRe-seeding default categories so dropdowns still work...')

  const defaults: Array<{ type: string; value: string; label: string; color: string; sortOrder: number }> = [
    { type: 'member', value: 'leader', label: 'Leader', color: 'emerald', sortOrder: 1 },
    { type: 'member', value: 'volunteer', label: 'Volunteer', color: 'cyan', sortOrder: 2 },
    { type: 'member', value: 'family', label: 'Family', color: 'violet', sortOrder: 3 },
    { type: 'member', value: 'youth', label: 'Youth', color: 'amber', sortOrder: 4 },
    { type: 'member', value: 'elder', label: 'Elder', color: 'rose', sortOrder: 5 },
    { type: 'member', value: 'general', label: 'General', color: 'gray', sortOrder: 6 },
    { type: 'resource', value: 'fund', label: 'Fund', color: 'emerald', sortOrder: 1 },
    { type: 'resource', value: 'food', label: 'Food', color: 'amber', sortOrder: 2 },
    { type: 'resource', value: 'medicine', label: 'Medicine', color: 'rose', sortOrder: 3 },
    { type: 'resource', value: 'equipment', label: 'Equipment', color: 'cyan', sortOrder: 4 },
    { type: 'resource', value: 'material', label: 'Material', color: 'violet', sortOrder: 5 },
    { type: 'resource', value: 'human', label: 'Human Resource', color: 'teal', sortOrder: 6 },
    { type: 'project', value: 'infrastructure', label: 'Infrastructure', color: 'emerald', sortOrder: 1 },
    { type: 'project', value: 'health', label: 'Health', color: 'rose', sortOrder: 2 },
    { type: 'project', value: 'education', label: 'Education', color: 'amber', sortOrder: 3 },
    { type: 'project', value: 'environment', label: 'Environment', color: 'teal', sortOrder: 4 },
    { type: 'project', value: 'social', label: 'Social', color: 'violet', sortOrder: 5 },
    { type: 'project', value: 'economic', label: 'Economic', color: 'cyan', sortOrder: 6 },
    { type: 'announcement', value: 'general', label: 'General', color: 'gray', sortOrder: 1 },
    { type: 'announcement', value: 'urgent', label: 'Urgent', color: 'red', sortOrder: 2 },
    { type: 'announcement', value: 'event', label: 'Event', color: 'violet', sortOrder: 3 },
    { type: 'announcement', value: 'meeting', label: 'Meeting', color: 'cyan', sortOrder: 4 },
    { type: 'feedback', value: 'general', label: 'General', color: 'gray', sortOrder: 1 },
    { type: 'feedback', value: 'project', label: 'Project', color: 'emerald', sortOrder: 2 },
    { type: 'feedback', value: 'resource', label: 'Resource', color: 'amber', sortOrder: 3 },
    { type: 'feedback', value: 'leadership', label: 'Leadership', color: 'violet', sortOrder: 4 },
    { type: 'transaction_type', value: 'income', label: 'Income', color: 'emerald', sortOrder: 1 },
    { type: 'transaction_type', value: 'donation', label: 'Donation', color: 'rose', sortOrder: 2 },
    { type: 'transaction_type', value: 'grant', label: 'Grant', color: 'violet', sortOrder: 3 },
    { type: 'transaction_type', value: 'expense', label: 'Expense', color: 'red', sortOrder: 4 },
  ]
  for (const c of defaults) {
    await db.category.create({ data: { ...c, isSystem: true } })
  }
  console.log(`  ✓ Re-seeded ${defaults.length} default categories`)

  // Verify state
  const counts = {
    users: await db.user.count(),
    members: await db.member.count(),
    resources: await db.resource.count(),
    projects: await db.project.count(),
    transactions: await db.transaction.count(),
    allocations: await db.resourceAllocation.count(),
    announcements: await db.announcement.count(),
    alerts: await db.alert.count(),
    feedback: await db.feedback.count(),
    contributions: await db.contribution.count(),
    auditLogs: await db.auditLog.count(),
    categories: await db.category.count(),
  }

  console.log('\nFinal database state:')
  Object.entries(counts).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(15)} ${v}`)
  })

  console.log('\n✓ Database cleared. Default categories preserved so dropdowns still work.')
  console.log('  To restore demo data, run: bun run scripts/seed.ts')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
