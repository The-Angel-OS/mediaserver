'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Globe, Volume2, VolumeX, Pause, Play,
  BookOpen, Maximize2, Minimize2, List, X, Heart, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookMeta {
  slug: string; title: string; author?: string; description?: string
  coverUrl?: string; languages: string[]; chapterCount: number
  chapterTitles?: string[]
  accessType: 'free' | 'donation' | 'membership'; donationAmount?: number
}

const LANG_NAMES: Record<string, string> = {
  en:'English', es:'Español', fr:'Français', de:'Deutsch', it:'Italiano',
  pt:'Português', pl:'Polski', ar:'العربية', he:'עברית', hi:'हिन्दी',
  ur:'اردو', ja:'日本語', ru:'Русский', ko:'한국어', zh:'中文', nl:'Nederlands', sv:'Svenska',
}

const RTL_LANGS = new Set(['ar', 'he', 'ur'])

// ─── TTS Hook ─────────────────────────────────────────────────────────────────
// Uses Web Speech API — works offline, built into every browser

function useTTS(text: string, lang: string) {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis
    return () => { synthRef.current?.cancel() }
  }, [])

  // Stop when text changes
  useEffect(() => { synthRef.current?.cancel(); setSpeaking(false); setPaused(false) }, [text])

  const speak = useCallback(() => {
    const synth = synthRef.current
    if (!synth || !text) return
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = 0.95
    utter.onstart = () => { setSpeaking(true); setPaused(false) }
    utter.onend = () => { setSpeaking(false); setPaused(false) }
    utter.onerror = () => { setSpeaking(false); setPaused(false) }
    synth.speak(utter)
  }, [text, lang])

  const pause = useCallback(() => {
    synthRef.current?.pause(); setPaused(true)
  }, [])

  const resume = useCallback(() => {
    synthRef.current?.resume(); setPaused(false)
  }, [])

  const stop = useCallback(() => {
    synthRef.current?.cancel(); setSpeaking(false); setPaused(false)
  }, [])

  return { speaking, paused, speak, pause, resume, stop, supported: typeof window !== 'undefined' && 'speechSynthesis' in window }
}

// ─── Chapter Parser ───────────────────────────────────────────────────────────

function parseChapter(raw: string) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const heading = lines[0] || ''
  const body = lines.slice(1).join('\n\n')
  return { heading, body, plain: raw }
}

// ─── Main Reader ──────────────────────────────────────────────────────────────

export default function BookReaderPage() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [lang, setLang] = useState(searchParams.get('lang') || 'en')
  const [chapter, setChapter] = useState(parseInt(searchParams.get('ch') || '1', 10))
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [allChapters, setAllChapters] = useState<string[]>([])
  const [showTOC, setShowTOC] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(16)

  const tts = useTTS(content, lang)
  const isRTL = RTL_LANGS.has(lang)

  // Load book metadata
  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json())
      .then(d => {
        const book = (d.books || []).find((b: BookMeta) => b.slug === slug)
        if (book) setMeta(book)
      })
      .catch(() => {})
  }, [slug])

  // Load chapter content
  useEffect(() => {
    setLoading(true)
    fetch(`/api/books/${slug}?lang=${lang}&chapter=${chapter}`)
      .then(r => r.json())
      .then(d => {
        if (d.content !== undefined) setContent(d.content)
        if (meta && d.total) setMeta(m => m ? { ...m, chapterCount: d.total } : m)
      })
      .catch(() => setContent(''))
      .finally(() => setLoading(false))
  }, [slug, lang, chapter, meta])

  // Preload all chapters for offline cache when first loaded
  useEffect(() => {
    if (allChapters.length > 0) return
    fetch(`/api/books/${slug}?lang=${lang}`)
      .then(r => r.json())
      .then(d => { if (d.chapters) setAllChapters(d.chapters) })
      .catch(() => {})
  }, [slug, lang, allChapters.length])

  const chapterCount = meta?.chapterCount || allChapters.length || 0
  const { heading, body } = parseChapter(content)

  const navigate = (dir: -1 | 1) => {
    const next = chapter + dir
    if (next < 1 || next > chapterCount) return
    tts.stop()
    setChapter(next)
  }

  const changeLang = (l: string) => {
    tts.stop()
    setLang(l)
    setAllChapters([]) // re-cache for new lang
  }

  return (
    <div className={`${fullscreen ? 'fixed inset-0 z-50 bg-background overflow-auto' : ''} space-y-4`}>
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push('/book')}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="size-3.5" /> Library
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-blue mb-0.5">
            ── {meta?.title || slug} · Chapter {chapter} of {chapterCount || '?'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Language picker */}
          {meta && meta.languages.length > 1 && (
            <div className="relative">
              <select
                value={lang}
                onChange={e => changeLang(e.target.value)}
                className="h-7 rounded-md border border-border/60 bg-background px-2 text-[10px] font-mono appearance-none pr-5"
              >
                {meta.languages.map(l => (
                  <option key={l} value={l}>{LANG_NAMES[l] || l}</option>
                ))}
              </select>
              <Globe className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Font size */}
          <div className="flex items-center border border-border/60 rounded-md overflow-hidden">
            <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="px-2 py-1 text-[10px] hover:bg-accent/40 transition">A-</button>
            <button onClick={() => setFontSize(f => Math.min(28, f + 2))} className="px-2 py-1 text-[10px] hover:bg-accent/40 transition">A+</button>
          </div>

          {/* TTS */}
          {tts.supported && content && (
            <div className="flex items-center gap-1">
              {!tts.speaking ? (
                <button
                  onClick={tts.speak}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-lcars-blue/40 bg-lcars-blue/10 text-lcars-blue text-[10px] font-mono uppercase tracking-wider hover:bg-lcars-blue/20 transition"
                >
                  <Volume2 className="size-3" /> Read Aloud
                </button>
              ) : (
                <>
                  <button
                    onClick={tts.paused ? tts.resume : tts.pause}
                    className="p-1.5 rounded-md border border-border/60 hover:bg-accent/40 transition text-muted-foreground"
                  >
                    {tts.paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  </button>
                  <button
                    onClick={tts.stop}
                    className="p-1.5 rounded-md border border-border/60 hover:bg-accent/40 transition text-muted-foreground"
                  >
                    <VolumeX className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* TOC */}
          <button
            onClick={() => setShowTOC(v => !v)}
            className={`p-1.5 rounded-md border transition ${showTOC ? 'border-lcars-amber/60 bg-lcars-amber/10 text-lcars-amber' : 'border-border/60 text-muted-foreground hover:text-foreground'}`}
          >
            <List className="size-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setFullscreen(v => !v)}
            className="p-1.5 rounded-md border border-border/60 text-muted-foreground hover:text-foreground transition"
          >
            {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${showTOC ? 'grid-cols-[200px_1fr]' : 'grid-cols-1'}`}>
        {/* TOC sidebar */}
        {showTOC && (
          <Card className="p-0 overflow-hidden max-h-[70vh] sticky top-4">
            <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-lcars-amber">Contents</span>
              <button onClick={() => setShowTOC(false)}><X className="size-3.5 text-muted-foreground" /></button>
            </div>
            <div className="overflow-y-auto">
              {Array.from({ length: chapterCount || 26 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setChapter(i + 1); setShowTOC(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs border-l-2 transition ${
                    chapter === i + 1
                      ? 'border-lcars-amber text-foreground bg-lcars-amber/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {meta?.chapterTitles?.[i] || `Chapter ${i + 1}`}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Reading pane */}
        <div>
          <Card className="p-6 md:p-10 min-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
                <BookOpen className="size-5 animate-pulse mr-2 text-lcars-blue" />
                Loading chapter {chapter}...
              </div>
            ) : !content ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                <p>No content found. Check that book files exist in <code>public/books/{slug}/{lang}/</code></p>
              </div>
            ) : (
              <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6" style={{ fontSize }}>
                {heading && (
                  <h2 className="font-mono font-semibold text-lcars-amber border-b border-lcars-amber/20 pb-3">
                    {heading}
                  </h2>
                )}
                {body.split('\n\n').map((para, i) => (
                  <p key={i} className="leading-relaxed text-foreground/90">{para}</p>
                ))}
              </div>
            )}
          </Card>

          {/* Chapter navigation */}
          <div className="flex items-center justify-between mt-4 px-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              disabled={chapter <= 1}
              className="gap-1.5 font-mono text-[10px] uppercase tracking-wider"
            >
              <ChevronLeft className="size-3.5" /> Prev
            </Button>

            <span className="text-[10px] font-mono text-muted-foreground">
              {chapter} / {chapterCount || '?'}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(1)}
              disabled={chapterCount > 0 && chapter >= chapterCount}
              className="gap-1.5 font-mono text-[10px] uppercase tracking-wider"
            >
              Next <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Donation wall overlay */}
      {meta?.accessType === 'donation' && chapter > 3 && (
        <Card className="p-6 border-lcars-amber/30 bg-lcars-amber/5">
          <div className="flex items-start gap-4">
            <Heart className="size-6 text-lcars-amber shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-mono font-medium text-lcars-amber">Enjoying this book?</div>
              <p className="text-xs text-muted-foreground mt-1">
                A small donation keeps this content free for everyone.
                {meta.donationAmount && ` Suggested: $${(meta.donationAmount / 100).toFixed(0)}`}
              </p>
            </div>
            <Button size="sm" className="h-7 bg-lcars-amber text-black hover:bg-lcars-amber/90 shrink-0 font-mono text-[10px]">
              <Heart className="size-3" /> Donate
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
