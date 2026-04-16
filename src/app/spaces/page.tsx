'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Hash, Users, Mic, MicOff, Video, VideoOff, Send, Search, Radio, Phone, PhoneOff, Settings2, Loader2 } from 'lucide-react'

interface Space { id: string; name: string; slug: string; description?: string }
interface Message { id: string; role: 'user' | 'other'; author: string; text: string; ts: number }

// LiveKit room state
type RoomState = 'idle' | 'connecting' | 'connected' | 'error'

function LiveKitRoom({
  space,
  onLeave,
}: {
  space: Space
  onLeave: () => void
}) {
  const [state, setState] = useState<RoomState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [participants, setParticipants] = useState<string[]>(['You'])
  const [userName, setUserName] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('jarvis-username') || 'Captain') : 'Captain',
  )

  const joinRoom = useCallback(async () => {
    setState('connecting')
    setError(null)
    try {
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: space.slug, participantName: userName }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Dynamic import — livekit-client may not be installed yet
      const { Room, RoomEvent } = await import('livekit-client').catch(() => {
        throw new Error('livekit-client not installed. Run: pnpm add livekit-client in mediaserver/')
      })

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      room.on(RoomEvent.ParticipantConnected, p => {
        setParticipants(prev => [...prev, p.identity])
      })
      room.on(RoomEvent.ParticipantDisconnected, p => {
        setParticipants(prev => prev.filter(x => x !== p.identity))
      })
      room.on(RoomEvent.Disconnected, () => setState('idle'))

      await room.connect(data.serverUrl, data.token)
      setState('connected')

      // @ts-ignore — attach to window for cleanup
      window.__livekitRoom = room
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setState('error')
    }
  }, [space.slug, userName])

  const leaveRoom = useCallback(() => {
    // @ts-ignore
    window.__livekitRoom?.disconnect()
    // @ts-ignore
    window.__livekitRoom = null
    setState('idle')
    onLeave()
  }, [onLeave])

  if (state === 'idle') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-center space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-purple">LiveKit Voice / Video</div>
          <div className="text-sm font-medium">Join #{space.name}</div>
          <p className="text-xs text-muted-foreground max-w-xs">
            Real-time voice and video powered by LiveKit. Configure server in Keys → LiveKit.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={userName}
            onChange={e => {
              setUserName(e.target.value)
              localStorage.setItem('jarvis-username', e.target.value)
            }}
            placeholder="Your name"
            className="h-8 text-xs w-40"
          />
          <Button size="sm" className="h-8 bg-lcars-purple text-white hover:bg-lcars-purple/90 font-mono uppercase tracking-wider text-[10px]" onClick={joinRoom}>
            <Phone className="size-3.5" /> Join Room
          </Button>
        </div>
      </div>
    )
  }

  if (state === 'connecting') {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-lcars-purple" />
        Connecting to LiveKit room...
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
        <div className="text-center space-y-1">
          <div className="text-xs text-lcars-red font-mono">Connection Failed</div>
          <p className="text-[10px] text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setState('idle')}>Retry</Button>
      </div>
    )
  }

  // Connected
  return (
    <div className="flex-1 flex flex-col">
      {/* Participant grid */}
      <div className="flex-1 p-3 grid grid-cols-2 md:grid-cols-3 gap-2 auto-rows-[120px]">
        {participants.map(p => (
          <div key={p} className="rounded-lg bg-black/50 border border-lcars-purple/30 flex flex-col items-center justify-center gap-1">
            <div className="size-10 rounded-full bg-lcars-purple/20 flex items-center justify-center text-sm font-mono uppercase">
              {p[0]}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">{p}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="border-t border-border/60 px-4 py-2 flex items-center justify-center gap-3">
        <button
          onClick={() => setMicOn(m => !m)}
          className={`p-2.5 rounded-full border transition ${micOn ? 'bg-lcars-purple/20 border-lcars-purple text-lcars-purple' : 'border-border text-muted-foreground hover:text-foreground'}`}
        >
          {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
        </button>
        <button
          onClick={() => setCamOn(c => !c)}
          className={`p-2.5 rounded-full border transition ${camOn ? 'bg-lcars-blue/20 border-lcars-blue text-lcars-blue' : 'border-border text-muted-foreground hover:text-foreground'}`}
        >
          {camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
        </button>
        <button
          onClick={leaveRoom}
          className="p-2.5 rounded-full bg-lcars-red/20 border border-lcars-red text-lcars-red hover:bg-lcars-red/30 transition"
        >
          <PhoneOff className="size-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [source, setSource] = useState<'live' | 'cache' | 'empty'>('empty')
  const [cachedAt, setCachedAt] = useState<string | undefined>()
  const [selected, setSelected] = useState<Space | null>(null)
  const [search, setSearch] = useState('')
  const [inRoom, setInRoom] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [tab, setTab] = useState<'chat' | 'voice'>('chat')

  useEffect(() => {
    fetch('/api/payload/spaces?limit=50&depth=1')
      .then(r => r.json())
      .then(res => {
        setSource(res.source)
        setCachedAt(res.cachedAt)
        const docs = res?.data?.docs || []
        setSpaces(docs)
        if (docs[0]) setSelected(docs[0])
      })
      .catch(() => setSource('empty'))
  }, [])

  const sendMessage = () => {
    if (!draft.trim()) return
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      author: localStorage.getItem('jarvis-username') || 'Captain',
      text: draft.trim(),
      ts: Date.now(),
    }])
    setDraft('')
    // TODO: POST to /api/payload/messages to persist to Angel OS
  }

  const filtered = search ? spaces.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : spaces

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-purple mb-1">── Spaces · Channels · Voice</div>
          <h1 className="text-2xl font-mono font-semibold">Spaces</h1>
        </div>
        <Badge variant={source === 'live' ? 'online' : source === 'cache' ? 'warning' : 'offline'}>
          <Radio className="size-2.5" />
          {source === 'live' ? 'Live' : source === 'cache' ? `Cached` : 'No connection'}
        </Badge>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Space list */}
        <Card className="col-span-12 md:col-span-3 p-0 gap-0 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-6 h-7 text-xs" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelected(s); setInRoom(false); setMessages([]) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left border-l-2 transition text-xs ${
                  selected?.id === s.id
                    ? 'border-lcars-purple bg-lcars-purple/5 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/30'
                }`}
              >
                <Hash className="size-3 shrink-0" />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                {source === 'empty' ? 'Connect to Angel OS in Keys.' : 'No spaces match.'}
              </div>
            )}
          </div>
        </Card>

        {/* Main area */}
        <Card className="col-span-12 md:col-span-6 p-0 gap-0 overflow-hidden flex flex-col">
          {selected ? (
            <>
              {/* Header + tabs */}
              <div className="px-4 py-2 border-b border-border/60 flex items-center gap-2">
                <Hash className="size-4 text-lcars-purple" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{selected.name}</div>
                  {selected.description && <div className="text-[10px] text-muted-foreground">{selected.description}</div>}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTab('chat')}
                    className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition ${tab === 'chat' ? 'bg-lcars-purple/20 text-lcars-purple' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setTab('voice')}
                    className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition ${tab === 'voice' ? 'bg-lcars-purple/20 text-lcars-purple' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Voice
                  </button>
                </div>
              </div>

              {tab === 'voice' ? (
                <LiveKitRoom space={selected} onLeave={() => { setInRoom(false); setTab('chat') }} />
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/40">
                          <Radio className="size-3 text-lcars-purple" />
                          #{selected.name} · Messages sync from Angel OS
                        </div>
                      </div>
                    )}
                    {messages.map(m => (
                      <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-lg text-xs ${m.role === 'user' ? 'bg-lcars-purple/20 text-foreground rounded-br-sm' : 'bg-card/60 border border-border/60 rounded-bl-sm'}`}>
                          <div className="text-[9px] font-mono text-muted-foreground mb-0.5">{m.author}</div>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-3 py-2 border-t border-border/60">
                    <div className="flex gap-2">
                      <Input
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={`Message #${selected.name}`}
                        className="flex-1 h-9 text-xs"
                      />
                      <Button size="icon" className="h-9 w-9" onClick={sendMessage}>
                        <Send className="size-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Select a space to begin.
            </div>
          )}
        </Card>

        {/* Crew panel */}
        <Card className="col-span-12 md:col-span-3 p-0 gap-0 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/60 flex items-center gap-2">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Crew</span>
          </div>
          <div className="p-3 text-xs text-muted-foreground">
            <p className="text-center py-4 text-[10px]">
              Member presence streams from mothership when connected. Join a voice room to see live participants.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
