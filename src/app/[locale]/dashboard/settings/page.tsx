'use client'

import { useState, useEffect, useTransition } from 'react'
import { updatePassword } from '@/app/actions/settings'
import { getWatermarkSetting, updateWatermarkSetting } from '@/app/actions/watermark'
import { getAdminSettings, updateAdminSettings } from '@/app/actions/analytics'
import { useTranslations } from 'next-intl'
import type { WatermarkConfig, WatermarkPosition, AdminSettingConfig } from '@/types'

export default function SettingsPage() {
  const [tokenVisible, setTokenVisible] = useState(false)
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  // Watermark state
  const [watermark, setWatermark] = useState<WatermarkConfig>({
    isEnabled: false,
    type: 'TEXT',
    text: '@mychannel',
    position: 'BOTTOM_RIGHT',
    opacity: 0.7,
    fontSize: 24,
  })
  const [watermarkStatus, setWatermarkStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSavingWatermark, setIsSavingWatermark] = useState(false)

  // Admin Alert Settings state
  const [adminSetting, setAdminSetting] = useState<AdminSettingConfig>({
    adminChatId: '',
    notifyOnFailure: true,
    notifyOnSuccess: false,
  })
  const [adminSettingStatus, setAdminSettingStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSavingAdminSetting, setIsSavingAdminSetting] = useState(false)

  const t = useTranslations('Settings')
  const tWm = useTranslations('Watermark')
  const tAlerts = useTranslations('Alerts')

  useEffect(() => {
    getWatermarkSetting().then(setWatermark)
    getAdminSettings().then(setAdminSetting)
  }, [])

  function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword || !newPassword) return

    setStatus(null)
    startTransition(async () => {
      try {
        await updatePassword(currentPassword, newPassword)
        setStatus({ type: 'success', message: t('PasswordUpdated') })
        setCurrentPassword('')
        setNewPassword('')
      } catch (err) {
        setStatus({ type: 'error', message: err instanceof Error ? err.message : t('FailedToUpdate') })
      }
    })
  }

  async function handleSaveWatermark(e: React.FormEvent) {
    e.preventDefault()
    setIsSavingWatermark(true)
    setWatermarkStatus(null)
    try {
      await updateWatermarkSetting(watermark)
      setWatermarkStatus({ type: 'success', message: tWm('SavedSuccess') })
    } catch {
      setWatermarkStatus({ type: 'error', message: tWm('SaveFailed') })
    } finally {
      setIsSavingWatermark(false)
    }
  }

  async function handleSaveAdminSettings(e: React.FormEvent) {
    e.preventDefault()
    setIsSavingAdminSetting(true)
    setAdminSettingStatus(null)
    try {
      await updateAdminSettings(adminSetting)
      setAdminSettingStatus({ type: 'success', message: tAlerts('SavedSuccess') })
    } catch {
      setAdminSettingStatus({ type: 'error', message: tAlerts('SaveFailed') })
    } finally {
      setIsSavingAdminSetting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold">{t('Title')}</h2>
        <p className="text-sm" style={{ color: 'hsl(215 15% 55%)' }}>{t('Description')}</p>
      </div>

      <div className="grid gap-6">
        {/* Watermark Configuration */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🛡️ {tWm('Title')}
            </h3>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <span>{tWm('Enable')}</span>
              <button
                type="button"
                onClick={() => setWatermark((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${watermark.isEnabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${watermark.isEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </label>
          </div>

          <form onSubmit={handleSaveWatermark} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
                  {tWm('WatermarkText')}
                </label>
                <input
                  type="text"
                  value={watermark.text || ''}
                  onChange={(e) => setWatermark((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="@mychannel"
                  className="form-input"
                  disabled={!watermark.isEnabled}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
                  {tWm('Position')}
                </label>
                <select
                  value={watermark.position}
                  onChange={(e) => setWatermark((prev) => ({ ...prev, position: e.target.value as WatermarkPosition }))}
                  className="form-input"
                  disabled={!watermark.isEnabled}
                >
                  <option value="BOTTOM_RIGHT">{tWm('BottomRight')}</option>
                  <option value="BOTTOM_LEFT">{tWm('BottomLeft')}</option>
                  <option value="TOP_RIGHT">{tWm('TopRight')}</option>
                  <option value="TOP_LEFT">{tWm('TopLeft')}</option>
                  <option value="CENTER">{tWm('Center')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
                  {tWm('Opacity')} ({Math.round(watermark.opacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={watermark.opacity}
                  onChange={(e) => setWatermark((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                  className="w-full"
                  disabled={!watermark.isEnabled}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
                  {tWm('FontSize')} ({watermark.fontSize}px)
                </label>
                <input
                  type="range"
                  min="14"
                  max="64"
                  step="2"
                  value={watermark.fontSize}
                  onChange={(e) => setWatermark((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full"
                  disabled={!watermark.isEnabled}
                />
              </div>
            </div>

            {watermarkStatus && (
              <p className={`text-sm ${watermarkStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {watermarkStatus.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSavingWatermark}
              className="px-6 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'hsl(250 85% 65%)' }}
            >
              {isSavingWatermark ? '⏳ ...' : tWm('SaveSettings')}
            </button>
          </form>
        </div>

        {/* Failure Alerts & Admin Notifications */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            🚨 {tAlerts('Title')}
          </h3>
          <p className="text-xs mb-4" style={{ color: 'hsl(215 15% 55%)' }}>
            {tAlerts('Description')}
          </p>

          <form onSubmit={handleSaveAdminSettings} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
                {tAlerts('AdminChatId')}
              </label>
              <input
                type="text"
                value={adminSetting.adminChatId || ''}
                onChange={(e) => setAdminSetting((prev) => ({ ...prev, adminChatId: e.target.value }))}
                placeholder="123456789 or @admin_channel"
                className="form-input"
              />
              <p className="text-xs mt-1.5" style={{ color: 'hsl(215 15% 55%)' }}>
                {tAlerts('AdminChatIdHelp')}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminSetting.notifyOnFailure}
                  onChange={(e) => setAdminSetting((prev) => ({ ...prev, notifyOnFailure: e.target.checked }))}
                  className="rounded border-gray-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-black/40"
                />
                <div>
                  <p className="text-sm font-medium text-gray-200">{tAlerts('NotifyOnFailure')}</p>
                  <p className="text-xs text-gray-400">{tAlerts('NotifyOnFailureDesc')}</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminSetting.notifyOnSuccess}
                  onChange={(e) => setAdminSetting((prev) => ({ ...prev, notifyOnSuccess: e.target.checked }))}
                  className="rounded border-gray-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-black/40"
                />
                <div>
                  <p className="text-sm font-medium text-gray-200">{tAlerts('NotifyOnSuccess')}</p>
                  <p className="text-xs text-gray-400">{tAlerts('NotifyOnSuccessDesc')}</p>
                </div>
              </label>
            </div>

            {adminSettingStatus && (
              <p className={`text-sm ${adminSettingStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {adminSettingStatus.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSavingAdminSetting}
              className="px-6 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'hsl(250 85% 65%)' }}
            >
              {isSavingAdminSetting ? '⏳ ...' : tAlerts('SaveSettings')}
            </button>
          </form>
        </div>

        {/* Bot Configuration */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">{t('BotConfig')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>{t('BotToken')}</label>
              <div className="flex gap-2">
                <input
                  type={tokenVisible ? 'text' : 'password'}
                  value="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  readOnly
                  className="form-input flex-1 opacity-70 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setTokenVisible(!tokenVisible)}
                  className="px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {tokenVisible ? t('Hide') : t('Show')}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'hsl(215 15% 55%)' }}>
                {t('BotTokenHelp')}
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">{t('Security')}</h3>
          <form className="space-y-4 max-w-md" onSubmit={handleUpdatePassword}>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>{t('CurrentPassword')}</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder={t('CurrentPasswordPlaceholder')} 
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'hsl(215 15% 55%)' }}>{t('NewPassword')}</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder={t('NewPasswordPlaceholder')} 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            
            {status && (
              <p className={`text-sm ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {status.message}
              </p>
            )}

            <button
              disabled={isPending || !currentPassword || !newPassword}
              className="px-6 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: 'hsl(250 85% 65%)' }}
            >
              {isPending ? t('Updating') : t('UpdatePasswordBtn')}
            </button>
          </form>
        </div>

        {/* System Info */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">{t('SystemInfo')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'hsl(224 20% 14%)' }}>
              <p className="text-xs mb-1" style={{ color: 'hsl(215 15% 55%)' }}>{t('Version')}</p>
              <p className="font-semibold">v1.0.0</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'hsl(224 20% 14%)' }}>
              <p className="text-xs mb-1" style={{ color: 'hsl(215 15% 55%)' }}>{t('Environment')}</p>
              <p className="font-semibold">{t('Production')}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'hsl(224 20% 14%)' }}>
              <p className="text-xs mb-1" style={{ color: 'hsl(215 15% 55%)' }}>{t('Database')}</p>
              <p className="font-semibold text-green-400">{t('Connected')}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'hsl(224 20% 14%)' }}>
              <p className="text-xs mb-1" style={{ color: 'hsl(215 15% 55%)' }}>{t('Storage')}</p>
              <p className="font-semibold">{t('Local')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

