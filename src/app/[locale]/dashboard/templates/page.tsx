'use client'

import { useState, useEffect, useTransition } from 'react'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/app/actions/templates'
import { useTranslations } from 'next-intl'
import type { TemplateItem } from '@/types'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Link from 'next/link'

export default function TemplatesPage() {
  const t = useTranslations('Templates')
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [activeTab, setActiveTab] = useState<'ALL' | 'TEMPLATE' | 'SIGNATURE'>('ALL')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<'TEMPLATE' | 'SIGNATURE'>('TEMPLATE')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const data = await getTemplates()
      setTemplates(data as unknown as TemplateItem[])
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal(defaultType: 'TEMPLATE' | 'SIGNATURE' = 'TEMPLATE') {
    setEditingTemplate(null)
    setName('')
    setType(defaultType)
    setContent('')
    setHashtags('')
    setIsDefault(false)
    setIsModalOpen(true)
  }

  function openEditModal(template: TemplateItem) {
    setEditingTemplate(template)
    setName(template.name)
    setType(template.type)
    setContent(template.content)
    setHashtags(template.hashtags || '')
    setIsDefault(template.isDefault)
    setIsModalOpen(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return

    startTransition(async () => {
      try {
        if (editingTemplate) {
          await updateTemplate(editingTemplate.id, {
            name,
            type,
            content,
            hashtags: hashtags.trim() || undefined,
            isDefault,
          })
        } else {
          await createTemplate({
            name,
            type,
            content,
            hashtags: hashtags.trim() || undefined,
            isDefault,
          })
        }
        setIsModalOpen(false)
        loadTemplates()
      } catch {
        // Ignore
      }
    })
  }

  async function handleDelete() {
    if (!deleteConfirmId) return
    await deleteTemplate(deleteConfirmId)
    setDeleteConfirmId(null)
    loadTemplates()
  }

  const filteredTemplates = templates.filter((t) => {
    if (activeTab === 'ALL') return true
    return t.type === activeTab
  })

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t('PageTitle')}</h2>
          <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('PageDescription')}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => openCreateModal('TEMPLATE')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'hsl(250 85% 65%)' }}
          >
            + {t('NewTemplate')}
          </button>
          <button
            onClick={() => openCreateModal('SIGNATURE')}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10"
            style={{ border: '1px solid hsl(224 15% 20%)', color: 'hsl(215 15% 55%)' }}
          >
            + {t('NewSignature')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['ALL', 'TEMPLATE', 'SIGNATURE'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === tab ? 'bg-white/10 text-white border border-white/20' : 'text-gray-400 hover:bg-white/5'}`}
          >
            {tab === 'ALL' && `🌐 ${t('All')}`}
            {tab === 'TEMPLATE' && `📋 ${t('Templates')}`}
            {tab === 'SIGNATURE' && `✍️ ${t('Signatures')}`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-sm" style={{ color: 'hsl(215 15% 55%)' }}>
            {t('Loading')}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm glass rounded-2xl p-8" style={{ color: 'hsl(215 15% 55%)' }}>
            <p className="text-3xl mb-2">📑</p>
            <p>{t('NoTemplatesFound')}</p>
          </div>
        ) : (
          filteredTemplates.map((item) => (
            <div
              key={item.id}
              className="glass rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all border"
              style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.type === 'TEMPLATE' ? '📋' : '✍️'}</span>
                    <h3 className="font-bold text-sm truncate">{item.name}</h3>
                  </div>
                  <span
                    className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: item.type === 'TEMPLATE' ? 'hsl(250 85% 65% / 0.15)' : 'hsl(175 80% 50% / 0.15)',
                      color: item.type === 'TEMPLATE' ? 'hsl(250 85% 65%)' : 'hsl(175 80% 50%)',
                    }}
                  >
                    {item.type}
                  </span>
                </div>

                <div
                  className="p-3 rounded-xl text-xs font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed"
                  style={{ background: 'hsl(224 20% 14%)', color: 'hsl(215 15% 75%)' }}
                >
                  {item.content}
                </div>

                {item.hashtags && (
                  <p className="text-[11px] mt-2 truncate" style={{ color: 'hsl(250 85% 65%)' }}>
                    {item.hashtags.split(',').map((h) => `#${h}`).join(' ')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
                <Link
                  href={`../dashboard/compose`}
                  className="text-xs hover:opacity-70 font-medium"
                  style={{ color: 'hsl(250 85% 65%)' }}
                >
                  🚀 {t('UseInPost')}
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-xs hover:opacity-70 font-medium"
                    style={{ color: 'hsl(175 80% 50%)' }}
                  >
                    ✏️ {t('Edit')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="text-xs hover:opacity-70 font-medium"
                    style={{ color: 'hsl(0 72% 60%)' }}
                  >
                    🗑️ {t('Delete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg glass rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{ borderColor: 'hsl(224 15% 20% / 0.8)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
              <h3 className="text-base font-bold flex items-center gap-2">
                {editingTemplate ? `✏️ ${t('EditTemplate')}` : `➕ ${t('NewTemplate')}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
                {t('TemplateName')} *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('TemplateNamePlaceholder')}
                className="form-input text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
                {t('Type')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('TEMPLATE')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${type === 'TEMPLATE' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
                >
                  📋 {t('FullTemplate')}
                </button>
                <button
                  type="button"
                  onClick={() => setType('SIGNATURE')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${type === 'SIGNATURE' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
                >
                  ✍️ {t('SignatureSnippet')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
                {t('Content')} *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder={type === 'SIGNATURE' ? '📢 Bizning kanal: @mychannel\n🔗 Sayt: example.com' : t('ContentPlaceholder')}
                className="form-input text-sm font-mono"
                required
              />
            </div>

            {type === 'TEMPLATE' && (
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
                  {t('Hashtags')} ({t('Optional')})
                </label>
                <input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="news,tech,telegram"
                  className="form-input text-sm"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors disabled:opacity-50"
                style={{ color: 'hsl(215 15% 55%)' }}
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={isPending || !name.trim() || !content.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: 'hsl(250 85% 65%)' }}
              >
                {isPending ? '⏳ ...' : t('Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        message={t('ConfirmDeleteTemplate')}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
      />
    </div>
  )
}
