import { NextRequest } from 'next/server'
import { stat, createReadStream } from 'fs'
import { promisify } from 'util'

const statAsync = promisify(stat)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const filePath = searchParams.get('file')

  if (!filePath) {
    return new Response('File path required', { status: 400 })
  }

  try {
    const stats = await statAsync(filePath)
    
    if (!stats.isFile()) {
      return new Response('Invalid file', { status: 400 })
    }

    const stream = createReadStream(filePath)
    
    // Determine content type from extension
    let contentType = 'image/jpeg'
    if (filePath.endsWith('.png')) contentType = 'image/png'
    else if (filePath.endsWith('.webp')) contentType = 'image/webp'
    else if (filePath.endsWith('.gif')) contentType = 'image/gif'
    
    return new Response(stream as any, {
      status: 200,
      headers: {
        'Content-Length': stats.size.toString(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving thumbnail:', error)
    return new Response('Error serving thumbnail', { status: 500 })
  }
}

