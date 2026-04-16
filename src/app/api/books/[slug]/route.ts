/**
 * Serves chapter content for a specific book + language.
 * GET /api/books/[slug]?lang=en&chapter=1
 * GET /api/books/[slug]?lang=es  (returns all chapters for caching)
 */
import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { getSettings } from '@/lib/store'

function zeroPad(n: number, len = 3) {
  return String(n).padStart(len, '0')
}

function localChapters(slug: string, lang: string): string[] {
  const dir = join(process.cwd(), 'public', 'books', slug, lang)
  const fallback = join(process.cwd(), 'public', 'books', slug, 'en')
  const base = existsSync(dir) ? dir : existsSync(fallback) ? fallback : null
  if (!base) return []

  return readdirSync(base)
    .filter(f => f.endsWith('.txt'))
    .sort()
    .map(f => {
      try { return readFileSync(join(base, f), 'utf-8') } catch { return '' }
    })
}

async function remoteChapters(
  apiUrl: string, apiKey: string, slug: string, lang: string,
): Promise<string[]> {
  try {
    const resp = await fetch(
      `${apiUrl}/api/books/${slug}/chapters?lang=${lang}&limit=100`,
      {
        headers: { Authorization: `users API-Key ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!resp.ok) return []
    const data = await resp.json()
    return (data.chapters || []).map((c: Record<string, unknown>) =>
      String(c.content || c.text || ''),
    )
  } catch {
    return []
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const lang = req.nextUrl.searchParams.get('lang') || 'en'
  const chapterNum = req.nextUrl.searchParams.get('chapter')

  const settings = getSettings()

  // Try local first (fast + offline), then remote
  let chapters = localChapters(slug, lang)
  if (chapters.length === 0) {
    chapters = await remoteChapters(settings.angelsApiUrl, settings.angelsApiKey, slug, lang)
  }

  if (chapters.length === 0) {
    return NextResponse.json({ error: 'Book not found or no content' }, { status: 404 })
  }

  if (chapterNum !== null) {
    const idx = parseInt(chapterNum, 10) - 1
    if (idx < 0 || idx >= chapters.length) {
      return NextResponse.json({ error: 'Chapter out of range' }, { status: 404 })
    }
    return NextResponse.json({ chapter: idx + 1, total: chapters.length, content: chapters[idx] })
  }

  return NextResponse.json({ total: chapters.length, chapters })
}
