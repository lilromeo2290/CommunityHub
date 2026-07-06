// Seed ONLY default categories — does NOT wipe existing data
// Safe to run multiple times. Run with: bun run scripts/seed-categories.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding default categories (idempotent)...')

  const defaults: Array<{ type: string; value: string; label: string; color: string; sortOrder: number }> = [
    // Member categories
    { type: 'member', value: 'leader', label: 'Leader', color: 'emerald', sortOrder: 1 },
    { type: 'member', value: 'volunteer', label: 'Volunteer', color: 'cyan', sortOrder: 2 },
    { type: 'member', value: 'family', label: 'Family', color: 'violet', sortOrder: 3 },
    { type: 'member', value: 'youth', label: 'Youth', color: 'amber', sortOrder: 4 },
    { type: 'member', value: 'elder', label: 'Elder', color: 'rose', sortOrder: 5 },
    { type: 'member', value: 'general', label: 'General', color: 'gray', sortOrder: 6 },
    // Resource categories
    { type: 'resource', value: 'fund', label: 'Fund', color: 'emerald', sortOrder: 1 },
    { type: 'resource', value: 'food', label: 'Food', color: 'amber', sortOrder: 2 },
    { type: 'resource', value: 'medicine', label: 'Medicine', color: 'rose', sortOrder: 3 },
    { type: 'resource', value: 'equipment', label: 'Equipment', color: 'cyan', sortOrder: 4 },
    { type: 'resource', value: 'material', label: 'Material', color: 'violet', sortOrder: 5 },
    { type: 'resource', value: 'human', label: 'Human Resource', color: 'teal', sortOrder: 6 },
    // Project categories
    { type: 'project', value: 'infrastructure', label: 'Infrastructure', color: 'emerald', sortOrder: 1 },
    { type: 'project', value: 'health', label: 'Health', color: 'rose', sortOrder: 2 },
    { type: 'project', value: 'education', label: 'Education', color: 'amber', sortOrder: 3 },
    { type: 'project', value: 'environment', label: 'Environment', color: 'teal', sortOrder: 4 },
    { type: 'project', value: 'social', label: 'Social', color: 'violet', sortOrder: 5 },
    { type: 'project', value: 'economic', label: 'Economic', color: 'cyan', sortOrder: 6 },
    // Announcement categories
    { type: 'announcement', value: 'general', label: 'General', color: 'gray', sortOrder: 1 },
    { type: 'announcement', value: 'urgent', label: 'Urgent', color: 'red', sortOrder: 2 },
    { type: 'announcement', value: 'event', label: 'Event', color: 'violet', sortOrder: 3 },
    { type: 'announcement', value: 'meeting', label: 'Meeting', color: 'cyan', sortOrder: 4 },
    // Feedback categories
    { type: 'feedback', value: 'general', label: 'General', color: 'gray', sortOrder: 1 },
    { type: 'feedback', value: 'project', label: 'Project', color: 'emerald', sortOrder: 2 },
    { type: 'feedback', value: 'resource', label: 'Resource', color: 'amber', sortOrder: 3 },
    { type: 'feedback', value: 'leadership', label: 'Leadership', color: 'violet', sortOrder: 4 },
    // Transaction types
    { type: 'transaction_type', value: 'income', label: 'Income', color: 'emerald', sortOrder: 1 },
    { type: 'transaction_type', value: 'donation', label: 'Donation', color: 'rose', sortOrder: 2 },
    { type: 'transaction_type', value: 'grant', label: 'Grant', color: 'violet', sortOrder: 3 },
    { type: 'transaction_type', value: 'expense', label: 'Expense', color: 'red', sortOrder: 4 },
  ]

  let created = 0
  let skipped = 0
  for (const c of defaults) {
    const existing = await db.category.findUnique({
      where: { type_value: { type: c.type, value: c.value } },
    })
    if (existing) {
      skipped++
      continue
    }
    await db.category.create({ data: { ...c, isSystem: true } })
    created++
  }

  console.log(`Done. Created ${created} new categories, skipped ${skipped} existing.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
