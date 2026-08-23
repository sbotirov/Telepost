import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { saveUploadedFile } from '@/lib/upload/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    const subdir = (formData.get('subdir') as string) || 'media'
    const applyWatermark = formData.get('watermark') === 'true'
    const result = await saveUploadedFile(file, subdir)

    if (applyWatermark && file.type.startsWith('image/')) {
      const { processImageWatermark } = await import('@/app/actions/watermark')
      const watermarkedPath = await processImageWatermark(result.filePath)
      result.filePath = watermarkedPath
    }

    return NextResponse.json(result)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
