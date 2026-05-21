import { useEffect, useMemo, useState } from 'react'
import { listDepartments } from '../api/department'
import { listGroups } from '../api/group'
import type {
  WorkSchedule,
  WorkScheduleCreate,
  WorkScheduleUpdate,
} from '../types/settings'

const fieldClass =
  "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

function timeForInput(v: string | undefined): string {
  if (!v) return ''
  return v.length >= 5 ? v.slice(0, 5) : v
}

interface RefItem {
  id: number
  name: string
}

interface Props {
  schedule?: WorkSchedule | null
  onClose: () => void
  onCreate?: (data: WorkScheduleCreate) => Promise<void>
  onUpdate?: (data: WorkScheduleUpdate) => Promise<void>
}

export default function WorkScheduleModal({
  schedule,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const isEdit = !!schedule

  const [name, setName] = useState(schedule?.name ?? '')
  const [startTime, setStartTime] = useState(timeForInput(schedule?.start_time) || '09:00')
  const [endTime, setEndTime] = useState(timeForInput(schedule?.end_time) || '18:00')
  const [lateMin, setLateMin] = useState(schedule?.late_threshold_minutes ?? 0)
  const [earlyMin, setEarlyMin] = useState(schedule?.early_leave_threshold_minutes ?? 0)
  const [appliesToAll, setAppliesToAll] = useState(schedule?.applies_to_all ?? false)
  const [selectedDepts, setSelectedDepts] = useState<number[]>(
    schedule?.departments.map(d => d.id) ?? [],
  )
  const [selectedGroups, setSelectedGroups] = useState<number[]>(
    schedule?.groups.map(g => g.id) ?? [],
  )

  const [allDepts, setAllDepts] = useState<RefItem[]>([])
  const [allGroups, setAllGroups] = useState<RefItem[]>([])
  const [refsLoading, setRefsLoading] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([
      listDepartments({ page: 1, size: 100, order: 'asc' }),
      listGroups({ page: 1, size: 100, order: 'asc' }),
    ])
      .then(([deptRes, groupRes]) => {
        if (!alive) return
        setAllDepts(deptRes.items.map(d => ({ id: d.id, name: d.name })))
        setAllGroups(groupRes.items.map(g => ({ id: g.id, name: g.name })))
      })
      .catch(e => alive && setError(e instanceof Error ? e.message : "Ro'yxatlarni yuklab bo'lmadi"))
      .finally(() => alive && setRefsLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const formInvalid = useMemo(() => {
    if (!name.trim()) return true
    if (!startTime || !endTime) return true
    if (endTime <= startTime) return true
    return false
  }, [name, startTime, endTime])

  function toggle(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter(x => x !== id) : [...list, id]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (formInvalid) return
    setError('')
    setLoading(true)
    try {
      if (isEdit && onUpdate) {
        await onUpdate({
          name: name.trim(),
          start_time: startTime,
          end_time: endTime,
          late_threshold_minutes: lateMin,
          early_leave_threshold_minutes: earlyMin,
          applies_to_all: appliesToAll,
          department_ids: selectedDepts,
          group_ids: selectedGroups,
        })
      } else if (!isEdit && onCreate) {
        await onCreate({
          name: name.trim(),
          start_time: startTime,
          end_time: endTime,
          late_threshold_minutes: lateMin,
          early_leave_threshold_minutes: earlyMin,
          applies_to_all: appliesToAll,
          department_ids: selectedDepts,
          group_ids: selectedGroups,
        })
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Saqlashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {isEdit ? 'Ish jadvalini tahrirlash' : 'Yangi ish jadvali'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nomi</label>
            <input
              className={fieldClass}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={1}
              maxLength={100}
              autoFocus
              placeholder="Masalan: Ofis jadvali"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Boshlanish</label>
              <input
                type="time"
                className={fieldClass}
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Tugash</label>
              <input
                type="time"
                className={fieldClass}
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Kechikish chegarasi (daqiqa)</label>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={lateMin}
                onChange={e => setLateMin(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className={labelClass}>Erta ketish chegarasi (daqiqa)</label>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={earlyMin}
                onChange={e => setEarlyMin(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          {endTime && startTime && endTime <= startTime && (
            <p className="text-xs text-red-600">
              Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak
            </p>
          )}

          <label className="flex items-start gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={appliesToAll}
              onChange={e => setAppliesToAll(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-800">
                Barcha xodimlarga qo'llash
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Bu jadval — bo'limi alohida jadvalga bog'lanmagan xodimlar uchun standart
                jadval sifatida ishlatiladi. Faqat bitta jadval «standart» bo'lishi mumkin.
              </span>
            </span>
          </label>

          <div>
            <label className={labelClass}>Bo'limlar</label>
            <p className="text-xs text-gray-500 mb-2">
              Tanlangan bo'limlardagi xodimlar bu jadval bo'yicha hisoblanadi. Bitta
              bo'lim faqat bitta jadvalga bog'lanishi mumkin.
            </p>
            <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 p-2 space-y-1">
              {refsLoading ? (
                <p className="text-xs text-gray-400 px-2 py-1">Yuklanmoqda...</p>
              ) : allDepts.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 py-1">Bo'limlar yo'q</p>
              ) : (
                allDepts.map(d => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(d.id)}
                      onChange={() => setSelectedDepts(toggle(selectedDepts, d.id))}
                    />
                    <span>{d.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Guruhlar</label>
            <p className="text-xs text-gray-500 mb-2">
              Guruhlar kelajakdagi stsenariylar uchun (masalan, talabalar) saqlanadi.
              Bitta guruh faqat bitta jadvalga bog'lanishi mumkin.
            </p>
            <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 p-2 space-y-1">
              {refsLoading ? (
                <p className="text-xs text-gray-400 px-2 py-1">Yuklanmoqda...</p>
              ) : allGroups.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 py-1">Guruhlar yo'q</p>
              ) : (
                allGroups.map(g => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(g.id)}
                      onChange={() => setSelectedGroups(toggle(selectedGroups, g.id))}
                    />
                    <span>{g.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading || formInvalid}
              className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
