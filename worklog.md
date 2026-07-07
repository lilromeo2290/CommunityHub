# CommunityHub — Worklog

> Single shared work log for the CommunityHub project. All contributors MUST append a new section (separated by `---`) after every commit or push, so we have a permanent history of what was done and why.

## Repository

- **Remote**: https://github.com/lilromeo2290/CommunityHub.git
- **Branch**: `main`
- **Token rotation**: GitHub Personal Access Token (PAT) is stored locally in the git remote URL. Rotate periodically — when a new token is issued, update the remote with:
  ```bash
  git remote set-url origin https://<NEW_TOKEN>@github.com/lilromeo2290/CommunityHub.git
  ```

## Commit & Push Protocol (MANDATORY)

Every contributor MUST follow this protocol before finishing a work session:

1. **Stage** all relevant changes: `git add -A`
2. **Commit** with a descriptive message: `git commit -m "<type>: <short description>"`
   - Types: `feat` (new feature), `fix` (bug fix), `refactor`, `docs`, `chore`, `seed`, `ui`, `api`
3. **Push** to remote: `git push origin main`
4. **Append** a new section to this worklog (see template below)
5. **Commit & push** the worklog update too

### Worklog Entry Template

```markdown
---
## YYYY-MM-DD HH:MM UTC — <Your Name / Agent>

**Commit**: <short hash>
**Type**: <feat|fix|refactor|docs|chore|seed|ui|api>
**Scope**: <which module(s)>

### Changes
- <bullet 1>
- <bullet 2>

### Files
- <path 1>
- <path 2>

### Notes
- <anything future contributors should know>
```

---

## 2026-07-06 23:10 UTC — Initial Setup (Agent)

**Commit**: `02d5ce1`
**Type**: chore
**Scope**: repository

### Changes
- Initialized git repository and configured remote `origin` pointing to https://github.com/lilromeo2290/CommunityHub.git
- Untracked `.env` (was previously committed by scaffold; only contains local SQLite path but should not be in VCS)
- Untracked `.zscripts/dev.pid` (runtime file, should never be committed)
- Added `*.pid` and `.zscripts/dev.pid` to `.gitignore`
- Pushed initial codebase containing the full CommunityHub CMS application

### Files
- `.gitignore` (updated)
- `.env` (untracked)
- `.zscripts/dev.pid` (untracked)

### Project Summary (as of initial push)

CommunityHub is a complete, intelligent Community Management System (CMS) for NGOs, foundations, and local communities. Built with:

- **Framework**: Next.js 16 (App Router) + TypeScript 5 + Turbopack
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style) + Lucide icons
- **Database**: Prisma ORM + SQLite (15 interconnected models)
- **Charts**: Recharts
- **Animations**: Framer Motion

### Modules Implemented

1. **Dashboard** — KPI grid, critical alert banner, income-vs-expense area chart, project status pie, resource-by-category bar chart, member demographics, top community needs, active alerts feed, project progress cards
2. **Members** — Searchable registry of 15 community members with digital profiles, skills, needs, household size, contributions. Add Member dialog.
3. **Resources** — Inventory of 12 resources with stock indicators (OK/Low/Out), 3-tab interface (Inventory, Allocations with approve/reject/distribute workflow, Reports with utilization chart and shortage risk analysis)
4. **Projects** — 8 community projects with category badges, progress bars, budget tracking, milestones. Detail drawer with KPI grid, goal, milestones with overdue detection, status changer.
5. **Finance** — Income/expense/balance cards, category breakdown chart, funding sources pie, transaction log table with filters, auto-generated transparency report
6. **M&E (Monitoring & Evaluation)** — Avg rating, sentiment distribution, top concerns, project performance, before/after impact assessment, community feedback with mark-addressed workflow
7. **AI Insights** — 8 generated insights across 8 capabilities (resource prediction, inefficiency, allocation strategy, delay/deadline risk, feedback analysis, funding/capacity risk) with priority levels and recommendations
8. **Communication** — Pinned announcements, recent feed with author avatars, category badges. New Announcement dialog.
9. **Audit Log** — 6-tier role-based access control matrix, searchable/filterable activity log

### Data Model

15 Prisma models: User, Member, Resource, ResourceAllocation, Project, Milestone, Transaction, Contribution, Feedback, AuditLog, Announcement, Alert

### Demo Data

Seed script (`scripts/seed.ts`) populates:
- 15 users + members
- 12 resources
- 8 projects with 38 milestones
- 10 resource allocations (mixed statuses)
- 15 transactions
- 30 contributions
- 15 feedback entries
- 6 announcements
- 7 alerts
- 10 audit logs

### File Structure

```
prisma/schema.prisma           — Database schema (15 models)
scripts/seed.ts                — Demo data seeder
src/app/api/                   — 11 API route modules
src/components/cms/            — 9 view components + CmsShell layout
src/lib/cms.ts                 — Shared types, helpers, formatters
src/app/page.tsx               — Main page with view switching
```

### Notes

- The `db/custom.db` SQLite file is committed intentionally so the demo works out of the box. If you re-seed locally, you can either commit the new DB or add `db/*.db` to `.gitignore`.
- The `.env` file is gitignored — to set up locally, create `.env` with `DATABASE_URL=file:/home/z/my-project/db/custom.db`
- Dev server runs on port 3000 via `bun run dev`
- Lint must pass before commit: `bun run lint`
- All views were verified working via Agent Browser before initial push

---

## 2026-07-06 23:35 UTC — Dynamic Category Manager (Agent)

**Commit**: `c83b6eb`
**Type**: feat
**Scope**: settings, all modules

### Changes
- Added new `Category` Prisma model with fields: id, type, value, label, color, icon, active, isSystem, sortOrder. Unique constraint on (type, value).
- Built full CRUD API at `/api/categories` supporting GET (with optional type filter and includeInactive flag), POST (create), PATCH (update), DELETE (with system-category protection).
- Seeded 30 default categories across 6 types: member (6), resource (6), project (6), announcement (4), feedback (4), transaction_type (4). All marked as `isSystem: true` so they cannot be deleted (only deactivated).
- Built new `SettingsView` (Category Manager) with:
  - Header banner explaining the feature
  - 6 overview cards showing active/total counts per type
  - Tabbed interface for each category type
  - Per-category row with label, color badge, value code, system flag, sort order, created date
  - Add Category dialog (label, value, type, color picker, sort order, active toggle)
  - Edit Category dialog (same fields, type locked)
  - Delete confirmation dialog (blocked for system categories)
  - Toggle active/inactive via switch directly on row
- Added new "Settings" sidebar nav item with gear icon
- Created reusable `useCategories(type)` hook that fetches categories from the API
- Updated ALL dialogs across 5 views to fetch categories dynamically instead of hardcoding:
  - MembersView: filter dropdown + Add Member dialog category field
  - ResourcesView: Add Resource dialog category field
  - ProjectsView: Add Project dialog category field
  - FinanceView: transaction type filter + Add Transaction dialog type field
  - CommunicationView: Add Announcement dialog category field
  - EvaluationView: Add Feedback dialog category field
- Created standalone `scripts/seed-categories.ts` for idempotent category seeding (does not wipe other data)

### Files
- `prisma/schema.prisma` — Added Category model
- `src/app/api/categories/route.ts` — NEW: Full CRUD API
- `src/hooks/use-categories.ts` — NEW: Reusable fetch hook
- `src/components/cms/SettingsView.tsx` — NEW: Category Manager UI
- `src/lib/cms.ts` — Added 'settings' to ViewKey and NAV_ITEMS
- `src/components/cms/CmsShell.tsx` — Added Settings import and icon
- `src/app/page.tsx` — Wire SettingsView to 'settings' view
- `src/components/cms/MembersView.tsx` — Dynamic categories in filter + dialog
- `src/components/cms/ResourcesView.tsx` — Dynamic categories in Add Resource dialog
- `src/components/cms/ProjectsView.tsx` — Dynamic categories in Add Project dialog
- `src/components/cms/FinanceView.tsx` — Dynamic categories in filter + Add Transaction dialog
- `src/components/cms/CommunicationView.tsx` — Dynamic categories in Add Announcement dialog
- `src/components/cms/EvaluationView.tsx` — Dynamic categories in Add Feedback dialog
- `scripts/seed.ts` — Updated to seed categories alongside other demo data
- `scripts/seed-categories.ts` — NEW: Idempotent category-only seeder
- `download/category-manager.png` — Screenshot of the new Settings page

### How it works

1. Admin clicks "Settings" in the sidebar → Category Manager page loads
2. Six tabs let admin browse categories per module type (Members, Resources, Projects, Announcements, Feedback, Transaction Types)
3. Each row shows the category with its color, value code, system flag, and sort order
4. Admin can:
   - **Add**: Click "Add Category" → fill label, value, type, color, sort order, active toggle
   - **Edit**: Click pencil icon → same form pre-filled (type locked for existing categories)
   - **Delete**: Click trash icon → confirmation dialog (system categories can only be deactivated, not deleted)
   - **Deactivate/Activate**: Toggle the switch on any row to hide/show the category in dropdowns without deleting
5. Changes take effect immediately across all module dialogs (Members, Resources, Projects, Finance, Communication, M&E)

### Verified via Agent Browser
- Settings page loads with 6/6 active categories for all 6 module types
- All 6 member categories render with correct labels, colors, values, and system badges
- Add Category dialog accepts all fields (label, value, type, color picker, sort order, active toggle)
- Created "Disabled / PWD" category with rose color → appears at bottom of member list with delete button enabled (not system)
- New category immediately appears in Members filter dropdown → confirms end-to-end dynamic flow works

### Notes
- The `isSystem` flag protects the 30 default categories from accidental deletion. Admins can still deactivate them to hide from dropdowns.
- Categories already in use by records (e.g. a member with category="leader") will keep that raw value even if the category is deleted — they just won't show a friendly label in dropdowns anymore.
- All category CRUD operations are recorded in the Audit Log.

---

## 2026-07-06 23:50 UTC — Dark Mode (Agent)

**Commit**: `f8bd189`
**Type**: feat
**Scope**: theme, layout

### Changes
- Added ThemeProvider (next-themes) wrapping the app, defaulting to **dark** theme
- Built new `ThemeToggle` dropdown component with 3 options: Light, Dark, System
- Added the toggle button to the header between "Online" status and the Alerts bell
- Rewrote the dark palette in `globals.css` to be "a little dark" — soft charcoal backgrounds (oklch 0.18-0.225 lightness) with a subtle emerald undertone (hue 162-165) to match the brand, instead of pure grayscale
- Updated chart colors in dark mode to be more vibrant (emerald, teal, cyan, amber, red)
- Added 0.3s smooth color transition on body for theme switches
- Added custom scrollbar styling that adapts to theme
- Fixed sidebar "Need help?" card and active nav item to use `dark:` variants (emerald-950/40 backgrounds with emerald-300 text) so they look correct in both themes
- Sonner toaster inherits theme automatically via useTheme() in the existing component

### Files
- `src/components/theme-provider.tsx` — NEW: next-themes provider wrapper
- `src/components/theme-toggle.tsx` — NEW: Light/Dark/System dropdown toggle
- `src/app/layout.tsx` — Wrap children in ThemeProvider, defaultTheme="dark"
- `src/components/cms/CmsShell.tsx` — Import ThemeToggle, add to header, dark: variants for sidebar
- `src/app/globals.css` — Rewrote .dark palette with emerald-tinted charcoal, added smooth transition + custom scrollbar

### How it works

- App boots in dark mode by default (`defaultTheme="dark"`)
- next-themes adds `.dark` class to `<html>` automatically and persists choice in localStorage
- ThemeToggle dropdown lets user switch between Light / Dark / System at any time
- All shadcn/ui components automatically adapt because they use `bg-background`, `text-foreground`, `border-border` etc. CSS variables
- Tailwind `dark:` variants handle the few hardcoded color cases (sidebar gradient card, active nav item)

### Verified via Agent Browser
- Default load: `document.documentElement.classList.contains('dark')` returns `"DARK"` ✓
- Toggle to Light: class removed, page switches to light theme ✓
- Toggle back to Dark: class re-added, page switches back to dark ✓
- Dashboard, Settings views render correctly in both themes with no console errors
- Screenshots saved: `dark-mode-default.png`, `light-mode.png`, `dark-mode-final.png`, `dashboard-dark.png`, `settings-dark.png`

### Notes
- The dark palette uses oklch with hue 162-165 (emerald range) at low chroma (0.008-0.02) so the background isn't pure gray — it has a faint green warmth that pairs with the emerald brand
- Lightness 0.18 for background and 0.225 for cards makes it "a little dark" rather than pitch black (which would be 0.0)
- All existing gradient brand colors (from-emerald-500 to-teal-600) work in both themes since they're saturated

---

## 2026-07-07 00:15 UTC — Users & Roles Management (Agent)

**Commit**: `e4be869`
**Type**: feat
**Scope**: users, roles, security

### Changes
- Built new `/api/users` CRUD route with full user management (GET, POST, PATCH, DELETE)
- Added **last-admin protection**: cannot delete or demote the last active admin (prevents accidental lockout)
- Added linked-member check: cannot delete a user whose account is linked to a member profile (must reassign member first)
- Built new `UserManagementView` with two tabs:
  - **User Accounts tab**: searchable/filterable table of all users with avatars, role badges, linked member info, active toggle, edit/delete buttons
  - **Roles & Permissions tab**: 6 role cards showing active user counts and descriptions, plus a full permissions matrix showing which actions each role can perform across 6 categories (Members, Resources, Projects, Finance, Communication, Settings & Security)
- Built Add User and Edit User dialogs with name, email, role selector, and active toggle
- Built Delete User confirmation dialog with warnings about linked member profiles
- Added "Users & Roles" nav item with UserCog icon
- All user changes are recorded in the audit log
- All UI components use `dark:` variants for proper dark mode support

### Files
- `src/app/api/users/route.ts` — NEW: Full CRUD API with last-admin protection
- `src/components/cms/UserManagementView.tsx` — NEW: Users table + Roles & Permissions matrix
- `src/lib/cms.ts` — Added 'users' to ViewKey and NAV_ITEMS
- `src/components/cms/CmsShell.tsx` — Added UserCog icon import and case
- `src/app/page.tsx` — Wire UserManagementView to 'users' view

### Role & Permission Model

Six roles with progressive permissions:

1. **Administrator** (red) — Full system access including user management, settings, audit logs
2. **Community Leader** (emerald) — Approve allocations, post announcements, manage members
3. **Project Manager** (cyan) — Create/edit projects, update milestones, submit allocations
4. **Finance Officer** (violet) — Record transactions, generate reports, view budgets
5. **Volunteer** (amber) — View projects, submit feedback, update contributions
6. **Community Member** (gray) — View dashboard, submit feedback, view announcements

The permissions matrix displays 18 specific actions across 6 categories with checkmarks/X icons showing what each role can do.

### Safety features
- **Last-admin protection**: API blocks role change or deletion of the last active admin
- **Linked member protection**: API blocks deletion of users with linked member profiles (must reassign member first)
- **Email uniqueness**: API validates email uniqueness on create and update
- **Role validation**: API only accepts the 6 defined roles
- **Audit logging**: All create/update/delete operations recorded with user, action, and details

### Verified via Agent Browser
- Page loads with 15 users, 15 active, 1 admin, 1 volunteer (correct counts)
- All users render in table with avatars, role badges, linked member info, active switches
- Roles & Permissions tab shows all 6 role cards with active user counts
- Permissions matrix renders 18 actions × 6 roles with checkmarks/X icons
- Add User dialog accepts name, email, role selector, active toggle
- Created "Test Admin" user with Leader role → appeared at top of table immediately
- Edit User dialog opens pre-filled with existing user data
- Delete button disabled for last admin with tooltip "Cannot delete last admin"

### Notes
- The 10 seeded community members all have role "member" (visible in the Roles & Permissions tab count)
- The 5 staff users (admin, leader, project_manager, finance, volunteer) each have role-appropriate permissions
- All user CRUD operations appear in the Audit Log view with user name, action, and timestamp

---

## 2026-07-07 00:30 UTC — Clear All Data (Agent)

**Commit**: (pending push)
**Type**: chore
**Scope**: database

### Changes
- Created `scripts/clear-data.ts` to wipe all data from the database in correct dependency order
- Ran the script — cleared:
  - 16 users (15 seeded + 1 "Test Admin" created during earlier testing)
  - 15 members
  - 12 resources
  - 8 projects
  - 37 milestones
  - 10 resource allocations
  - 15 transactions
  - 30 contributions
  - 15 feedback entries
  - 6 announcements
  - 7 alerts
  - 10 audit logs
  - 31 categories (then re-seeded 30 default categories)
- Re-seeded the 30 default categories so all dropdowns across the app still work
- Verified the app handles the empty state gracefully — all views show zeros / "No X found" / empty tables instead of crashing
- Verified the Settings page still shows all 30 default categories (6/6 + 6/6 + 6/6 + 4/4 + 4/4 + 4/4 = 30 across 6 module types)

### Files
- `scripts/clear-data.ts` — NEW: Idempotent clear-all script (wipes data, re-seeds default categories)
- `db/custom.db` — Updated: now contains only the 30 default categories

### Final database state
```
users           0
members         0
resources       0
projects        0
transactions    0
allocations     0
announcements   0
alerts          0
feedback        0
contributions   0
auditLogs       0
categories      30   ← preserved (system configuration)
```

### How to use the script
```bash
# Clear all data (preserves default categories):
bun run scripts/clear-data.ts

# Restore demo data after clearing:
bun run scripts/seed.ts
```

### Verified via Agent Browser
- Dashboard loads with all KPIs showing 0, "No needs recorded" placeholder, empty charts (no crashes)
- Users view shows "No users found. Try adjusting filters or add a new user."
- Settings page shows all 6 category tabs with 6/6, 6/6, 6/6, 4/4, 4/4, 4/4 active counts
- All API endpoints return empty arrays / zero counts cleanly (no 500 errors)

### Notes
- The 30 default categories are intentionally preserved because they are system configuration (needed for dropdowns to work), not user data
- All shadcn/ui components and custom views handle empty states gracefully — no error boundaries triggered
- To restore the demo dataset at any time, run `bun run scripts/seed.ts`
