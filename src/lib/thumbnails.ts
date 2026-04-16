import { stat } from 'fs/promises'
import { join } from 'path'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

// Find user-provided thumbnail image with same name as video
async function findUserThumbnail(basePath: string, fileName: string): Promise<string | undefined> {
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'))
  
  for (const ext of IMAGE_EXTENSIONS) {
    const thumbnailPath = join(basePath, nameWithoutExt + ext)
    try {
      await stat(thumbnailPath)
      return thumbnailPath
    } catch {
      // File doesn't exist, continue
    }
  }
  
  return undefined
}

/**
 * Get thumbnail for a video file
 * Only checks for user-provided images with matching filenames
 */
export async function getThumbnail(videoPath: string, basePath: string, fileName: string): Promise<string | undefined> {
  try {
    const userThumbnail = await findUserThumbnail(basePath, fileName)
    return userThumbnail
  } catch (error) {
    console.error('Failed to get thumbnail:', error)
    return undefined
  }
}

