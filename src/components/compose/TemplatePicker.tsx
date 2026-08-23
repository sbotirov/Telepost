'use client'

import { useState, useEffect } from 'react'
import { getTemplates, createTemplate } from '@/app/actions/templates'
import { useTranslations } from 'next-intl'
import type { TemplateItem, InlineKeyboard } from '@/types'

interface Props {
  onApplyTemplate: (template: TemplateItem) => void
  onInsertSignature: (content: string) => void
  currentText: string
  currentHashtags: string[]
  currentKeyboard: InlineKeyboard
}

export default function TemplatePicker({
  onApplyTemplate,
  onInsertSignature,
  currentText,
  currentHashtags,
  currentKeyboard,
}: Props) {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateType, setNewTemplateType] = useState<'TEMPLATE' | 'SIGNATURE'>('TEMPLATE')
  const [isSaving, setIsSaving] = useState(false)
  const t = useTranslations('Templates')

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const data = await getTemplates()
      setTemplates(data as unknown as TemplateItem[])
    } catch {
      // Ignore
    }
  }

  async function handleSaveNew() {
    if (!newTemplateName.trim() || !currentText.trim()) return
    setIsSaving(true)
    try {
      await createTemplate({
        name: newTemplateName,
        type: newTemplateType,
        content: currentText,
        hashtags: currentHashtags.length > 0 ? currentHashtags.join(',') : undefined,
        inlineKeyboard: currentKeyboard.length > 0 ? currentKeyboard : undefined,
      })
      setSaveModalOpen(false)
      setNewTemplateName('')
      loadTemplates()
    } catch {
      // Ignore
    } finally {
      setIsSaving(false)
    }
  }

  const postTemplates = templates.filter((t) => t.type === 'TEMPLATE')
  const signatures = templates.filter((t) => t.type === 'SIGNATURE')

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
          style={{ background: 'hsl(224 20% 14%)', color: 'hsl(215 15% 55%)' }}
        >
          <span>📑</span>
          <span>{t('TemplatesAndSignatures')}</span>
          <span className="text-[10px]">▼</span>
        </button>

        {currentText.trim() && (
          <button
            type="button"
            onClick={() => setSaveModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs transition-colors hover:bg-white/5"
            style={{ color: 'hsl(250 85% 65%)' }}
            title={t('SaveCurrentAsTemplate')}
          >
            💾 {t('SaveAsTemplate')}
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div
            className="absolute left-0 top-full mt-2 w-72 glass rounded-2xl p-3 z-40 shadow-2xl space-y-3 animate-fade-in border"
            style={{ borderColor: 'hsl(224 15% 20% / 0.8)' }}
          >
            {/* Signatures */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider px-2 mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
                ✍️ {t('Signatures')}
              </p>
              {signatures.length === 0 ? (
                <p className="text-xs px-2 py-1" style={{ color: 'hsl(215 15% 45%)' }}>
                  {t('NoSignaturesYet')}
                </p>
              ) : (
                <div className="space-y-1">
                  {signatures.map((sig) => (
                    <button
                      key={sig.id}
                      type="button"
                      onClick={() => {
                        onInsertSignature(sig.content)
                        setIsOpen(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors flex items-center justify-between group"
                    >
                      <span className="font-medium truncate">{sig.name}</span>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100" style={{ color: 'hsl(250 85% 65%)' }}>
                        + {t('Insert')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr style={{ borderColor: 'hsl(224 15% 20% / 0.5)' }} />

            {/* Post Templates */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider px-2 mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
                📋 {t('Templates')}
              </p>
              {postTemplates.length === 0 ? (
                <p className="text-xs px-2 py-1" style={{ color: 'hsl(215 15% 45%)' }}>
                  {t('NoTemplatesYet')}
                </p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {postTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        onApplyTemplate(tpl)
                        setIsOpen(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors flex items-center justify-between group"
                    >
                      <span className="font-medium truncate">{tpl.name}</span>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100" style={{ color: 'hsl(175 80% 50%)' }}>
                        {t('Apply')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Save Template Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold flex items-center gap-2">
              💾 {t('SaveAsTemplate')}
            </h3>

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
                {t('TemplateName')}
              </label>
              <input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder={t('TemplateNamePlaceholder')}
                className="form-input text-sm"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: 'hsl(215 15% 55%)' }}>
                {t('Type')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewTemplateType('TEMPLATE')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${newTemplateType === 'TEMPLATE' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-white/10 hover:bg-white/5'}`}
                >
                  📋 {t('FullTemplate')}
                </button>
                <button
                  type="button"
                  onClick={() => setNewTemplateType('SIGNATURE')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${newTemplateType === 'SIGNATURE' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-white/10 hover:bg-white/5'}`}
                >
                  ✍️ {t('SignatureSnippet')}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors"
                style={{ color: 'hsl(215 15% 55%)' }}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveNew}
                disabled={isSaving || !newTemplateName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'hsl(250 85% 65%)' }}
              >
                {isSaving ? '⏳ ...' : t('Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
