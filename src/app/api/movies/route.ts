import { NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { getThumbnail } from '@/lib/thumbnails'

const MOVIES_DIR = process.env.MOVIES_DIR || 'E:\\'
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v']
const MIN_FILE_SIZE = 500 * 1024 * 1024 // 500 MB in bytes

interface MovieItem {
  name: string
  path: string
  size: number
  isDirectory: boolean
  thumbnail?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dir = searchParams.get('dir') || MOVIES_DIR
    
    // Security check: ensure the requested directory is within MOVIES_DIR
    const normalizedDir = join(dir)
    const normalizedMoviesDir = join(MOVIES_DIR)
    if (!normalizedDir.startsWith(normalizedMoviesDir)) {
      return NextResponse.json(
        { error: 'Access denied', items: [] },
        { status: 403 }
      )
    }
    
    const files = await readdir(normalizedDir)
    
    const items = await Promise.all(
      files.map(async (file) => {
        const filePath = join(normalizedDir, file)
        const stats = await stat(filePath)
        
        if (stats.isDirectory()) {
          return {
            name: file,
            path: filePath,
            size: 0,
            isDirectory: true
          }
        }
        
        const ext = file.toLowerCase().slice(file.lastIndexOf('.'))
        if (VIDEO_EXTENSIONS.includes(ext) && stats.size >= MIN_FILE_SIZE) {
          const thumbnail = await getThumbnail(filePath, normalizedDir, file)
          return {
            name: file,
            path: filePath,
            size: stats.size,
            isDirectory: false,
            thumbnail
          }
        }
        
        return null
      })
    )
    
    // Filter out nulls (non-video files) and sort: directories first, then files
    const validItems = items.filter((item): item is MovieItem => item !== null)
    const sortedItems = validItems.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ 
      items: sortedItems,
      currentPath: normalizedDir
    })
  } catch (error) {
    console.error('Error reading movies directory:', error)
    return NextResponse.json(
      { error: 'Failed to read movies directory', items: [] },
      { status: 500 }
    )
  }
}

