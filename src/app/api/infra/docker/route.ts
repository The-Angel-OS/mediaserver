import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Docker Desktop exposes the Engine API on TCP when enabled
    const resp = await fetch('http://localhost:2375/containers/json?all=true', {
      signal: AbortSignal.timeout(3000),
    })
    if (!resp.ok) {
      return NextResponse.json({ error: `Docker API returned ${resp.status}` }, { status: 502 })
    }
    const containers = await resp.json()
    return NextResponse.json({ containers })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      error: `Cannot reach Docker API: ${msg}. Enable TCP in Docker Desktop → Settings → General.`,
    }, { status: 503 })
  }
}
