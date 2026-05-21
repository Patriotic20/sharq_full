import { useState } from 'react'
import type { Attendance, AttendanceStatus, AttendanceUpdate, LeaveType, PresenceStatus } from '../types/attendance'
import { LEAVE_TYPE_LABEL } from '../types/attendance'
import AttendanceEventsTimeline from './AttendanceEventsTimeline'

interface Props {
  attendance: Attendance
  onClose: () => void
  onSubmit: (data: AttendanceUpdate) => Promise<void>
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present',    label: 'Keldi' },
  { value: 'absent',     label: 'Kelmadi' },
  { value: 'late',       label: 'Kech keldi' },
  { value: 'left_early', label: 'Erta ketdi' },
]

const PRESENCE_OPTIONS: { value: PresenceStatus | ''; label: string }[] = [
  { value: '',         label: '— Belgilanmagan —' },
  { value: 'complete', label: "To'liq" },
  { value: 'no_exit',  label: 'Chiqmagan' },
  { value: 'no_entry', label: 'Kirmagan' },
]

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function AttendanceModal({ attendance, onClose, onSubmit }: Props) {
  const [status, setStatus] = useState<AttendanceStatus>(attendance.status)
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus | ''>(attendance.presence_status ?? '')
  const [leaveType, setLeaveType] = useState<LeaveType | ''>(attendance.leave_type ?? '')
  const [enterTime, setEnterTime] = useState(toLocalInput(attendance.enter_time))
  const [exitTime, setExitTime] = useState(toLocalInput(attendance.exit_time))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: AttendanceUpdate = {
        status,
        presence_status: presenceStatus || null,
        leave_type: status === 'absent' ? (leaveType || null) : null,
        enter_time: enterTime ? new Date(enterTime).toISOString() : null,
        exit_time:  exitTime  ? new Date(exitTime).toISOString()  : null,
      }
      await onSubmit(payload)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Davomat tahrirlash</h2>
        <p className="text-sm text-gray-400 mb-5">
          {attendance.employee.last_name} {attendance.employee.first_name} · #{attendance.id}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Holat</label>
            <select className={fieldClass} value={status} onChange={e => setStatus(e.target.value as AttendanceStatus)}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Mavjudlik holati</label>
            <select className={fieldClass} value={presenceStatus} onChange={e => setPresenceStatus(e.target.value as PresenceStatus | '')}>
              {PRESENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {status === 'absent' && (
            <div>
              <label className={labelClass}>Yo'qlik sababi (tabel uchun)</label>
              <select className={fieldClass} value={leaveType} onChange={e => setLeaveType(e.target.value as LeaveType | '')}>
                <option value="">— Sababsiz (P/Progul) —</option>
                {(Object.keys(LEAVE_TYPE_LABEL) as LeaveType[]).map(k => (
                  <option key={k} value={k}>{LEAVE_TYPE_LABEL[k]}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Kirish vaqti</label>
            <input type="datetime-local" className={fieldClass} value={enterTime} onChange={e => setEnterTime(e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Chiqish vaqti</label>
            <input type="datetime-local" className={fieldClass} value={exitTime} onChange={e => setExitTime(e.target.value)} />
          </div>

          {attendance.events && attendance.events.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <AttendanceEventsTimeline
                events={attendance.events}
                workedSeconds={attendance.worked_seconds}
              />
              <p className="text-xs text-gray-400 mt-2">
                Qo'l bilan kirish/chiqish vaqtini o'zgartirish o'tishlar ro'yxati bilan
                avtomatik moslashtirilmaydi.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
