'use server'

import { prisma } from '@/lib/db/prisma'
import { logAudit } from '@/lib/security/audit'
import { revalidatePath } from 'next/cache'
import type { TemplateInput } from '@/types'

export async function getTemplates(type?: 'TEMPLATE' | 'SIGNATURE') {
  return prisma.template.findMany({
    where: type ? { type } : undefined,
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  })
}

export async function getTemplate(id: string) {
  return prisma.template.findUnique({
    where: { id },
  })
}

export async function createTemplate(data: TemplateInput) {
  if (data.isDefault) {
    // Reset existing default for same type
    await prisma.template.updateMany({
      where: { type: data.type },
      data: { isDefault: false },
    })
  }

  const template = await prisma.template.create({
    data: {
      name: data.name,
      type: data.type,
      content: data.content,
      hashtags: data.hashtags || null,
      inlineKeyboard: data.inlineKeyboard ? JSON.stringify(data.inlineKeyboard) : null,
      isDefault: data.isDefault || false,
    },
  })

  await logAudit('template.create', { templateId: template.id, name: template.name })
  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/compose')

  return template
}

export async function updateTemplate(id: string, data: TemplateInput) {
  if (data.isDefault) {
    await prisma.template.updateMany({
      where: { type: data.type, id: { not: id } },
      data: { isDefault: false },
    })
  }

  const template = await prisma.template.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      content: data.content,
      hashtags: data.hashtags || null,
      inlineKeyboard: data.inlineKeyboard ? JSON.stringify(data.inlineKeyboard) : null,
      isDefault: data.isDefault || false,
    },
  })

  await logAudit('template.update', { templateId: template.id })
  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/compose')

  return template
}

export async function deleteTemplate(id: string) {
  await prisma.template.delete({
    where: { id },
  })

  await logAudit('template.delete', { templateId: id })
  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/compose')
}
