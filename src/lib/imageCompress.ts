/**
 * Image Compression Utility
 * - Compresses images to target size (default 400KB)
 * - Maintains best possible quality
 * - Uses Canvas API — no external libraries needed
 * - Strategy:
 *   1. Resize if dimensions too large (max 1600px)
 *   2. Iteratively reduce JPEG quality until under target size
 *   3. Fall back to WebP if JPEG still too large
 */

interface CompressOptions {
  targetSizeKB?: number
  maxDimension?: number
  initialQuality?: number
  minQuality?: number
}

/**
 * Compress a single image file
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    targetSizeKB = 400,
    maxDimension = 1600,
    initialQuality = 0.92,
    minQuality = 0.5,
  } = options

  // If file is already small enough, return as-is
  if (file.size <= targetSizeKB * 1024) {
    return file
  }

  // Only compress image files
  if (!file.type.startsWith("image/")) {
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          // Calculate new dimensions (maintain aspect ratio)
          let { width, height } = img

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            } else {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }

          // Create canvas
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            resolve(file)
            return
          }

          // White background (for PNG transparency)
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, width, height)

          // Enable high-quality smoothing
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"

          // Draw image
          ctx.drawImage(img, 0, 0, width, height)

          const targetBytes = targetSizeKB * 1024
          let compressedBlob: Blob | null = null
          let bestQuality = initialQuality

          // Try JPEG with decreasing quality
          let quality = initialQuality
          while (quality >= minQuality) {
            const blob = dataUrlToBlob(canvas.toDataURL("image/jpeg", quality))
            if (blob.size <= targetBytes) {
              compressedBlob = blob
              bestQuality = quality
              break
            }
            compressedBlob = blob // Keep last attempt as fallback
            quality -= 0.05
          }

          // If still too large, try WebP (better compression)
          if (compressedBlob && compressedBlob.size > targetBytes) {
            const webpBlob = dataUrlToBlob(canvas.toDataURL("image/webp", 0.75))
            if (webpBlob.size < compressedBlob.size) {
              compressedBlob = webpBlob
            }
          }

          if (!compressedBlob) {
            resolve(file)
            return
          }

          // Create new File with original name (but .jpg extension)
          const originalName = file.name.replace(/\.[^/.]+$/, "")
          const extension = compressedBlob.type === "image/webp" ? "webp" : "jpg"
          const newFileName = `${originalName}-${Date.now()}.${extension}`
          const newFile = new File([compressedBlob], newFileName, {
            type: compressedBlob.type,
            lastModified: Date.now(),
          })

          const savedPercent = Math.round((1 - newFile.size / file.size) * 100)
          console.log(
            `Compressed: ${(file.size / 1024).toFixed(0)}KB -> ${(newFile.size / 1024).toFixed(0)}KB (${savedPercent}% saved, Q=${bestQuality})`
          )

          resolve(newFile)
        } catch (err) {
          console.error("Compression error:", err)
          resolve(file) // Fallback to original on error
        }
      }

      img.onerror = () => {
        console.error("Image load error")
        resolve(file) // Fallback to original
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      console.error("FileReader error")
      resolve(file) // Fallback to original
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Compress multiple images in parallel
 * Use this in admin forms before upload
 */
export async function compressMultipleImages(
  files: File[],
  options: CompressOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)))
}

/**
 * Helper: Convert Data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
