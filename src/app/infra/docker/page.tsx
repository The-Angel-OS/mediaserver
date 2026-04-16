'use client'
import { useEffect, useState } from 'react'
import { Box, RefreshCw, Circle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Container {
  Id: string
  Names: string[]
  Image: string
  State: string
  Status: string
  Ports: Array<{ PublicPort?: number; PrivatePort: number; Type: string }>
}

export default function DockerPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetch('/api/infra/docker')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setContainers(d.containers || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const stateColor: Record<string, string> = {
    running: 'text-lcars-green',
    exited: 'text-lcars-red',
    paused: 'text-lcars-amber',
    restarting: 'text-lcars-blue',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-purple mb-1">── Infrastructure · Docker</div>
          <h1 className="text-2xl font-mono font-semibold">Docker Containers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Via Docker Engine API (localhost:2375)</p>
        </div>
        <Button variant="outline" size="sm" className="h-8" onClick={load} disabled={loading}>
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error ? (
        <Card className="p-4 border-lcars-red/30">
          <p className="text-xs text-lcars-red font-mono">{error}</p>
          <p className="text-[10px] text-muted-foreground mt-2">
            Ensure Docker Desktop is running with TCP API enabled:
            Settings → General → Expose daemon on tcp://localhost:2375
          </p>
        </Card>
      ) : loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="size-5 mx-auto mb-2 animate-spin text-lcars-purple" />Connecting to Docker...
        </div>
      ) : containers.length === 0 ? (
        <Card className="py-12"><div className="text-center text-xs text-muted-foreground"><Box className="size-8 mx-auto mb-2 opacity-30" />No containers found.</div></Card>
      ) : (
        <div className="space-y-2">
          {containers.map(c => (
            <div key={c.Id} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border/60 bg-card/60 hover:border-lcars-purple/40 transition-all">
              <Circle className={`size-2.5 shrink-0 fill-current ${stateColor[c.State] || 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate font-mono">{c.Names[0]?.replace(/^\//, '') || c.Id.slice(0, 12)}</div>
                <div className="text-[10px] text-muted-foreground truncate">{c.Image}</div>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground shrink-0">
                {c.Ports.filter(p => p.PublicPort).map(p => `${p.PublicPort}→${p.PrivatePort}`).join(', ') || '—'}
              </div>
              <span className={`text-[10px] font-mono shrink-0 ${stateColor[c.State] || 'text-muted-foreground'}`}>{c.State}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
