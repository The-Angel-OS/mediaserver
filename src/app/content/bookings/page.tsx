'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CalendarDays, Search, Radio, ExternalLink, RefreshCw, Clock } from 'lucide-react'

interface Booking {
  id: string | number
  customerName?: string
  customerEmail?: string
  startTime?: string
  endTime?: string
  status?: string
  space?: { name?: string } | null
  tenant?: { name: string } | null
  createdAt?: string
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-lcars-green border-lcars-green/40',
  pending: 'text-lcars-amber border-lcars-amber/40',
  cancelled: 'text-lcars-red border-lcars-red/40',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [source, setSource] = useState<'live' | 'cache' | 'empty'>('empty')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/payload/bookings?limit=100&depth=1&sort=-createdAt')
      .then(r => r.json())
      .then(res => { setSource(res.source || 'empty'); setBookings(res?.data?.docs || []) })
      .catch(() => setSource('empty'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? bookings.filter(b => JSON.stringify(b).toLowerCase().includes(search.toLowerCase()))
    : bookings

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-amber mb-1">── Commerce · Bookings</div>
          <h1 className="text-2xl font-mono font-semibold">Bookings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{bookings.length} bookings</p>
        </div>
        <Badge variant={source === 'live' ? 'online' : source === 'cache' ? 'warning' : 'offline'} className="text-[10px]">
          <Radio className="size-2.5" />{source === 'live' ? 'Live' : source === 'cache' ? 'Cached' : 'Offline'}
        </Badge>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." className="pl-8 h-8 text-xs" />
      </div>
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground"><RefreshCw className="size-5 mx-auto mb-2 animate-spin text-lcars-amber" />Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="py-12"><div className="text-center text-xs text-muted-foreground space-y-2"><CalendarDays className="size-8 mx-auto opacity-30" /><div>{source === 'empty' ? 'Configure API in Keys.' : 'No bookings.'}</div></div></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <div key={b.id} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border/60 bg-card/60 hover:border-lcars-amber/40 transition-all">
              <CalendarDays className="size-4 text-lcars-amber shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{b.customerName || b.customerEmail || 'Guest'}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  {b.startTime && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {new Date(b.startTime).toLocaleString()}
                    </span>
                  )}
                  {b.space?.name && <span className="text-[10px] text-muted-foreground">{b.space.name}</span>}
                  {b.tenant && <span className="text-[10px] text-muted-foreground">{b.tenant.name}</span>}
                </div>
              </div>
              {b.status && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${STATUS_COLORS[b.status] || 'text-muted-foreground'}`}>{b.status}</span>
              )}
              <a href={`${process.env.NEXT_PUBLIC_ANGELS_URL || 'https://www.spacesangels.com'}/admin/collections/bookings/${b.id}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition">
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
