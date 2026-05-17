import { useEffect, useState } from 'react'
import { getSchedule, recomputeStatuses, updateSchedule } from '../api/settings'
import type { WorkSchedule } from '../types/settings'

function timeForInput(v: string): string {
  // Backend returns "HH:MM:SS"; <input type="time"> wants "HH:MM".
  return v.length >= 5 ? v.slice(0, 5) : v
}

export default function SettingsPage() {
  const [schedule, setSchedule] = useState<WorkSchedule | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [lateMin, setLateMin] = useState(0)
  const [earlyMin, setEarlyMin] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [recomputing, setRecomputing] = useState(false)
  const [recomputeMsg, setRecomputeMsg] = useState('')

  useEffect(() => {
    let alive = true
    getSchedule()
      .then(s => {
        if (!alive) return
        setSchedule(s)
        setStartTime(timeForInput(s.start_time))
        setEndTime(timeForInput(s.end_time))
        setLateMin(s.late_threshold_minutes)
        setEarlyMin(s.early_leave_threshold_minutes)
      })
      .catch(e => alive && setError(e instanceof Error ? e.message : 'Xatolik'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const formInvalid = !startTime || !endTime || endTime <= startTime

  async function handleSave() {
    if (formInvalid) return
    setSaving(true)
    setError('')
    setSavedMsg('')
    try {
      const updated = await updateSchedule({
        start_time: startTime,
        end_time: endTime,
        late_threshold_minutes: lateMin,
        early_leave_threshold_minutes: earlyMin,
      })
      setSchedule(updated)
      setSavedMsg('Saqlandi')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  async function handleRecompute() {
    setRecomputing(true)
    setRecomputeMsg('')
    setError('')
    try {
      const res = await recomputeStatuses()
      setRecomputeMsg(`${res.updated} ta yozuv yangilandi`)
      setConfirmOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Qayta hisoblashda xatolik')
    } finally {
      setRecomputing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Sozlamalar</h1>
        <p className="text-sm text-gray-500">Ish jadvali va statuslar</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-4" />
              <div className="h-10 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Ish vaqti</h2>
                <p className="text-xs text-gray-500">
                  Hodimlar shu oraliqda ishlashi kutiladi. Status (kelgan / kech qolgan / erta ketgan)
                  shu jadvalga qarab hisoblanadi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-gray-700 mb-1 block">Boshlanish</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700 mb-1 block">Tugash</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-gray-700 mb-1 block">
                    Kechikish chegarasi (daqiqa)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={lateMin}
                    onChange={e => setLateMin(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700 mb-1 block">
                    Erta ketish chegarasi (daqiqa)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={earlyMin}
                    onChange={e => setEarlyMin(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </label>
              </div>

              {formInvalid && startTime && endTime && (
                <p className="text-xs text-red-600">Tugash vaqti boshlanishdan keyin bo'lishi kerak</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || formInvalid}
                  className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
                {savedMsg && <span className="text-xs text-green-600">{savedMsg}</span>}
                {error && <span className="text-xs text-red-600">{error}</span>}
              </div>
            </div>
          )}

          {!loading && schedule && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mt-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  Mavjud yozuvlar uchun statuslarni qayta hisoblash
                </h2>
                <p className="text-xs text-gray-500">
                  Joriy ish jadvali bo'yicha barcha attendance yozuvlarining statusini qayta hisoblash.
                  Yangi yozuvlar avtomatik tarzda hisoblanadi — bu tugma faqat eski yozuvlar uchun.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={recomputing}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Statuslarni qayta hisoblash
                </button>
                {recomputeMsg && <span className="text-xs text-green-600">{recomputeMsg}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Statuslarni qayta hisoblash
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Barcha attendance yozuvlari uchun status joriy ish jadvali bo'yicha qayta
              hisoblanadi. Davom etilsinmi?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={recomputing}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleRecompute}
                disabled={recomputing}
                className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {recomputing ? 'Hisoblanmoqda...' : 'Qayta hisoblash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
