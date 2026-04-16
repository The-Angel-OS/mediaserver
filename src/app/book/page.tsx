'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Lock, Heart, Globe, RefreshCw, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { BookMeta } from '@/app/api/books/route'

const LANG_NAMES: Record<string, string> = {
  en:'English', es:'Español', fr:'Français', de:'Deutsch', it:'Italiano',
  pt:'Português', pl:'Polski', ar:'العربية', he:'עברית', hi:'हिन्दी',
  ur:'اردو', ja:'日本語', ru:'Русский', ko:'한국어', zh:'中文', nl:'Nederlands', sv:'Svenska',
}

function AccessBadge({ type, amount }: { type: BookMeta['accessType']; amount?: number }) {
  if (type === 'free') return (
    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-lcars-green/10 text-lcars-green border border-lcars-green/30">Free</span>
  )
  if (type === 'donation') return (
    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-lcars-amber/10 text-lcars-amber border border-lcars-amber/30 flex items-center gap-1">
      <Heart className="size-2.5" />{amount ? `$${(amount / 100).toFixed(0)}+` : 'Donation'}
    </span>
  )
  return (
    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-lcars-purple/10 text-lcars-purple border border-lcars-purple/30 flex items-center gap-1">
      <Lock className="size-2.5" />Members
    </span>
  )
}

export default function BookLibraryPage() {
  const [books, setBooks] = useState<BookMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json())
      .then(d => setBooks(d.books || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-blue mb-1">── Library · Books</div>
        <h1 className="text-2xl font-mono font-semibold">Book Library</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Multilingual · Read-aloud · Offline-cached · Donation or free access
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="size-5 mx-auto mb-2 animate-spin text-lcars-blue" />Loading library...
        </div>
      ) : books.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-3">
            <BookOpen className="size-10 mx-auto text-muted-foreground/30" />
            <div className="text-sm font-mono text-muted-foreground">No books in library</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add books by placing them in <code className="bg-black/30 px-1 rounded">public/books/</code>{' '}
              or connecting to Angel OS with a books collection.
            </p>
            <div className="mt-4 text-[10px] font-mono text-muted-foreground border border-border/60 rounded p-3 bg-card/40 text-left max-w-sm mx-auto">
              <div className="text-lcars-amber mb-1">Quick start — WDEG:</div>
              <div>Copy <code>C:\Dev\wdeg\public\wdeg\</code> to</div>
              <div><code>public/books/wdeg/</code></div>
              <div>Add <code>public/books/wdeg/meta.json</code></div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map(book => (
            <Link
              key={book.slug}
              href={`/book/${book.slug}`}
              className="group flex flex-col rounded-xl border border-border/60 bg-card/60 hover:border-lcars-blue/40 hover:bg-card/80 transition-all overflow-hidden"
            >
              {/* Cover */}
              <div className="h-48 bg-gradient-to-br from-lcars-blue/10 to-lcars-purple/10 relative overflow-hidden">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="size-12 text-lcars-blue/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <AccessBadge type={book.accessType} amount={book.donationAmount} />
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div>
                  <div className="text-sm font-medium group-hover:text-lcars-blue transition-colors line-clamp-2">{book.title}</div>
                  {book.author && <div className="text-[10px] text-muted-foreground mt-0.5">{book.author}</div>}
                </div>
                {book.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{book.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Globe className="size-3" />
                    {book.languages.slice(0, 4).map(l => LANG_NAMES[l]?.slice(0, 3) || l).join(', ')}
                    {book.languages.length > 4 && ` +${book.languages.length - 4}`}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{book.chapterCount} ch.</div>
                </div>
              </div>

              <div className="px-4 py-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-lcars-blue">Read Now</span>
                <ChevronRight className="size-3.5 text-lcars-blue" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
