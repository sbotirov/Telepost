'use client'

import { useRef, useState } from 'react'
import type { MediaFileInput, MediaType } from '@/types'

interface Props {
  files: MediaFileInput[]
  onFilesChange: (files: MediaFileInput[]) => void
}

const typeConfig: { type: MediaType; label: string; icon: string; accept: string }[] = [
  { type: 'PHOTO', label: 'Photo', icon: '📷', accept: 'image/*' },
  { type: 'VIDEO', label: 'Video', icon: '🎬', accept: 'video/*' },
  { type: 'AUDIO', label: 'Audio', icon: '🎵', accept: 'audio/*' },
  { type: 'DOCUMENT', label: 'Document', icon: '📄', accept: '*/*' },
]

import { useTranslations } from 'next-intl'

export default function MediaUploader({ files, onFilesChange }: Props) {
  const t = useTranslations('Compose')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeType, setActiveType] = useState<MediaType>('PHOTO')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [watermarkEnabled, setWatermarkEnabled] = useState(false)

  async function uploadFile(file: File, type: MediaType) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subdir', type.toLowerCase())
      if (watermarkEnabled && type === 'PHOTO') {
        formData.append('watermark', 'true')
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()

      const newFile: MediaFileInput = {
        type,
        filePath: data.filePath,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        sortOrder: files.length,
      }

      onFilesChange([...files, newFile])
    } catch (error) {
      console.error('Upload error:', error)
    }
    setUploading(false)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected) return
    Array.from(selected).forEach((f) => uploadFile(f, activeType))
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    Array.from(e.dataTransfer.files).forEach((f) => {
      const type: MediaType = f.type.startsWith('image') ? 'PHOTO' : f.type.startsWith('video') ? 'VIDEO' : f.type.startsWith('audio') ? 'AUDIO' : 'DOCUMENT'
      uploadFile(f, type)
    })
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📎 {t('MediaTab')}</h3>

      {/* Type buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex gap-2">
          {typeConfig.map((tc) => (
            <button
              key={tc.type}
              type="button"
              onClick={() => { setActiveType(tc.type); fileInputRef.current?.click() }}
              className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all hover:bg-white/10"
              style={{ background: 'hsl(224 20% 14%)', color: 'hsl(215 15% 55%)' }}
            >
              {tc.icon} {t(tc.label)}
            </button>
          ))}
        </div>

        {/* Watermark toggle */}
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" style={{ color: watermarkEnabled ? 'hsl(250 85% 65%)' : 'hsl(215 15% 55%)' }}>
          <input
            type="checkbox"
            checked={watermarkEnabled}
            onChange={(e) => setWatermarkEnabled(e.target.checked)}
            className="rounded border-gray-700 text-indigo-600 focus:ring-0"
          />
          <span>🛡️ {t('WatermarkPhoto')}</span>
        </label>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
        style={{
          border: `2px dashed ${dragOver ? 'hsl(250 85% 65%)' : 'hsl(224 15% 20%)'}`,
          background: dragOver ? 'hsl(250 85% 65% / 0.05)' : 'transparent',
        }}
      >
        <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>
          {uploading ? t('Uploading') : t('DropFiles')}
        </p>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept={typeConfig.find((t) => t.type === activeType)?.accept} multiple />

      {/* File previews */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'hsl(224 20% 14%)' }}>
              <span className="text-lg">{typeConfig.find((t) => t.type === f.type)?.icon || '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{f.fileName}</p>
                <p className="text-xs" style={{ color: 'hsl(215 15% 55%)' }}>{(f.fileSize / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => removeFile(i)} className="text-sm hover:opacity-70" style={{ color: 'hsl(0 72% 60%)' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
