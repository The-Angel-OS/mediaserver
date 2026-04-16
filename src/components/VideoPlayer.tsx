'use client'

import { useRef, useEffect } from 'react'

interface VideoPlayerProps {
  src: string
  title: string
  currentPath?: string
  onBack: () => void
}

export default function VideoPlayer({ src, title, currentPath, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onBack])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 neon-violet rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 neon-blue rounded-full blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 bg-black/50 backdrop-blur-sm border-b border-violet-500/20 p-2 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-violet-400 transition-all duration-300 bg-gray-800/50 hover:bg-violet-600/20 px-2 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm border border-gray-700/50 hover:border-violet-500/50 text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden md:inline">Back to Library</span>
          </button>
          <h1 className="text-sm md:text-xl font-semibold truncate max-w-2xl bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent ml-2">
            {title.replace(/\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v)$/i, '').split('\\').pop()}
          </h1>
        </div>
        {currentPath && (
          <div className="text-xs text-gray-400 bg-gray-800/30 px-2 md:px-3 py-1 rounded border border-gray-700/50 truncate">
            {currentPath}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-black relative">
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          autoPlay
          src={src}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none"></div>
      </div>
    </div>
  )
}

