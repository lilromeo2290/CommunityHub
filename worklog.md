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

**Commit**: (initial push)
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
