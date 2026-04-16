'use client'
import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Film, Image as ImageIcon, FileText, Music, File, FolderOpen, Radio, Archive, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileRecord {
  id: string; name: string; path: string; ext: string; category: string;
  size: number; detectedAt: string; status: string; youtubeId?: string
}

const CAT_ICON: Record<string, any> = { video: Film, image: ImageIcon, srt: FileText, audio: Music, document: File, other: FolderOpen }
const STATUS_VAR: Record<string, any> = { new: 'info', reviewed: 'ghost', archived: 'ghost', linked: 'online' }

function fmtSize(b: number) {
  if (b > 1e9) return (b / 1e9).toFixed(1) + ' GB'
  if (b > 1e6) return (b / 1e6).toFixed(1) + ' MB'
  if (b > 1e3) return (b / 1e3).toFixed(1) + ' KB'
  return b + ' B'
}

const FILTERS = ['new', 'reviewed', 'linked', 'archived', 'all'] as const

export default function InboxPage() {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [filter, setFilter] = useState<string>('new')
  const [live, setLive] = useState<string[]>([])
  const esRef = useRef<EventSource | null>(null)

  const loadFiles = (s?: string) =>
    fetch(`/api/inbox${s && s !== 'all' ? `?status=${s}` : ''}`).then(r => r.json()).then(d => setFiles(d.files || []))

  useEffect(() => { loadFiles(filter) }, [filter])

  useEffect(() => {
    const es = new EventSource('/api/inbox/events')
    esRef.current = es
    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data)
        if (ev.type === 'add') {
          setLive(prev => [`⤓ ${ev.name}`, ...prev].slice(0, 5))
          loadFiles(filter)
        }
      } catch {}
    }
    return () => es.close()
  }, [filter])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/inbox', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    loadFiles(filter)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-amber mb-1">
            ── Ingestion · Watcher · Auto-categorize
          </div>
          <h1 className="text-2xl font-mono font-semibold">File Inbox</h1>
        </div>
        <Badge variant="online">
          <span className="size-1.5 rounded-full bg-emerald-400 liveness-dot" />
          Watcher Live
        </Badge>
      </div>

      {/* Live arrivals ticker */}
      {live.length > 0 && (
        <Card className="border-lcars-blue/40">
          <CardContent className="py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-blue mb-1">
              Recent Arrivals
            </div>
            <div className="space-y-0.5">
              {live.map((e, i) => (
                <div key={i} className="text-xs text-muted-foreground font-mono truncate">{e}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter pills */}
      <div className="flex gap-1.5">
        {FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md border transition',
              filter === s
                ? 'border-lcars-amber/60 bg-lcars-amber/10 text-lcars-amber'
                : 'border-border/60 text-muted-foreground hover:text-foreground',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Files */}
      <div className="space-y-2">
        {files.map(f => {
          const Icon = CAT_ICON[f.category] || File
          return (
            <Card key={f.id} className="py-3">
              <CardContent className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-lcars-amber/10 flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-lcars-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate">{f.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{f.path}</div>
                  <div className="flex gap-3 mt-0.5 text-[10px] text-muted-foreground">
                    <span>{fmtSize(f.size)}</span>
                    <span>{new Date(f.detectedAt).toLocaleString()}</span>
                    {f.youtubeId && <span className="text-lcars-lavender">YT · {f.youtubeId}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VAR[f.status] || 'default'}>{f.status}</Badge>
                  {f.status === 'new' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(f.id, 'reviewed')}>
                        <Eye className="size-3" /> Review
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(f.id, 'archived')}>
                        <Archive className="size-3" />
                      </Button>
                    </>
                  )}
                  {f.category === 'srt' && (
                    <Button size="sm" variant="lcars" asChild>
                      <a href={`/api/srt?path=${encodeURIComponent(f.path)}`}>Clean</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {!files.length && (
          <Card>
            <CardContent className="py-16 text-center">
              <FolderOpen className="size-10 mx-auto text-muted-foreground mb-3" />
              <div className="text-sm text-muted-foreground">No {filter === 'all' ? '' : filter} files.</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-2">
                Watcher monitors Downloads · Videos · Pictures · Desktop
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
