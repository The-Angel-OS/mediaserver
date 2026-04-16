'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Radio, ExternalLink, RefreshCw, Globe } from 'lucide-react'

interface Page {
  id: string | number
  title: string
  slug?: string
  _status?: string
  createdAt?: string
  tenant?: { name: string; slug: string; domain?: string } | null
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [source, setSource] = useState<'live' | 'cache' | 'empty'>('empty')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/payload/pages?limit=100&depth=1&sort=-createdAt')
      .then(r => r.json())
      .then(res => {
        setSource(res.source || 'empty')
        setPages(res?.data?.docs || [])
      })
      .catch(() => setSource('empty'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? pages.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    : pages

  const statusColor: Record<string, string> = {
    published: 'text-lcars-green border-lcars-green/40 bg-lcars-green/10',
    draft: 'text-lcars-amber border-lcars-amber/40 bg-lcars-amber/10',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-blue mb-1">
            ── Content · Site Pages
          </div>
          <h1 className="text-2xl font-mono font-semibold">Pages</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{pages.length} pages across all tenants</p>
        </div>
        <Badge variant={source === 'live' ? 'online' : source === 'cache' ? 'warning' : 'offline'} className="text-[10px]">
          <Radio className="size-2.5" />
          {source === 'live' ? 'Live' : source === 'cache' ? 'Cached' : 'Offline'}
        </Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..." className="pl-8 h-8 text-xs" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="size-5 mx-auto mb-2 animate-spin text-lcars-blue" />Loading...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12">
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <FileText className="size-8 mx-auto opacity-30" />
            <div>{source === 'empty' ? 'No connection to Angel OS. Configure API in Keys.' : 'No pages found.'}</div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(page => (
            <div
              key={page.id}
              className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border/60 bg-card/60 hover:border-lcars-blue/40 transition-all"
            >
              <FileText className="size-4 text-lcars-blue shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{page.title || '(Untitled)'}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  {page.slug && <span className="text-[10px] font-mono text-muted-foreground">/{page.slug}</span>}
                  {page.tenant && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Globe className="size-2.5" />
                      {page.tenant.domain || page.tenant.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {page._status && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${statusColor[page._status] || 'text-muted-foreground'}`}>
                    {page._status}
                  </span>
                )}
                <a
                  href={`${process.env.NEXT_PUBLIC_ANGELS_URL || 'https://www.spacesangels.com'}/admin/collections/pages/${page.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
