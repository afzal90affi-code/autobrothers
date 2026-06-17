/**
 * Image Compression Utility
 * - Compresses images to target size (default 400KB)
 * - Maintains best possible quality
 * - Uses Canvas API — no external libraries needed
 */

interface CompressOptions {
  targetSizeKB?: number
  maxDimension?: number
  initialQuality?: number
  minQuality?: number
}

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

  if (file.size <= targetSizeKB * 1024) {
    return file
  }

  if (!file.type.startsWith("image/")) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          let width = img.width
          let height = img.height

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            } else {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            resolve(file)
            return
          }

          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, width, height)
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, width, height)

          const targetBytes = targetSizeKB * 1024
          let compressedBlob: Blob | null = null

          let quality = initialQuality
          while (quality >= minQuality) {
            const blob = dataUrlToBlob(canvas.toDataURL("image/jpeg", quality))
            if (blob.size <= targetBytes) {
              compressedBlob = blob
              break
            }
            compressedBlob = blob
            quality -= 0.05
          }

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

          const originalName = file.name.replace(/\.[^/.]+$/, "")
          const extension = compressedBlob.type === "image/webp" ? "webp" : "jpg"
          const newFileName = `${originalName}-${Date.now()}.${extension}`
          const newFile = new File([compressedBlob], newFileName, {
            type: compressedBlob.type,
            lastModified: Date.now(),
          })

          resolve(newFile)
        } catch (err) {
          console.error("Compression error:", err)
          resolve(file)
        }
      }

      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }

    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export async function compressMultipleImages(
  files: File[],
  options: CompressOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)))
}

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