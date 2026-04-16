'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Radio, ExternalLink, RefreshCw, Users } from 'lucide-react'

interface SpaceRecord {
  id: string | number
  name: string
  slug?: string
  _status?: string
  capacity?: number
  type?: string
  tenant?: { name: string } | null
}

export default function SpacesManagerPage() {
  const [spaces, setSpaces] = useState<SpaceRecord[]>([])
  const [source, setSource] = useState<'live' | 'cache' | 'empty'>('empty')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/payload/spaces?limit=100&depth=1&sort=name')
      .then(r => r.json())
      .then(res => { setSource(res.source || 'empty'); setSpaces(res?.data?.docs || []) })
      .catch(() => setSource('empty'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search ? spaces.filter(s => s.name?.toLowerCase().includes(search.toLowerCase())) : spaces

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-green mb-1">── Commerce · Spaces Manager</div>
          <h1 className="text-2xl font-mono font-semibold">Spaces</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{spaces.length} bookable spaces</p>
        </div>
        <Badge variant={source === 'live' ? 'online' : source === 'cache' ? 'warning' : 'offline'} className="text-[10px]">
          <Radio className="size-2.5" />{source === 'live' ? 'Live' : source === 'cache' ? 'Cached' : 'Offline'}
        </Badge>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spaces..." className="pl-8 h-8 text-xs" />
      </div>
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground"><RefreshCw className="size-5 mx-auto mb-2 animate-spin text-lcars-green" />Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(s => (
            <div key={s.id} className="p-4 rounded-xl border border-border/60 bg-card/60 hover:border-lcars-green/40 transition-all space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  {s.type && <div className="text-[10px] text-muted-foreground capitalize">{s.type}</div>}
                </div>
                {s.capacity && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <Users className="size-3" />{s.capacity}
                  </div>
                )}
              </div>
              {s.tenant && <div className="text-[10px] text-muted-foreground">{s.tenant.name}</div>}
              <div className="flex items-center justify-between">
                {s._status && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border text-muted-foreground">{s._status}</span>}
                <a href={`${process.env.NEXT_PUBLIC_ANGELS_URL || 'https://www.spacesangels.com'}/admin/collections/spaces/${s.id}`} target="_blank" rel="noopener noreferrer" className="ml-auto p-1 rounded hover:bg-accent/50 text-muted-foreground transition"><ExternalLink className="size-3.5" /></a>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <Card className="col-span-full py-12"><div className="text-center text-xs text-muted-foreground"><MapPin className="size-8 mx-auto mb-2 opacity-30" />{source === 'empty' ? 'Configure API in Keys.' : 'No spaces found.'}</div></Card>
          )}
        </div>
      )}
    </div>
  )
}
