'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Brain,
  Clock, Package, Target, Heart, Wallet, Zap, RefreshCw, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { classNames } from '@/lib/cms'

interface Insight {
  type: string
  priority: string
  title: string
  description: string
  recommendation: string
  metric?: string
}

interface AIInsightsData {
  insights: Insight[]
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    actionRequired: number
  }
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertTriangle className="size-4" /> },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Zap className="size-4" /> },
  medium: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: <Lightbulb className="size-4" /> },
  low: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: <Lightbulb className="size-4" /> },
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  resource_prediction: <Package className="size-4" />,
  inefficiency: <TrendingDown className="size-4" />,
  allocation_strategy: <Wallet className="size-4" />,
  delay_risk: <Clock className="size-4" />,
  deadline_risk: <Target className="size-4" />,
  feedback_analysis: <Heart className="size-4" />,
  funding_risk: <TrendingDown className="size-4" />,
  capacity_risk: <AlertTriangle className="size-4" />,
}

const TYPE_LABELS: Record<string, string> = {
  resource_prediction: 'Resource Prediction',
  inefficiency: 'Efficiency Analysis',
  allocation_strategy: 'Allocation Strategy',
  delay_risk: 'Delay Detection',
  deadline_risk: 'Deadline Risk',
  feedback_analysis: 'Feedback Analysis',
  funding_risk: 'Funding Risk',
  capacity_risk: 'Capacity Risk',
}

export function AiInsightsView() {
  const [data, setData] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/ai-insights')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    fetch('/api/ai-insights')
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden border-emerald-200">
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 text-white">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Brain className="size-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">AI-Powered Insights</h2>
                <Badge className="bg-white/20 text-white border-0 text-[10px]">BETA</Badge>
              </div>
              <p className="text-sm text-white/90 mt-0.5">
                Predictive analytics, risk detection, and recommendations powered by community data.
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3" />
                  <span>{data?.summary.total || 0} insights generated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3" />
                  <span>{data?.summary.actionRequired || 0} need action</span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={load}
              disabled={loading}
              className="bg-white/20 text-white hover:bg-white/30 border-0"
            >
              <RefreshCw className={classNames('size-3.5 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Critical" value={data.summary.critical} color="red" icon={<AlertTriangle className="size-4" />} />
          <SummaryCard label="High Priority" value={data.summary.high} color="amber" icon={<Zap className="size-4" />} />
          <SummaryCard label="Medium" value={data.summary.medium} color="cyan" icon={<Lightbulb className="size-4" />} />
          <SummaryCard label="Total Insights" value={data.summary.total} color="emerald" icon={<Sparkles className="size-4" />} />
        </div>
      )}

      {/* Insights list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data?.insights.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="size-10 mx-auto mb-3 text-emerald-500" />
            <h3 className="text-sm font-semibold">No issues detected</h3>
            <p className="text-xs text-muted-foreground mt-1">
              All systems operating within normal parameters. AI analysis complete.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <InsightCard insight={insight} />
            </motion.div>
          ))}
        </div>
      )}

      {/* AI capabilities info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="size-4 text-emerald-600" />
            AI Capabilities
          </CardTitle>
          <CardDescription className="text-xs">What the AI engine analyzes for your community</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Resource Prediction', desc: 'Forecasts future stock needs based on consumption patterns and seasonal trends.', icon: <Package className="size-4" /> },
            { title: 'Inefficiency Detection', desc: 'Identifies bottlenecks in resource distribution and approval workflows.', icon: <TrendingDown className="size-4" /> },
            { title: 'Allocation Strategy', desc: 'Recommends better budget allocation across projects based on progress and impact.', icon: <Wallet className="size-4" /> },
            { title: 'Delay Detection', desc: 'Flags projects at risk of missing deadlines with milestone analysis.', icon: <Clock className="size-4" /> },
            { title: 'Feedback Analysis', desc: 'Processes community feedback to identify major themes and concerns.', icon: <Heart className="size-4" /> },
            { title: 'Funding Risk', desc: 'Monitors financial runway and recommends diversification strategies.', icon: <TrendingUp className="size-4" /> },
          ].map(cap => (
            <div key={cap.title} className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                  {cap.icon}
                </div>
                <div className="text-sm font-medium">{cap.title}</div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const colors = PRIORITY_COLORS[insight.priority] || PRIORITY_COLORS.medium
  const icon = TYPE_ICONS[insight.type] || <Lightbulb className="size-4" />

  return (
    <Card className={classNames('border-l-4', colors.border)} style={{ borderLeftColor: insight.priority === 'critical' ? '#ef4444' : insight.priority === 'high' ? '#f59e0b' : '#06b6d4' }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={classNames('flex size-9 items-center justify-center rounded-md flex-shrink-0', colors.bg, colors.text)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">{insight.title}</h4>
                <Badge variant="outline" className={classNames('text-[10px] capitalize', colors.bg, colors.text, colors.border)}>
                  {insight.priority}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {TYPE_LABELS[insight.type] || insight.type}
                </Badge>
              </div>
              {insight.metric && (
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{insight.metric}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
            <div className={classNames('rounded-md p-2.5 border', colors.bg, colors.border)}>
              <div className="flex items-start gap-2">
                <Lightbulb className={classNames('size-3.5 mt-0.5 flex-shrink-0', colors.text)} />
                <div>
                  <div className={classNames('text-[10px] uppercase tracking-wide font-semibold', colors.text)}>Recommendation</div>
                  <p className="text-xs mt-0.5 text-foreground">{insight.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryCard({
  label, value, color, icon,
}: {
  label: string
  value: number
  color: 'red' | 'amber' | 'cyan' | 'emerald'
  icon: React.ReactNode
}) {
  const colorMap = {
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={classNames('flex size-8 items-center justify-center rounded-md', colorMap[color])}>
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold leading-tight">{value}</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
