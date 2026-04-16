'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ShoppingBag, Search, Radio, ExternalLink, RefreshCw, Tag, DollarSign } from 'lucide-react'

interface Product {
  id: string | number
  title: string
  slug?: string
  _status?: string
  priceJSON?: string
  price?: number
  stripeProductID?: string
  tenant?: { name: string; slug: string } | null
  meta?: { image?: { url?: string } }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [source, setSource] = useState<'live' | 'cache' | 'empty'>('empty')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/payload/products?limit=100&depth=1&sort=-createdAt')
      .then(r => r.json())
      .then(res => {
        setSource(res.source || 'empty')
        setProducts(res?.data?.docs || [])
      })
      .catch(() => setSource('empty'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? products.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    : products

  const getPrice = (p: Product): string => {
    if (p.price !== undefined) return `$${(p.price / 100).toFixed(2)}`
    if (p.priceJSON) {
      try {
        const parsed = JSON.parse(p.priceJSON)
        const amt = parsed?.unit_amount || parsed?.price
        if (amt) return `$${(amt / 100).toFixed(2)}`
      } catch {}
    }
    return '—'
  }

  const statusColor: Record<string, string> = {
    published: 'text-lcars-green border-lcars-green/40 bg-lcars-green/10',
    draft: 'text-lcars-amber border-lcars-amber/40 bg-lcars-amber/10',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-green mb-1">
            ── Content · Products
          </div>
          <h1 className="text-2xl font-mono font-semibold">Products</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{products.length} products across all tenants</p>
        </div>
        <Badge variant={source === 'live' ? 'online' : source === 'cache' ? 'warning' : 'offline'} className="text-[10px]">
          <Radio className="size-2.5" />
          {source === 'live' ? 'Live' : source === 'cache' ? 'Cached' : 'Offline'}
        </Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-8 h-8 text-xs" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="size-5 mx-auto mb-2 animate-spin text-lcars-green" />Loading...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12">
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <ShoppingBag className="size-8 mx-auto opacity-30" />
            <div>{source === 'empty' ? 'No connection to Angel OS. Configure API in Keys.' : 'No products found.'}</div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(product => (
            <div
              key={product.id}
              className="flex flex-col gap-2 p-4 rounded-xl border border-border/60 bg-card/60 hover:border-lcars-green/40 transition-all"
            >
              {/* Thumbnail */}
              {product.meta?.image?.url ? (
                <img src={product.meta.image.url} alt={product.title} className="w-full h-32 object-cover rounded-md" />
              ) : (
                <div className="w-full h-32 rounded-md bg-muted/30 flex items-center justify-center">
                  <ShoppingBag className="size-8 text-muted-foreground/30" />
                </div>
              )}

              <div className="flex-1">
                <div className="text-sm font-medium truncate">{product.title || '(Untitled)'}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono text-lcars-green flex items-center gap-0.5">
                    <DollarSign className="size-3" />
                    {getPrice(product).replace('$', '')}
                  </span>
                  {product._status && (
                    <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${statusColor[product._status] || 'text-muted-foreground'}`}>
                      {product._status}
                    </span>
                  )}
                </div>
                {product.tenant && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{product.tenant.name}</div>
                )}
              </div>

              <a
                href={`${process.env.NEXT_PUBLIC_ANGELS_URL || 'https://www.spacesangels.com'}/admin/collections/products/${product.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground transition"
              >
                <ExternalLink className="size-3" /> Edit in Admin
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
