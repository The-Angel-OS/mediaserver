'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'

interface MovieItem {
  name: string
  path: string
  size: number
  isDirectory: boolean
  thumbnail?: string
}

function MediaLibrary() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<MovieItem[]>([])
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [pathHistory, setPathHistory] = useState<string[]>([])

  const loadDirectory = (dir?: string, updateUrl = true) => {
    setLoading(true)
    const url = dir ? `/api/movies?dir=${encodeURIComponent(dir)}` : '/api/movies'
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setItems(data.items || [])
        setCurrentPath(data.currentPath || '')
        setLoading(false)
        
        // Update URL with current directory
        if (updateUrl && data.currentPath) {
          const params = new URLSearchParams()
          params.set('dir', data.currentPath)
          router.push(`?${params.toString()}`, { scroll: false })
        }
      })
      .catch(err => {
        console.error('Failed to load movies:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    // Load directory from URL on mount
    const dirParam = searchParams.get('dir')
    if (dirParam) {
      loadDirectory(dirParam, false)
    } else {
      loadDirectory(undefined, false)
    }
  }, [])

  const navigateToDirectory = (dirPath: string) => {
    setPathHistory([...pathHistory, currentPath])
    loadDirectory(dirPath)
  }

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1]
      setPathHistory(pathHistory.slice(0, -1))
      loadDirectory(previousPath)
    }
  }

  if (selectedMovie) {
    return (
      <VideoPlayer 
        src={`/api/stream?file=${encodeURIComponent(selectedMovie)}`}
        title={selectedMovie}
        currentPath={currentPath}
        onBack={() => setSelectedMovie(null)}
      />
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 neon-violet rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 neon-blue rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold title-glow mb-4 bg-gradient-to-r from-violet-400 via-purple-500 to-blue-400 bg-clip-text text-transparent">
            Angel OS
          </h1>
          <h2 className="text-3xl font-light text-gray-300 mb-2">Media Library</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Breadcrumb navigation */}
        {currentPath && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Home button */}
              <button
                onClick={() => {
                  setPathHistory([])
                  loadDirectory()
                }}
                className="flex items-center text-violet-400 hover:text-violet-300 transition-colors bg-gray-800/50 hover:bg-gray-800/80 px-3 py-2 rounded-lg border border-violet-500/20"
                title="Go to root"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>

              {/* Up/Back button */}
              {pathHistory.length > 0 && (
                <button
                  onClick={navigateBack}
                  className="flex items-center text-violet-400 hover:text-violet-300 transition-colors bg-gray-800/50 hover:bg-gray-800/80 px-3 py-2 rounded-lg border border-violet-500/20"
                  title="Go up one level"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}

              {/* Current path */}
              <div className="text-sm text-gray-400 bg-gray-800/30 px-4 py-2 rounded-lg border border-gray-700/50 flex-1 truncate">
                {currentPath}
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="neon-glow rounded-full p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400"></div>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="neon-glow rounded-2xl p-8 max-w-md mx-auto">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl text-gray-300">No items found</h3>
              <p className="text-gray-500 mt-2">Check your media directory</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 max-w-7xl mx-auto">
            {items.map((item, index) => (
              <button
                key={item.path}
                onClick={() => item.isDirectory ? navigateToDirectory(item.path) : setSelectedMovie(item.path)}
                className="movie-card group cursor-pointer flex flex-col w-full max-w-[200px] mx-auto"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Thumbnail or placeholder */}
                <div className="bg-gradient-to-br from-violet-900/50 to-blue-900/50 flex items-center justify-center overflow-hidden relative w-full aspect-[2/3]">
                  {item.thumbnail ? (
                    <img 
                      src={`/api/thumbnail?file=${encodeURIComponent(item.thumbnail)}`}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-3xl sm:text-4xl opacity-50">
                      {item.isDirectory ? '📁' : '🎬'}
                    </div>
                  )}
                </div>
                
                {/* Item info */}
                <div className="p-2 sm:p-3 flex-shrink-0 flex flex-col justify-between min-h-[80px] sm:min-h-[90px]">
                  <h3 className="font-semibold text-xs sm:text-sm leading-tight mb-1 sm:mb-2 text-gray-200 group-hover:text-violet-300 transition-colors line-clamp-2">
                    {item.isDirectory 
                      ? item.name 
                      : item.name.replace(/\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v)$/i, '')}
                  </h3>
                  
                  <div className="flex items-center justify-between gap-1 sm:gap-2 flex-wrap">
                    {!item.isDirectory && (
                      <>
                        <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-800/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          {(item.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                        </span>
                        
                        {/* File type badge */}
                        <span className="text-[10px] sm:text-xs bg-gradient-to-r from-violet-600 to-blue-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          {item.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </>
                    )}
                    {item.isDirectory && (
                      <span className="text-[10px] sm:text-xs bg-gradient-to-r from-blue-600 to-cyan-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        FOLDER
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="play-button">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 sm:p-4">
                    {item.isDirectory ? (
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    ) : (
                      <svg 
                        className="w-6 h-6 sm:w-8 sm:h-8 text-white" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Subtle gradient border */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/20 via-transparent to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 neon-violet rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 neon-blue rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold title-glow mb-4 bg-gradient-to-r from-violet-400 via-purple-500 to-blue-400 bg-clip-text text-transparent">
              Angel OS
            </h1>
            <h2 className="text-3xl font-light text-gray-300 mb-2">Media Library</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-blue-500 mx-auto rounded-full"></div>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="neon-glow rounded-full p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400"></div>
            </div>
          </div>
        </div>
      </main>
    }>
      <MediaLibrary />
    </Suspense>
  )
}

