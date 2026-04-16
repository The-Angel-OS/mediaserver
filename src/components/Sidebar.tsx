'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Radio, FileText, ShoppingBag, Image, Package,
  Hash, Inbox, Sparkles, Youtube, Settings, Key, Activity,
  Camera, Film, Server, Box, Monitor, ChevronDown, ChevronRight,
  Wifi, WifiOff, BookOpen, CalendarDays, MapPin,
} from 'lucide-react'

interface Tenant { id: string; name: string; slug: string; domain?: string }

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  badge?: string | number
  external?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
  accent?: string
}

const NAV: NavSection[] = [
  {
    title: 'Bridge',
    accent: '#f5a623',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/cic', label: 'CIC', icon: Monitor },
      { href: '/log', label: 'Activity Log', icon: Activity },
    ],
  },
  {
    title: 'Content',
    accent: '#99ccff',
    items: [
      { href: '/content/pages', label: 'Pages', icon: FileText },
      { href: '/content/posts', label: 'Posts', icon: BookOpen },
      { href: '/content/products', label: 'Products', icon: ShoppingBag },
      { href: '/content/events', label: 'Events', icon: CalendarDays },
      { href: '/media', label: 'Media', icon: Image },
    ],
  },
  {
    title: 'Commerce',
    accent: '#22cc88',
    items: [
      { href: '/content/orders', label: 'Orders', icon: Package },
      { href: '/content/bookings', label: 'Bookings', icon: CalendarDays },
      { href: '/content/spaces-mgr', label: 'Spaces Mgr', icon: MapPin },
    ],
  },
  {
    title: 'Communication',
    accent: '#cc99cc',
    items: [
      { href: '/spaces', label: 'Spaces', icon: Hash },
      { href: '/inbox', label: 'Inbox', icon: Inbox },
      { href: '/leo', label: 'LEO — AI', icon: Sparkles },
    ],
  },
  {
    title: 'Surveillance',
    accent: '#cc4444',
    items: [
      { href: '/cameras', label: 'Cameras', icon: Camera },
      { href: '/recording', label: 'Recording', icon: Film },
    ],
  },
  {
    title: 'Infrastructure',
    accent: '#9977aa',
    items: [
      { href: '/infra/vmware', label: 'VMware', icon: Server },
      { href: '/infra/kubernetes', label: 'Kubernetes', icon: Box },
      { href: '/infra/docker', label: 'Docker', icon: Box },
    ],
  },
  {
    title: 'System',
    accent: '#7788aa',
    items: [
      { href: '/youtube', label: 'YouTube', icon: Youtube },
      { href: '/keys', label: 'Keys & Config', icon: Key },
    ],
  },
]

function NavLink({ item, accent }: { item: NavItem; accent?: string }) {
  const pathname = usePathname()
  const active = item.href === '/'
    ? pathname === '/'
    : pathname.startsWith(item.href)

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
      >
        <item.icon className="size-3.5 shrink-0" />
        <span className="truncate">{item.label}</span>
      </a>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors relative',
        active
          ? 'bg-lcars-amber/10 text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full"
          style={{ background: accent || '#f5a623' }}
        />
      )}
      <item.icon className={cn('size-3.5 shrink-0', active && 'text-lcars-amber')} />
      <span className="truncate">{item.label}</span>
      {item.badge !== undefined && (
        <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-lcars-amber/20 text-lcars-amber">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

function Section({ section, collapsed, onToggle }: {
  section: NavSection
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors"
        style={{ color: section.accent || '#7788aa' }}
      >
        <span
          className="inline-block size-1.5 rounded-full shrink-0"
          style={{ background: section.accent || '#7788aa' }}
        />
        <span className="flex-1 text-left">{section.title}</span>
        {collapsed
          ? <ChevronRight className="size-3 opacity-60" />
          : <ChevronDown className="size-3 opacity-60" />}
      </button>
      {!collapsed && (
        <div className="space-y-0.5">
          {section.items.map(item => (
            <NavLink key={item.href} item={item} accent={section.accent} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [online, setOnline] = useState<boolean | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/payload/tenants?limit=50')
      .then(r => r.json())
      .then(res => {
        const docs = res?.data?.docs || []
        setTenants(docs)
        const saved = localStorage.getItem('jarvis-tenant')
        const found = saved ? docs.find((t: Tenant) => t.slug === saved) : null
        setTenant(found || docs[0] || null)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const check = () =>
      fetch('/api/angels/status')
        .then(r => r.json())
        .then(d => setOnline(!!d.online))
        .catch(() => setOnline(false))
    check()
    const iv = setInterval(check, 30000)
    return () => clearInterval(iv)
  }, [])

  const pickTenant = (t: Tenant) => {
    setTenant(t)
    localStorage.setItem('jarvis-tenant', t.slug)
    setShowPicker(false)
  }

  const toggleSection = (title: string) =>
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }))

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 flex flex-col border-r border-border/60 bg-background/95 backdrop-blur-xl z-30 overflow-hidden">
      {/* Top LCARS stripe */}
      <div className="h-0.5 bg-gradient-to-r from-lcars-amber via-lcars-blue to-lcars-purple opacity-70 shrink-0" />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 shrink-0">
        <div className="size-7 rounded-md bg-gradient-to-br from-lcars-amber to-lcars-orange flex items-center justify-center shadow-sm shadow-lcars-amber/30 shrink-0">
          <span className="text-black font-bold text-sm">J</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono uppercase tracking-widest font-semibold text-foreground">JARVIS</div>
          <div className="text-[9px] font-mono text-muted-foreground truncate">Angel OS Node</div>
        </div>
        {/* Status dot */}
        {online === null ? (
          <div className="size-2 rounded-full bg-muted-foreground animate-pulse" />
        ) : online ? (
          <div className="size-2 rounded-full bg-lcars-green liveness-dot" title="Online" />
        ) : (
          <div className="size-2 rounded-full bg-lcars-amber" title="Offline" />
        )}
      </div>

      {/* Tenant picker */}
      <div className="px-3 py-2 border-b border-border/60 shrink-0 relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md border border-border/60 bg-card/40 hover:border-lcars-amber/40 transition text-left"
        >
          <Radio className="size-3 text-lcars-amber shrink-0" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate flex-1">
            {tenant?.name || 'Select Enterprise'}
          </span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        </button>
        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-lg border border-border bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
              <div className="px-3 py-1.5 border-b border-border/60 text-[9px] font-mono uppercase tracking-widest text-lcars-amber">
                Enterprise Registry
              </div>
              <div className="max-h-56 overflow-y-auto">
                {tenants.length === 0 ? (
                  <div className="px-3 py-3 text-[10px] text-muted-foreground text-center">
                    No tenants. Configure Angels API in Keys.
                  </div>
                ) : (
                  tenants.map(t => (
                    <button
                      key={t.id}
                      onClick={() => pickTenant(t)}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-xs hover:bg-accent/50 transition',
                        tenant?.id === t.id && 'bg-lcars-amber/10 text-lcars-amber',
                      )}
                    >
                      <div className="font-medium truncate">{t.name}</div>
                      {t.domain && (
                        <div className="text-[9px] text-muted-foreground font-mono">{t.domain}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-2 px-2 space-y-3">
        {NAV.map(section => (
          <Section
            key={section.title}
            section={section}
            collapsed={!!collapsed[section.title]}
            onToggle={() => toggleSection(section.title)}
          />
        ))}
      </nav>

      {/* Bottom: connection status */}
      <div className="shrink-0 border-t border-border/60 px-3 py-2">
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {online ? (
            <>
              <Wifi className="size-3 text-lcars-green" />
              <span className="text-lcars-green uppercase tracking-wider">Mothership Live</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3 text-lcars-amber" />
              <span className="text-lcars-amber uppercase tracking-wider">Local Cache</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom LCARS stripe */}
      <div className="h-0.5 bg-gradient-to-r from-lcars-purple via-lcars-blue to-lcars-amber opacity-70 shrink-0" />
    </aside>
  )
}
