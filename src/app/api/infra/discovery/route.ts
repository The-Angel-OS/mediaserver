/**
 * LAN Service Discovery
 * Probes well-known ports on the local subnet to find running services.
 * Returns discovered services with connection info.
 */
import { NextResponse } from 'next/server'
import { networkInterfaces } from 'os'

interface DiscoveredService {
  ip: string
  port: number
  service: string
  label: string
  url: string
  reachable: boolean
  responseMs?: number
}

// Well-known service fingerprints to probe
const SERVICE_PROBES: Array<{ port: number; service: string; label: string; path?: string }> = [
  { port: 443,   service: 'vmware',     label: 'VMware vSphere',        path: '/vsphere-client' },
  { port: 8443,  service: 'vmware',     label: 'VMware ESXi',           path: '/ui' },
  { port: 8001,  service: 'kubernetes', label: 'Kubernetes Dashboard',  path: '/api/healthz' },
  { port: 6443,  service: 'kubernetes', label: 'Kubernetes API',        path: '/healthz' },
  { port: 2375,  service: 'docker',     label: 'Docker Engine API',     path: '/info' },
  { port: 9000,  service: 'portainer',  label: 'Portainer',             path: '/api/status' },
  { port: 32400, service: 'plex',       label: 'Plex Media Server',     path: '/web/index.html' },
  { port: 8096,  service: 'jellyfin',   label: 'Jellyfin',              path: '/health' },
  { port: 8123,  service: 'homeassistant', label: 'Home Assistant',     path: '/api/' },
  { port: 1880,  service: 'nodered',    label: 'Node-RED',              path: '/ui' },
  { port: 3001,  service: 'angelnode',  label: 'Angel OS Node',         path: '/api/health' },
  { port: 3030,  service: 'angelnode',  label: 'Angel OS Node (alt)',   path: '/api/health' },
  { port: 5900,  service: 'vnc',        label: 'VNC Server',            path: undefined },
  { port: 554,   service: 'rtsp',       label: 'RTSP Camera',           path: undefined },
  { port: 80,    service: 'camera',     label: 'IP Camera (HTTP)',      path: '/snapshot' },
]

function getLocalSubnet(): string | null {
  const nets = networkInterfaces()
  for (const ifaceList of Object.values(nets)) {
    for (const iface of ifaceList || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Return base subnet, e.g. 192.168.1
        const parts = iface.address.split('.')
        if (parts.length === 4) return parts.slice(0, 3).join('.')
      }
    }
  }
  return null
}

async function probe(ip: string, port: number, path?: string): Promise<{ reachable: boolean; ms?: number }> {
  if (!path) {
    // TCP-only probe — try HTTP GET and see if we get any response (even 401)
    path = '/'
  }
  const proto = port === 443 || port === 8443 ? 'https' : 'http'
  const url = `${proto}://${ip}:${port}${path}`
  const start = Date.now()
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(800),
      // Don't throw on 4xx — a 401 means the service IS there
    })
    const ms = Date.now() - start
    // Any HTTP response (even error) means port is open
    return { reachable: true, ms }
  } catch {
    return { reachable: false }
  }
}

export async function GET() {
  const subnet = getLocalSubnet()
  if (!subnet) {
    return NextResponse.json({ error: 'Could not determine local subnet', services: [] })
  }

  // Probe the router (.1) + common static IPs (.2 through .20) + broadcast range
  const hostsToScan = [
    `${subnet}.1`,
    ...Array.from({ length: 19 }, (_, i) => `${subnet}.${i + 2}`),
    ...Array.from({ length: 20 }, (_, i) => `${subnet}.${i + 100}`),
    ...Array.from({ length: 20 }, (_, i) => `${subnet}.${i + 150}`),
  ]

  const results: DiscoveredService[] = []

  // Run probes in parallel — limit concurrency to avoid overwhelming the network
  const BATCH = 20
  for (let i = 0; i < hostsToScan.length; i += BATCH) {
    const batch = hostsToScan.slice(i, i + BATCH)
    const probePromises = batch.flatMap(ip =>
      SERVICE_PROBES.map(async probe_def => {
        const { reachable, ms } = await probe(ip, probe_def.port, probe_def.path)
        if (reachable) {
          const proto = probe_def.port === 443 || probe_def.port === 8443 ? 'https' : 'http'
          results.push({
            ip,
            port: probe_def.port,
            service: probe_def.service,
            label: probe_def.label,
            url: `${proto}://${ip}:${probe_def.port}${probe_def.path || ''}`,
            reachable: true,
            responseMs: ms,
          })
        }
      }),
    )
    await Promise.allSettled(probePromises)
  }

  return NextResponse.json({ subnet, hostsScanned: hostsToScan.length, services: results })
}
