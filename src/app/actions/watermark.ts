'use server'

import { prisma } from '@/lib/db/prisma'
import { logAudit } from '@/lib/security/audit'
import { revalidatePath } from 'next/cache'
import { applyWatermarkToImage } from '@/lib/media/watermark'
import type { WatermarkConfig } from '@/types'

export async function getWatermarkSetting(): Promise<WatermarkConfig> {
  const setting = await prisma.watermarkSetting.findFirst()
  if (!setting) {
    return {
      isEnabled: false,
      type: 'TEXT',
      text: '@mychannel',
      position: 'BOTTOM_RIGHT',
      opacity: 0.7,
      fontSize: 24,
    }
  }

  return {
    id: setting.id,
    isEnabled: setting.isEnabled,
    type: setting.type as 'TEXT' | 'IMAGE',
    text: setting.text,
    imagePath: setting.imagePath,
    position: setting.position as WatermarkConfig['position'],
    opacity: setting.opacity,
    fontSize: setting.fontSize,
  }
}

export async function updateWatermarkSetting(data: WatermarkConfig) {
  const existing = await prisma.watermarkSetting.findFirst()

  let setting
  if (existing) {
    setting = await prisma.watermarkSetting.update({
      where: { id: existing.id },
      data: {
        isEnabled: data.isEnabled,
        type: data.type,
        text: data.text,
        imagePath: data.imagePath,
        position: data.position,
        opacity: data.opacity,
        fontSize: data.fontSize,
      },
    })
  } else {
    setting = await prisma.watermarkSetting.create({
      data: {
        isEnabled: data.isEnabled,
        type: data.type,
        text: data.text,
        imagePath: data.imagePath,
        position: data.position,
        opacity: data.opacity,
        fontSize: data.fontSize,
      },
    })
  }

  await logAudit('watermark.update', { isEnabled: data.isEnabled, type: data.type })
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/compose')

  return setting
}

export async function processImageWatermark(imageRelativePath: string) {
  const setting = await getWatermarkSetting()
  if (!setting.isEnabled) return imageRelativePath
  return applyWatermarkToImage(imageRelativePath, setting)
}
