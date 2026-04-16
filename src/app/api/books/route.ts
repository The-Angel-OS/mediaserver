/**
 * Book library API
 * Sources books from:
 *   1. Angel OS `books` collection (via Payload proxy) when online
 *   2. Local public/books/ directory (offline / WDEG seed data)
 *
 * Expected local structure:
 *   public/books/{slug}/meta.json   — title, description, languages, chapters[]
 *   public/books/{slug}/{lang}/001.txt ... N.txt
 *   public/books/{slug}/cover.jpg   (optional)
 */
import { NextResponse } from 'next/server'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { getSettings } from '@/lib/store'

export interface BookMeta {
  id: string
  slug: string
  title: string
  description?: string
  author?: string
  coverUrl?: string
  languages: string[]   // ISO 639-1 codes
  chapterCount: number
  accessType: 'free' | 'donation' | 'membership'
  donationAmount?: number  // USD cents
  source: 'local' | 'angel-os'
}

function localBooks(): BookMeta[] {
  const booksDir = join(process.cwd(), 'public', 'books')
  if (!existsSync(booksDir)) return []

  return readdirSync(booksDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const metaPath = join(booksDir, d.name, 'meta.json')
      if (!existsSync(metaPath)) return null
      try {
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
        return {
          id: d.name,
          slug: d.name,
          source: 'local' as const,
          ...meta,
        }
      } catch {
        return null
      }
    })
    .filter(Boolean) as BookMeta[]
}

async function angelOsBooks(apiUrl: string, apiKey: string): Promise<BookMeta[]> {
  try {
    const resp = await fetch(`${apiUrl}/api/books?limit=50&depth=1`, {
      headers: { Authorization: `users API-Key ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!resp.ok) return []
    const data = await resp.json()
    return (data.docs || []).map((b: Record<string, unknown>) => ({
      id: String(b.id),
      slug: String(b.slug || b.id),
      title: String(b.title || ''),
      description: b.description ? String(b.description) : undefined,
      author: b.author ? String(b.author) : undefined,
      coverUrl: (b.coverImage as Record<string, unknown>)?.url
        ? String((b.coverImage as Record<string, unknown>).url)
        : undefined,
      languages: Array.isArray(b.languages) ? b.languages.map(String) : ['en'],
      chapterCount: typeof b.chapterCount === 'number' ? b.chapterCount : 0,
      accessType: (['free', 'donation', 'membership'].includes(String(b.accessType))
        ? b.accessType
        : 'free') as BookMeta['accessType'],
      donationAmount: typeof b.donationAmount === 'number' ? b.donationAmount : undefined,
      source: 'angel-os' as const,
    }))
  } catch {
    return []
  }
}

export async function GET() {
  const settings = getSettings()
  const [local, remote] = await Promise.all([
    Promise.resolve(localBooks()),
    angelOsBooks(settings.angelsApiUrl, settings.angelsApiKey),
  ])

  // Merge: Angel OS books win on slug collision
  const map = new Map<string, BookMeta>()
  for (const b of local) map.set(b.slug, b)
  for (const b of remote) map.set(b.slug, b)

  return NextResponse.json({ books: Array.from(map.values()) })
}
