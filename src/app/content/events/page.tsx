'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CalendarDays, Search, Radio, ExternalLink, RefreshCw, MapPin } from 'lucide-react'

interface Event {
  id: string | number
  title: string
  slug?: string
  startDate?: string
  endDate?: string
  location?: string
  _status?: string
  tenant?: { name: string } | null
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [source, setSource] = useState<'live' | 'cache' | 'empty'>('empty')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/payload/events?limit=100&depth=1&sort=-startDate')
      .then(r => r.json())
      .then(res => { setSource(res.source || 'empty'); setEvents(res?.data?.docs || []) })
      .catch(() => setSource('empty'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search ? events.filter(e => e.title?.toLowerCase().includes(search.toLowerCase())) : events

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-lavender mb-1">── Content · Events</div>
          <h1 className="text-2xl font-mono font-semibold">Events</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{events.length} events</p>
        </div>
        <Badge variant={source === 'live' ? 'online' : source === 'cache' ? 'warning' : 'offline'} className="text-[10px]">
          <Radio className="size-2.5" />{source === 'live' ? 'Live' : source === 'cache' ? 'Cached' : 'Offline'}
        </Badge>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="pl-8 h-8 text-xs" />
      </div>
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground"><RefreshCw className="size-5 mx-auto mb-2 animate-spin text-lcars-lavender" />Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="py-12"><div className="text-center text-xs text-muted-foreground space-y-2"><CalendarDays className="size-8 mx-auto opacity-30" /><div>{source === 'empty' ? 'Configure API in Keys.' : 'No events.'}</div></div></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(ev => (
            <div key={ev.id} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border/60 bg-card/60 hover:border-lcars-lavender/40 transition-all">
              <CalendarDays className="size-4 text-lcars-lavender shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{ev.title}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  {ev.startDate && <span className="text-[10px] text-muted-foreground">{new Date(ev.startDate).toLocaleDateString()}</span>}
                  {ev.location && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="size-2.5" />{ev.location}</span>}
                  {ev.tenant && <span className="text-[10px] text-muted-foreground">{ev.tenant.name}</span>}
                </div>
              </div>
              {ev._status && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border text-muted-foreground">{ev._status}</span>}
              <a href={`${process.env.NEXT_PUBLIC_ANGELS_URL || 'https://www.spacesangels.com'}/admin/collections/events/${ev.id}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent/50 text-muted-foreground transition"><ExternalLink className="size-3.5" /></a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
