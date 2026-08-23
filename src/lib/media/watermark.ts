import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import type { WatermarkConfig, WatermarkPosition } from '@/types'
import { logger } from '@/lib/security/logger'

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

function resolveFilePath(filePath: string): string {
  if (filePath.startsWith('/uploads')) {
    return path.join(process.cwd(), 'public', filePath)
  }
  if (path.isAbsolute(filePath)) return filePath
  return path.join(process.cwd(), 'public', filePath)
}

function calculateGravity(position: WatermarkPosition): sharp.Gravity {
  switch (position) {
    case 'TOP_LEFT':
      return 'northwest'
    case 'TOP_RIGHT':
      return 'northeast'
    case 'BOTTOM_LEFT':
      return 'southwest'
    case 'BOTTOM_RIGHT':
      return 'southeast'
    case 'CENTER':
      return 'center'
    default:
      return 'southeast'
  }
}

/**
 * Creates an SVG text overlay buffer with crisp drop shadow.
 */
function createTextSvg(text: string, fontSize: number, opacity: number): Buffer {
  const safeText = escapeXml(text)
  const estimatedWidth = Math.max(text.length * fontSize * 0.7 + 40, 160)
  const estimatedHeight = fontSize * 2 + 20

  const svg = `
    <svg width="${estimatedWidth}" height="${estimatedHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>
      <text
        x="20"
        y="${fontSize + 5}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${fontSize}px"
        font-weight="bold"
        fill="rgba(255, 255, 255, ${opacity})"
        filter="url(#shadow)"
      >${safeText}</text>
    </svg>
  `
  return Buffer.from(svg)
}

/**
 * Applies a text or image watermark to an image file and saves the result.
 */
export async function applyWatermarkToImage(
  inputRelativePath: string,
  config: WatermarkConfig
): Promise<string> {
  if (!config.isEnabled) return inputRelativePath

  try {
    const fullInputPath = resolveFilePath(inputRelativePath)
    if (!fs.existsSync(fullInputPath)) {
      logger.warn(`Watermark input file not found: ${fullInputPath}`)
      return inputRelativePath
    }

    const image = sharp(fullInputPath)
    const metadata = await image.metadata()
    if (!metadata.width || !metadata.height) {
      return inputRelativePath
    }

    const gravity = calculateGravity(config.position)
    let overlayBuffer: Buffer

    if (config.type === 'IMAGE' && config.imagePath) {
      const fullLogoPath = resolveFilePath(config.imagePath)
      if (fs.existsSync(fullLogoPath)) {
        // Scale logo proportionally to 15% of image width
        const targetWidth = Math.max(Math.round(metadata.width * 0.18), 80)
        const logo = sharp(fullLogoPath).resize({ width: targetWidth })
        
        // Adjust opacity if needed
        overlayBuffer = await logo.png().toBuffer()
      } else {
        overlayBuffer = createTextSvg(config.text || '@channel', config.fontSize || 24, config.opacity || 0.7)
      }
    } else {
      const textToUse = config.text || '@channel'
      overlayBuffer = createTextSvg(textToUse, config.fontSize || 24, config.opacity || 0.7)
    }

    // Generate output file name
    const ext = path.extname(fullInputPath)
    const baseName = path.basename(fullInputPath, ext)
    const dir = path.dirname(fullInputPath)
    const outputFileName = `${baseName}_wm_${Date.now()}${ext}`
    const fullOutputPath = path.join(dir, outputFileName)

    await sharp(fullInputPath)
      .composite([
        {
          input: overlayBuffer,
          gravity,
        },
      ])
      .toFile(fullOutputPath)

    // Return the web-accessible relative path
    const relativeDir = path.dirname(inputRelativePath)
    const resultPath = path.posix.join(relativeDir.replace(/\\/g, '/'), outputFileName)
    
    logger.info(`Watermark applied successfully: ${resultPath}`)
    return resultPath
  } catch (error) {
    logger.error('Failed to apply watermark', { error })
    return inputRelativePath
  }
}
