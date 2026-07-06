'use client'

import { useState, useEffect } from 'react'
import { CmsShell } from '@/components/cms/CmsShell'
import { DashboardView } from '@/components/cms/DashboardView'
import { MembersView } from '@/components/cms/MembersView'
import { ResourcesView } from '@/components/cms/ResourcesView'
import { ProjectsView } from '@/components/cms/ProjectsView'
import { FinanceView } from '@/components/cms/FinanceView'
import { EvaluationView } from '@/components/cms/EvaluationView'
import { AiInsightsView } from '@/components/cms/AiInsightsView'
import { CommunicationView } from '@/components/cms/CommunicationView'
import { AuditView } from '@/components/cms/AuditView'
import { SettingsView } from '@/components/cms/SettingsView'
import type { ViewKey } from '@/lib/cms'

export default function Home() {
  const [view, setView] = useState<ViewKey>('dashboard')
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(d => {
        const alerts = d.alerts || []
        setAlertCount(alerts.filter((a: any) => !a.acknowledged && a.severity === 'critical').length)
      })
      .catch(() => {})
  }, [view])

  return (
    <CmsShell activeView={view} onViewChange={setView} alertCount={alertCount}>
      {view === 'dashboard' && <DashboardView />}
      {view === 'members' && <MembersView />}
      {view === 'resources' && <ResourcesView />}
      {view === 'projects' && <ProjectsView />}
      {view === 'finance' && <FinanceView />}
      {view === 'evaluation' && <EvaluationView />}
      {view === 'ai' && <AiInsightsView />}
      {view === 'communication' && <CommunicationView />}
      {view === 'audit' && <AuditView />}
      {view === 'settings' && <SettingsView />}
    </CmsShell>
  )
}
