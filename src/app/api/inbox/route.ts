import { NextRequest, NextResponse } from 'next/server'
import { getFiles, updateFile } from '@/lib/store'
import { initWatcher } from '@/lib/watcher'

// Ensure watcher is running
initWatcher().catch(console.error)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as any
  const files = getFiles(status || undefined)
  return NextResponse.json({ files, count: files.length })
}

export async function PATCH(req: NextRequest) {
  const { id, status, youtubeId, notes } = await req.json() as {
    id: string; status?: string; youtubeId?: string; notes?: string
  }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  updateFile(id, { ...(status && { status: status as any }), ...(youtubeId && { youtubeId }), ...(notes && { notes }) })
  return NextResponse.json({ success: true })
}
