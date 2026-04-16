'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Package, Search, Radio, ExternalLink, RefreshCw, DollarSign } from 'lucide-react'

interface Order {
  id: string | number
  orderedBy?: { email?: string; name?: string } | null
  total?: number
  stripePaymentIntentID?: string
  createdAt?: string
  tenant?: { name: string } | null
  items?: Array<{ product?: { title: string }; price?: number; quantity?: number }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [source, setSource] = useState<'live' | 'cache' | 'empty'>('empty')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/payload/orders?limit=100&depth=1&sort=-createdAt')
      .then(r => r.json())
      .then(res => { setSource(res.source || 'empty'); setOrders(res?.data?.docs || []) })
      .catch(() => setSource('empty'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? orders.filter(o => JSON.stringify(o).toLowerCase().includes(search.toLowerCase()))
    : orders

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-amber mb-1">── Commerce · Orders</div>
          <h1 className="text-2xl font-mono font-semibold">Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{orders.length} orders</p>
        </div>
        <Badge variant={source === 'live' ? 'online' : source === 'cache' ? 'warning' : 'offline'} className="text-[10px]">
          <Radio className="size-2.5" />{source === 'live' ? 'Live' : source === 'cache' ? 'Cached' : 'Offline'}
        </Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="pl-8 h-8 text-xs" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground"><RefreshCw className="size-5 mx-auto mb-2 animate-spin text-lcars-amber" />Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="py-12"><div className="text-center text-xs text-muted-foreground space-y-2"><Package className="size-8 mx-auto opacity-30" /><div>{source === 'empty' ? 'Configure API in Keys.' : 'No orders.'}</div></div></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <div key={order.id} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border/60 bg-card/60 hover:border-lcars-amber/40 transition-all">
              <Package className="size-4 text-lcars-amber shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Order #{String(order.id).slice(-8)}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{order.orderedBy?.email || 'Guest'}</span>
                  {order.tenant && <span className="text-[10px] text-muted-foreground">{order.tenant.name}</span>}
                  {order.createdAt && <span className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              {order.total && (
                <span className="text-sm font-mono text-lcars-green">${(order.total / 100).toFixed(2)}</span>
              )}
              <a href={`${process.env.NEXT_PUBLIC_ANGELS_URL || 'https://www.spacesangels.com'}/admin/collections/orders/${order.id}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition">
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
