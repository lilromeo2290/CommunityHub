// Seed script for Community Management System
// Run with: bun run scripts/seed.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Clearing existing data...')
  await db.auditLog.deleteMany()
  await db.alert.deleteMany()
  await db.announcement.deleteMany()
  await db.feedback.deleteMany()
  await db.contribution.deleteMany()
  await db.transaction.deleteMany()
  await db.milestone.deleteMany()
  await db.resourceAllocation.deleteMany()
  await db.project.deleteMany()
  await db.resource.deleteMany()
  await db.member.deleteMany()
  await db.user.deleteMany()
  await db.category.deleteMany()

  console.log('Seeding database...')

  // ---- Categories ----
  const categorySeeds: Array<{ type: string; value: string; label: string; color: string; sortOrder: number }> = [
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
  for (const c of categorySeeds) {
    await db.category.create({ data: { ...c, isSystem: true } })
  }
  console.log(`Created ${categorySeeds.length} categories`)

  // ---- Users ----
  const users = [
    { email: 'admin@cms.org', name: 'Amara Okonkwo', role: 'admin', avatar: 'AO' },
    { email: 'leader@cms.org', name: 'David Mwangi', role: 'leader', avatar: 'DM' },
    { email: 'pm@cms.org', name: 'Sarah Chen', role: 'project_manager', avatar: 'SC' },
    { email: 'finance@cms.org', name: 'Robert Kamau', role: 'finance', avatar: 'RK' },
    { email: 'volunteer@cms.org', name: 'Maria Santos', role: 'volunteer', avatar: 'MS' },
    { email: 'member1@cms.org', name: 'James Patel', role: 'member', avatar: 'JP' },
    { email: 'member2@cms.org', name: 'Fatima Hassan', role: 'member', avatar: 'FH' },
    { email: 'member3@cms.org', name: 'Li Wei', role: 'member', avatar: 'LW' },
    { email: 'member4@cms.org', name: 'Grace Adeyemi', role: 'member', avatar: 'GA' },
    { email: 'member5@cms.org', name: 'Daniel Okafor', role: 'member', avatar: 'DO' },
    { email: 'member6@cms.org', name: 'Esther Wambui', role: 'member', avatar: 'EW' },
    { email: 'member7@cms.org', name: 'Peter Njoroge', role: 'member', avatar: 'PN' },
    { email: 'member8@cms.org', name: 'Aisha Mohammed', role: 'member', avatar: 'AM' },
    { email: 'member9@cms.org', name: 'Joseph Mutua', role: 'member', avatar: 'JM' },
    { email: 'member10@cms.org', name: 'Lucy Wanjiru', role: 'member', avatar: 'LW' },
  ]
  const createdUsers = []
  for (const u of users) {
    const user = await db.user.create({ data: u })
    createdUsers.push(user)
  }
  console.log(`Created ${createdUsers.length} users`)

  // ---- Members ----
  const memberProfiles = [
    { fullName: 'Amara Okonkwo', gender: 'female', age: 42, phone: '+254700100100', address: 'Kibera, Nairobi', category: 'leader', skills: 'management,finance', needs: '', householdSize: 5, status: 'active' },
    { fullName: 'David Mwangi', gender: 'male', age: 51, phone: '+254700100101', address: 'Kibera, Nairobi', category: 'leader', skills: 'community_organizing', needs: '', householdSize: 6, status: 'active' },
    { fullName: 'Sarah Chen', gender: 'female', age: 34, phone: '+254700100102', address: 'Westlands, Nairobi', category: 'volunteer', skills: 'project_management,engineering', needs: '', householdSize: 2, status: 'active' },
    { fullName: 'Robert Kamau', gender: 'male', age: 38, phone: '+254700100103', address: 'Lavington, Nairobi', category: 'volunteer', skills: 'accounting', needs: '', householdSize: 3, status: 'active' },
    { fullName: 'Maria Santos', gender: 'female', age: 28, phone: '+254700100104', address: 'Karen, Nairobi', category: 'volunteer', skills: 'teaching,healthcare', needs: '', householdSize: 1, status: 'active' },
    { fullName: 'James Patel', gender: 'male', age: 45, phone: '+254700100105', address: 'Kibera, Nairobi', category: 'family', skills: 'carpentry', needs: 'clean_water,education', householdSize: 7, status: 'active' },
    { fullName: 'Fatima Hassan', gender: 'female', age: 33, phone: '+254700100106', address: 'Kibera, Nairobi', category: 'family', skills: 'tailoring,cooking', needs: 'healthcare', householdSize: 5, status: 'active' },
    { fullName: 'Li Wei', gender: 'male', age: 27, phone: '+254700100107', address: 'Kibera, Nairobi', category: 'youth', skills: 'it,tutoring', needs: 'employment', householdSize: 1, status: 'active' },
    { fullName: 'Grace Adeyemi', gender: 'female', age: 68, phone: '+254700100108', address: 'Kibera, Nairobi', category: 'elder', skills: '', needs: 'healthcare,food', householdSize: 2, status: 'active' },
    { fullName: 'Daniel Okafor', gender: 'male', age: 19, phone: '+254700100109', address: 'Kibera, Nairobi', category: 'youth', skills: 'sports,music', needs: 'education,scholarship', householdSize: 4, status: 'active' },
    { fullName: 'Esther Wambui', gender: 'female', age: 29, phone: '+254700100110', address: 'Kibera, Nairobi', category: 'family', skills: 'nursing', needs: 'childcare', householdSize: 4, status: 'active' },
    { fullName: 'Peter Njoroge', gender: 'male', age: 56, phone: '+254700100111', address: 'Kibera, Nairobi', category: 'elder', skills: 'farming', needs: 'medical_supplies', householdSize: 3, status: 'active' },
    { fullName: 'Aisha Mohammed', gender: 'female', age: 41, phone: '+254700100112', address: 'Kibera, Nairobi', category: 'family', skills: 'small_business', needs: 'microfinance', householdSize: 6, status: 'active' },
    { fullName: 'Joseph Mutua', gender: 'male', age: 36, phone: '+254700100113', address: 'Kibera, Nairobi', category: 'family', skills: 'masonry,electrical', needs: 'housing', householdSize: 5, status: 'active' },
    { fullName: 'Lucy Wanjiru', gender: 'female', age: 23, phone: '+254700100114', address: 'Kibera, Nairobi', category: 'youth', skills: 'graphic_design', needs: 'employment,internet', householdSize: 2, status: 'active' },
  ]

  for (let i = 0; i < memberProfiles.length; i++) {
    const p = memberProfiles[i]
    const userId = i < createdUsers.length ? createdUsers[i].id : createdUsers[0].id
    await db.member.create({
      data: { ...p, userId },
    })
  }
  console.log(`Created ${memberProfiles.length} members`)

  // ---- Resources ----
  const resources = [
    { name: 'General Funds', category: 'fund', unit: 'KES', quantity: 485000, reserved: 75000, threshold: 100000, description: 'Unrestricted cash for community operations' },
    { name: 'Maize Flour', category: 'food', unit: 'bags (90kg)', quantity: 42, reserved: 8, threshold: 20, location: 'Warehouse A' },
    { name: 'Rice', category: 'food', unit: 'bags (50kg)', quantity: 18, reserved: 4, threshold: 15, location: 'Warehouse A' },
    { name: 'Cooking Oil', category: 'food', unit: 'litres', quantity: 65, reserved: 10, threshold: 30, location: 'Warehouse A' },
    { name: 'Water Filters', category: 'equipment', unit: 'units', quantity: 12, reserved: 0, threshold: 20, location: 'Storage B', description: 'Household water purification filters' },
    { name: 'Medical Kits', category: 'medicine', unit: 'kits', quantity: 28, reserved: 5, threshold: 15, location: 'Clinic' },
    { name: 'School Textbooks', category: 'material', unit: 'books', quantity: 240, reserved: 60, threshold: 100, location: 'Community Library' },
    { name: 'Solar Lamps', category: 'equipment', unit: 'units', quantity: 35, reserved: 7, threshold: 25, location: 'Storage B' },
    { name: 'Volunteer Hours', category: 'human', unit: 'hours/week', quantity: 180, reserved: 45, threshold: 80, description: 'Available volunteer time per week' },
    { name: 'Building Cement', category: 'material', unit: 'bags (50kg)', quantity: 8, reserved: 0, threshold: 30, location: 'Warehouse C', description: 'CRITICAL SHORTAGE' },
    { name: 'First Aid Supplies', category: 'medicine', unit: 'packs', quantity: 22, reserved: 4, threshold: 20, location: 'Clinic' },
    { name: 'Blankets', category: 'material', unit: 'units', quantity: 95, reserved: 15, threshold: 50, location: 'Storage B' },
  ]
  for (const r of resources) {
    await db.resource.create({ data: r })
  }
  console.log(`Created ${resources.length} resources`)

  // ---- Projects ----
  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000)
  const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000)

  const projects = [
    {
      name: 'Clean Water Access Initiative',
      description: 'Installation of 12 community water points and water purification systems serving 3,000+ residents in Kibera.',
      category: 'infrastructure',
      goal: 'Provide safe drinking water within 500m of every household',
      budget: 850000,
      spent: 540000,
      startDate: daysAgo(95),
      endDate: daysAhead(45),
      progress: 64,
      status: 'active',
      managerName: 'Sarah Chen',
      location: 'Kibera Sector 4',
      beneficiaries: 3200,
    },
    {
      name: 'Solar Street Lighting',
      description: 'Deploy 40 solar-powered street lights along major walkways to improve safety and enable evening commerce.',
      category: 'infrastructure',
      goal: 'Reduce night-time incidents by 50% and extend business hours',
      budget: 620000,
      spent: 620000,
      startDate: daysAgo(150),
      endDate: daysAgo(10),
      progress: 100,
      status: 'completed',
      managerName: 'Joseph Mutua',
      location: 'Kibera Sectors 1-3',
      beneficiaries: 8500,
    },
    {
      name: 'Maternal Health Outreach',
      description: 'Mobile clinic providing prenatal and postnatal care to expecting and new mothers.',
      category: 'health',
      goal: 'Reduce maternal mortality by 40% in target area',
      budget: 380000,
      spent: 215000,
      startDate: daysAgo(60),
      endDate: daysAhead(120),
      progress: 42,
      status: 'active',
      managerName: 'Maria Santos',
      location: 'Kibera Clinic',
      beneficiaries: 450,
    },
    {
      name: 'Youth Skills Training',
      description: 'Vocational training in IT, tailoring, carpentry for 120 unemployed youth aged 18-30.',
      category: 'education',
      goal: '75% of graduates employed within 6 months',
      budget: 290000,
      spent: 95000,
      startDate: daysAgo(40),
      endDate: daysAhead(140),
      progress: 28,
      status: 'delayed',
      managerName: 'Li Wei',
      location: 'Community Training Center',
      beneficiaries: 120,
    },
    {
      name: 'Community Garden Project',
      description: 'Convert 2 acres of vacant land into organic vegetable gardens managed by 30 families.',
      category: 'environment',
      goal: 'Produce 500kg of vegetables monthly; improve food security',
      budget: 180000,
      spent: 0,
      startDate: daysAhead(20),
      endDate: daysAhead(290),
      progress: 0,
      status: 'planning',
      managerName: 'Peter Njoroge',
      location: 'Kibera East',
      beneficiaries: 180,
    },
    {
      name: 'Microfinance for Women',
      description: 'Small loans (5,000-50,000 KES) and business training for 60 women entrepreneurs.',
      category: 'economic',
      goal: 'Create 60 sustainable micro-enterprises',
      budget: 500000,
      spent: 380000,
      startDate: daysAgo(120),
      endDate: daysAhead(60),
      progress: 78,
      status: 'active',
      managerName: 'Aisha Mohammed',
      location: 'Community Hall',
      beneficiaries: 60,
    },
    {
      name: 'School Textbook Library',
      description: 'Establish community textbook library serving 4 local primary schools.',
      category: 'education',
      goal: 'Improve textbook-to-student ratio from 1:8 to 1:3',
      budget: 220000,
      spent: 198000,
      startDate: daysAgo(180),
      endDate: daysAgo(30),
      progress: 100,
      status: 'completed',
      managerName: 'Lucy Wanjiru',
      location: 'Community Library',
      beneficiaries: 1200,
    },
    {
      name: 'Emergency Food Distribution',
      description: 'Monthly food packages for 80 vulnerable families during drought season.',
      category: 'social',
      goal: 'Prevent malnutrition among 400+ at-risk residents',
      budget: 320000,
      spent: 165000,
      startDate: daysAgo(75),
      endDate: daysAhead(15),
      progress: 55,
      status: 'active',
      managerName: 'Esther Wambui',
      location: 'Distribution Center',
      beneficiaries: 400,
    },
  ]
  const createdProjects = []
  for (const p of projects) {
    const project = await db.project.create({ data: p })
    createdProjects.push(project)
  }
  console.log(`Created ${createdProjects.length} projects`)

  // ---- Milestones ----
  const milestoneTemplates = [
    [{ title: 'Community Consultation', daysOffset: -90, completed: true },
     { title: 'Site Survey Complete', daysOffset: -60, completed: true },
     { title: 'Procurement of Materials', daysOffset: -30, completed: true },
     { title: 'Installation Phase 1', daysOffset: 0, completed: false },
     { title: 'Quality Testing', daysOffset: 30, completed: false },
     { title: 'Handover & Launch', daysOffset: 45, completed: false }],
    [{ title: 'Final Inspection', daysOffset: -10, completed: true },
     { title: 'Community Handover', daysOffset: -10, completed: true }],
    [{ title: 'Recruit Medical Staff', daysOffset: -55, completed: true },
     { title: 'First 100 Mothers Enrolled', daysOffset: -20, completed: true },
     { title: 'Quarterly Health Survey', daysOffset: 30, completed: false },
     { title: 'Expand to Sector 7', daysOffset: 90, completed: false },
     { title: 'Final Evaluation', daysOffset: 120, completed: false }],
    [{ title: 'Curriculum Design', daysOffset: -35, completed: true },
     { title: 'Recruit Trainers', daysOffset: -15, completed: false },
     { title: 'Enroll First Cohort', daysOffset: 5, completed: false },
     { title: 'Mid-term Assessment', daysOffset: 70, completed: false },
     { title: 'Graduation & Job Placement', daysOffset: 140, completed: false }],
    [{ title: 'Land Lease Agreement', daysOffset: 20, completed: false },
     { title: 'Soil Preparation', daysOffset: 50, completed: false },
     { title: 'Planting Season Start', daysOffset: 90, completed: false },
     { title: 'First Harvest', daysOffset: 200, completed: false },
     { title: 'Sustainability Review', daysOffset: 290, completed: false }],
    [{ title: 'Training: Business Basics', daysOffset: -110, completed: true },
     { title: 'Loan Disbursement Round 1', daysOffset: -90, completed: true },
     { title: 'Mentor Pairing', daysOffset: -60, completed: true },
     { title: 'Mid-program Review', daysOffset: -10, completed: true },
     { title: 'Loan Repayment Round 1', daysOffset: 30, completed: false },
     { title: 'Round 2 Disbursement', daysOffset: 60, completed: false }],
    [{ title: 'Book Procurement', daysOffset: -170, completed: true },
     { title: 'Library Setup', daysOffset: -130, completed: true },
     { title: 'School Distribution', daysOffset: -60, completed: true },
     { title: 'Reading Program Launch', daysOffset: -30, completed: true }],
    [{ title: 'Beneficiary Registration', daysOffset: -70, completed: true },
     { title: 'November Distribution', daysOffset: -40, completed: true },
     { title: 'December Distribution', daysOffset: -10, completed: true },
     { title: 'January Distribution', daysOffset: 15, completed: false }],
  ]
  for (let i = 0; i < createdProjects.length; i++) {
    const project = createdProjects[i]
    const ms = milestoneTemplates[i] || []
    for (const m of ms) {
      await db.milestone.create({
        data: {
          projectId: project.id,
          title: m.title,
          dueDate: daysAhead(m.daysOffset),
          completed: m.completed,
          completedAt: m.completed ? daysAhead(m.daysOffset) : null,
        },
      })
    }
  }
  console.log(`Created milestones for ${createdProjects.length} projects`)

  // ---- Resource Allocations ----
  const allResources = await db.resource.findMany()
  const findRes = (name: string) => allResources.find(r => r.name === name)!
  const allocations = [
    { resourceName: 'Maize Flour', projectName: 'Emergency Food Distribution', quantity: 15, reason: 'November food packages for 80 families', status: 'distributed', daysAgo: 40 },
    { resourceName: 'Rice', projectName: 'Emergency Food Distribution', quantity: 8, reason: 'November food packages', status: 'distributed', daysAgo: 40 },
    { resourceName: 'Cooking Oil', projectName: 'Emergency Food Distribution', quantity: 20, reason: 'November food packages', status: 'distributed', daysAgo: 40 },
    { resourceName: 'Medical Kits', projectName: 'Maternal Health Outreach', quantity: 5, reason: 'Mobile clinic supplies for Q1', status: 'approved', daysAgo: 15 },
    { resourceName: 'School Textbooks', projectName: 'School Textbook Library', quantity: 60, reason: 'Distribution to 4 schools', status: 'distributed', daysAgo: 60 },
    { resourceName: 'Solar Lamps', projectName: 'Solar Street Lighting', quantity: 7, reason: 'Replacement lamps for defective units', status: 'pending', daysAgo: 2 },
    { resourceName: 'Building Cement', projectName: 'Clean Water Access Initiative', quantity: 8, reason: 'Pipe housing construction', status: 'pending', daysAgo: 1 },
    { resourceName: 'Volunteer Hours', projectName: 'Clean Water Access Initiative', quantity: 30, reason: 'Community labor for installation week', status: 'approved', daysAgo: 5 },
    { resourceName: 'Blankets', projectName: 'Emergency Food Distribution', quantity: 15, reason: 'Winter distribution to elder families', status: 'pending', daysAgo: 3 },
    { resourceName: 'First Aid Supplies', projectName: 'Maternal Health Outreach', quantity: 4, reason: 'Quarterly restock', status: 'approved', daysAgo: 8 },
  ]
  for (const a of allocations) {
    const res = findRes(a.resourceName)
    const proj = createdProjects.find(p => p.name === a.projectName)
    const approver = a.status !== 'pending' ? createdUsers[0] : null
    await db.resourceAllocation.create({
      data: {
        resourceId: res.id,
        projectId: proj?.id,
        quantity: a.quantity,
        reason: a.reason,
        status: a.status,
        approverId: approver?.id,
        approvedAt: approver ? daysAgo(a.daysAgo - 1) : null,
        requestedAt: daysAgo(a.daysAgo),
      },
    })
  }
  console.log(`Created ${allocations.length} resource allocations`)

  // ---- Transactions ----
  const transactions = [
    { type: 'grant', category: 'government_grant', amount: 500000, description: 'County development grant Q4', source: 'Nairobi County Government', daysAgo: 90 },
    { type: 'donation', category: 'fundraising', amount: 180000, description: 'Annual charity gala proceeds', source: 'Community Gala 2025', daysAgo: 75 },
    { type: 'donation', category: 'corporate_sponsorship', amount: 250000, description: 'Sponsorship for clean water project', source: 'Safaricom Foundation', daysAgo: 80 },
    { type: 'income', category: 'membership', amount: 45000, description: 'Quarterly membership dues', source: 'Member contributions', daysAgo: 30 },
    { type: 'donation', category: 'individual', amount: 35000, description: 'Anonymous donor - food program', source: 'Anonymous', daysAgo: 25 },
    { type: 'income', category: 'microfinance_repayment', amount: 28000, description: 'Round 1 loan repayments', source: 'Women microfinance group', daysAgo: 20 },
    { type: 'expense', category: 'supplies', amount: 145000, description: 'Water pipes and fittings', source: 'Hardware Express Ltd', projectId: createdProjects[0].name, daysAgo: 60 },
    { type: 'expense', category: 'salary', amount: 95000, description: 'Mobile clinic staff salaries', source: 'Clinic Team', projectId: createdProjects[2].name, daysAgo: 30 },
    { type: 'expense', category: 'equipment', amount: 220000, description: 'Solar street light units (40x)', source: 'SolarTech Kenya', projectId: createdProjects[1].name, daysAgo: 140 },
    { type: 'expense', category: 'food', amount: 86000, description: 'Emergency food supplies - Nov/Dec', source: 'Wholesale Foods Ltd', projectId: createdProjects[7].name, daysAgo: 45 },
    { type: 'expense', category: 'training', amount: 45000, description: 'Vocational training materials', source: 'Training Supplies Co', projectId: createdProjects[3].name, daysAgo: 25 },
    { type: 'expense', category: 'microfinance_loan', amount: 320000, description: 'Loan disbursement round 1', source: '60 women entrepreneurs', projectId: createdProjects[5].name, daysAgo: 90 },
    { type: 'expense', category: 'books', amount: 180000, description: 'Textbook procurement (240 books)', source: 'Longhorn Publishers', projectId: createdProjects[6].name, daysAgo: 175 },
    { type: 'expense', category: 'operations', amount: 32000, description: 'Office rent and utilities Q4', source: 'Property Manager', daysAgo: 15 },
    { type: 'donation', category: 'international_ngo', amount: 200000, description: 'Grant for maternal health program', source: 'Doctors Without Borders', daysAgo: 65 },
  ]
  for (const t of transactions) {
    const project = createdProjects.find(p => p.name === t.projectId)
    await db.transaction.create({
      data: {
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description,
        source: t.source,
        projectId: project?.id,
        date: daysAgo(t.daysAgo),
      },
    })
  }
  console.log(`Created ${transactions.length} transactions`)

  // ---- Contributions ----
  const members = await db.member.findMany()
  const contributionTypes = [
    { type: 'time', description: 'Volunteered at food distribution', value: 8 },
    { type: 'time', description: 'Community clean-up day', value: 6 },
    { type: 'skill', description: 'Provided carpentry for community center', value: 12 },
    { type: 'money', description: 'Donation to emergency fund', value: 2000 },
    { type: 'material', description: 'Donated 5 bags of cement', value: 3500 },
    { type: 'time', description: 'Tutored youth in IT skills', value: 16 },
    { type: 'skill', description: 'Tailoring training for 5 women', value: 20 },
    { type: 'money', description: 'Annual membership contribution', value: 1500 },
    { type: 'time', description: 'Health outreach volunteer', value: 24 },
    { type: 'material', description: 'Donated 20 blankets', value: 8000 },
    { type: 'skill', description: 'Electrical work for solar project', value: 18 },
    { type: 'time', description: 'Library organization volunteer', value: 10 },
  ]
  for (let i = 0; i < 30; i++) {
    const c = contributionTypes[i % contributionTypes.length]
    const member = members[i % members.length]
    await db.contribution.create({
      data: {
        memberId: member.id,
        type: c.type,
        description: c.description,
        value: c.value,
        date: daysAgo(Math.floor(Math.random() * 90) + 1),
      },
    })
  }
  console.log(`Created 30 contributions`)

  // ---- Feedback ----
  const feedbackEntries = [
    { rating: 5, category: 'project', content: 'The new water points have transformed our daily lives. My children no longer walk 2km for water.', sentiment: 'positive', projectName: 'Clean Water Access Initiative' },
    { rating: 5, category: 'project', content: 'Solar lights made the streets much safer at night. We can now keep our shops open later.', sentiment: 'positive', projectName: 'Solar Street Lighting' },
    { rating: 4, category: 'project', content: 'The maternal clinic is wonderful but we need it to come more often than once a month.', sentiment: 'positive', projectName: 'Maternal Health Outreach' },
    { rating: 2, category: 'project', content: 'Skills training started late and many youths lost interest. Please communicate better.', sentiment: 'negative', projectName: 'Youth Skills Training' },
    { rating: 5, category: 'project', content: 'The textbook library has helped my 3 children study at home. Thank you!', sentiment: 'positive', projectName: 'School Textbook Library' },
    { rating: 4, category: 'project', content: 'Microfinance loan helped me start a tailoring business. Repayment schedule is fair.', sentiment: 'positive', projectName: 'Microfinance for Women' },
    { rating: 5, category: 'resource', content: 'Food packages arrived just when we needed them most. Very grateful.', sentiment: 'positive', projectName: 'Emergency Food Distribution' },
    { rating: 3, category: 'general', content: 'Would like more transparency on how funds are being spent. Monthly reports would help.', sentiment: 'neutral' },
    { rating: 5, category: 'leadership', content: 'Community leaders are very responsive to concerns. Great job.', sentiment: 'positive' },
    { rating: 4, category: 'general', content: 'Appreciate the regular community meetings. Would like more youth representation.', sentiment: 'positive' },
    { rating: 2, category: 'resource', content: 'Medicine stock at the clinic often runs out. Please improve supply chain.', sentiment: 'negative' },
    { rating: 5, category: 'project', content: 'Excited about the community garden project. Looking forward to participating.', sentiment: 'positive', projectName: 'Community Garden Project' },
    { rating: 4, category: 'general', content: 'The dashboard and updates are helpful. Keep up the good work.', sentiment: 'positive' },
    { rating: 3, category: 'project', content: 'Project timelines keep shifting. Better planning needed.', sentiment: 'neutral', projectName: 'Youth Skills Training' },
    { rating: 5, category: 'leadership', content: 'Elders feel heard and respected. Thank you for the home visits.', sentiment: 'positive' },
  ]
  for (const f of feedbackEntries) {
    const project = f.projectName ? createdProjects.find(p => p.name === f.projectName) : null
    const member = members[Math.floor(Math.random() * members.length)]
    await db.feedback.create({
      data: {
        projectId: project?.id,
        memberId: member.id,
        rating: f.rating,
        category: f.category,
        content: f.content,
        sentiment: f.sentiment,
        status: Math.random() > 0.6 ? 'addressed' : 'open',
      },
    })
  }
  console.log(`Created ${feedbackEntries.length} feedback entries`)

  // ---- Announcements ----
  const announcements = [
    { title: 'Monthly Community Meeting - 15th', content: 'All members are invited to our monthly community meeting on the 15th at 10 AM in the Community Hall. We will discuss project updates, budget review, and upcoming initiatives.', category: 'meeting', authorId: createdUsers[1].id, pinned: true },
    { title: 'CRITICAL: Cement Shortage Affects Water Project', content: 'We have an urgent shortage of building cement (8 bags available, 30 needed). The Clean Water Access Initiative may be delayed. Any donations or leads on suppliers would be appreciated.', category: 'urgent', authorId: createdUsers[0].id, pinned: true },
    { title: 'New Volunteer Orientation - Saturday', content: 'Orientation session for new volunteers this Saturday at 2 PM. Please bring identification and any certification documents.', category: 'event', authorId: createdUsers[4].id },
    { title: 'Food Distribution Schedule - January', content: 'January food distribution will occur on the 5th, 12th, 19th, and 26th. Distribution center opens at 9 AM. Please bring your registration card.', category: 'general', authorId: createdUsers[3].id },
    { title: 'Youth Skills Training - Enrollment Open', content: 'Enrollment for the second cohort of vocational training is now open. Visit the training center between 9 AM - 4 PM to register. Limited to 120 spots.', category: 'event', authorId: createdUsers[2].id },
    { title: 'Annual Transparency Report Published', content: 'The 2025 annual transparency report is now available at the community office and on our dashboard. Total income: 1.16M KES, total expenses: 1.05M KES, surplus reinvested.', category: 'general', authorId: createdUsers[0].id },
  ]
  for (const a of announcements) {
    await db.announcement.create({ data: a })
  }
  console.log(`Created ${announcements.length} announcements`)

  // ---- Alerts ----
  const alerts = [
    { type: 'shortage', severity: 'critical', title: 'Building Cement Critical Shortage', message: 'Only 8 bags remaining (threshold: 30). Water project at risk of delay.', relatedType: 'resource' },
    { type: 'shortage', severity: 'warning', title: 'Water Filters Low Stock', message: '12 units remaining (threshold: 20). Consider reordering.', relatedType: 'resource' },
    { type: 'delay', severity: 'critical', title: 'Youth Skills Training Delayed', message: 'Project is 25% behind schedule. Trainer recruitment delayed by 2 weeks.', relatedType: 'project' },
    { type: 'budget', severity: 'warning', title: 'Water Project Budget at 64%', message: 'Project is 64% complete but 64% of budget is spent. Monitor closely.', relatedType: 'project' },
    { type: 'feedback', severity: 'info', title: 'New Negative Feedback', message: '2 negative feedback entries on Youth Skills Training. Review feedback module.', relatedType: 'project' },
    { type: 'risk', severity: 'warning', title: 'Approaching Project Deadline', message: 'Emergency Food Distribution ends in 15 days. Renewal plan not yet submitted.', relatedType: 'project' },
    { type: 'shortage', severity: 'warning', title: 'Volunteer Hours Declining', message: '180 hours available vs 80 hour threshold. Demand increasing for water project.', relatedType: 'resource' },
  ]
  for (const a of alerts) {
    await db.alert.create({ data: a })
  }
  console.log(`Created ${alerts.length} alerts`)

  // ---- Audit Logs ----
  const auditActions = [
    { action: 'login', entity: 'user', details: 'User logged in' },
    { action: 'create', entity: 'project', details: 'Created project: Clean Water Access Initiative' },
    { action: 'approve', entity: 'allocation', details: 'Approved food distribution allocation' },
    { action: 'update', entity: 'project', details: 'Updated project progress: Solar Street Lighting to 100%' },
    { action: 'create', entity: 'transaction', details: 'Recorded donation: 180,000 KES from Community Gala' },
    { action: 'update', entity: 'resource', details: 'Updated stock levels for maize flour' },
    { action: 'create', entity: 'announcement', details: 'Posted urgent announcement: cement shortage' },
    { action: 'approve', entity: 'allocation', details: 'Approved medical kit allocation for mobile clinic' },
    { action: 'create', entity: 'member', details: 'Registered new member: Lucy Wanjiru' },
    { action: 'update', entity: 'project', details: 'Marked project delayed: Youth Skills Training' },
  ]
  for (let i = 0; i < auditActions.length; i++) {
    const a = auditActions[i]
    await db.auditLog.create({
      data: {
        userId: createdUsers[i % createdUsers.length].id,
        action: a.action,
        entity: a.entity,
        details: a.details,
        createdAt: daysAgo(i * 2 + 1),
      },
    })
  }
  console.log(`Created ${auditActions.length} audit logs`)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
