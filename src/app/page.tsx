'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity, Radio, FileText, Youtube, MessageSquareText, Inbox,
  AlertTriangle, Cpu, HardDrive, Wifi, ArrowRight, Sparkles,
} from 'lucide-react'

interface SystemData {
  system: { uptime: number; hostname: string; localIp: string; memory: { used: number; total: number } }
  angels: { online: boolean; responseMs: number | null; lastChecked: string | null }
  incidents: { open: number; total: number }
  inbox: { new: number; total: number }
  log: Array<{ id: string; timestamp: string; type: string; source: string; message: string }>
}

function fmtUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

function StatCard({ label, value, sub, icon: Icon, accent = '#f5a623', href }: {
  label: string; value: string | number; sub?: string; icon: any; accent?: string; href?: string
}) {
  const Inner = (
    <div className="relative lcars-fade-up flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 hover:border-lcars-amber/40 transition-all">
      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ background: accent }} />
      <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}15`, color: accent }}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-2xl font-mono tabular-nums font-semibold text-foreground leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  )
  return href ? <Link href={href}>{Inner}</Link> : Inner
}

const QUICK_LINKS = [
  { label: 'SpacesAngels', url: 'https://www.spacesangels.com', external: true },
  { label: 'YouTube Studio', url: 'https://studio.youtube.com', external: true },
  { label: 'Answer 53', url: 'https://answer53.vercel.app', external: true },
  { label: 'Soul Cast', url: 'https://soulcast.fm', external: true },
  { label: 'CCM YouTube', url: 'https://www.youtube.com/@ClearwaterCruisinMinistries', external: true },
  { label: 'GitHub', url: 'https://github.com/The-Angel-OS/angels-os', external: true },
]

const TYPE_DOT: Record<string, string> = {
  incident: 'bg-red-400', error: 'bg-red-400',
  angels: 'bg-emerald-400', file_arrived: 'bg-blue-400',
  youtube_update: 'bg-lcars-lavender', system: 'bg-muted-foreground',
  info: 'bg-lcars-blue', api_call: 'bg-amber-400',
}

export default function BridgePage() {
  const [data, setData] = useState<SystemData | null>(null)

  useEffect(() => {
    const load = () => fetch('/api/system').then(r => r.json()).then(setData).catch(() => {})
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [])

  const memPct = data ? Math.round((data.system.memory.used / data.system.memory.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-amber mb-1">
            ── Bridge Console · Stardate {new Date().toISOString().slice(0, 10)}
          </div>
          <h1 className="text-3xl font-mono font-semibold tracking-tight">Welcome back, Captain.</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All systems operating within normal parameters. Ad Astra.
          </p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Angels Bridge"
          value={data?.angels.online ? 'ONLINE' : data?.angels ? 'OFFLINE' : '···'}
          sub={data?.angels.responseMs !== null ? `${data?.angels.responseMs}ms` : 'Fallback: cache'}
          icon={Radio}
          accent={data?.angels.online ? '#22cc88' : '#f5a623'}
        />
        <StatCard
          label="Incidents"
          value={data?.incidents.open ?? 0}
          sub={`${data?.incidents.total ?? 0} total`}
          icon={AlertTriangle}
          accent={data?.incidents.open ? '#cc4444' : '#22cc88'}
        />
        <StatCard
          label="Inbox New"
          value={data?.inbox.new ?? 0}
          sub={`${data?.inbox.total ?? 0} in registry`}
          icon={Inbox}
          accent="#99ccff"
          href="/inbox"
        />
        <StatCard
          label="Uptime"
          value={data ? fmtUptime(data.system.uptime) : '···'}
          sub={data?.system.hostname}
          icon={Activity}
          accent="#cc99cc"
        />
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Officer Log · Recent Activity</CardTitle>
              <Link href="/log" className="text-[10px] font-mono uppercase text-lcars-amber/80 hover:text-lcars-amber flex items-center gap-1">
                Full Log <ArrowRight className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data?.log?.slice(0, 8).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0 text-xs">
                  <div className={`size-1.5 rounded-full shrink-0 ${TYPE_DOT[entry.type] || 'bg-muted-foreground'}`} />
                  <span className="text-muted-foreground font-mono shrink-0 w-20">
                    {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-lcars-amber/70 shrink-0 w-24 truncate">
                    {entry.type}
                  </span>
                  <span className="text-foreground/90 truncate flex-1">{entry.message}</span>
                </div>
              ))}
              {!data?.log?.length && (
                <div className="text-center py-8 text-xs text-muted-foreground">No log entries yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-mono uppercase text-muted-foreground mb-1">
                <span className="flex items-center gap-1"><Cpu className="size-3" /> Memory</span>
                <span>{memPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${memPct}%`,
                    background: memPct > 80 ? '#cc4444' : memPct > 60 ? '#f5a623' : '#22cc88',
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5"><Wifi className="size-3" /> Local IP</span>
              <span className="font-mono text-foreground">{data?.system.localIp || '···'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5"><HardDrive className="size-3" /> Host</span>
              <span className="font-mono text-foreground truncate max-w-[140px]">{data?.system.hostname || '···'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access · Consoles</CardTitle>
          <CardDescription>Jump to Angel OS and supporting systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {QUICK_LINKS.map(q => (
              <a
                key={q.label}
                href={q.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/60 bg-card/40 hover:bg-accent/50 hover:border-lcars-amber/40 transition text-xs font-mono"
              >
                <span className="text-foreground">{q.label}</span>
                <ArrowRight className="size-3 text-muted-foreground group-hover:text-lcars-amber transition" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
