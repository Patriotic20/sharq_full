import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteAttendance, listAttendances, updateAttendance } from '../api/attendance'
import AttendanceModal from '../components/AttendanceModal'
import { PermissionGate } from '../components/PermissionGate'
import { Badge, PRESENCE_LABEL, PRESENCE_VARIANT, STATUS_LABEL, STATUS_VARIANT } from '../components/ui/Badge'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { Pagination } from '../components/ui/Pagination'
import type { Employee } from '../types/employee'
import type { Attendance, AttendanceListResponse, AttendanceUpdate } from '../types/attendance'

interface Props {
  employee: Employee
  onBack: () => void
}

function fmt(iso: string | null) {
  if (!iso) return <span className="text-gray-200 select-none">—</span>
  return (
    <span className="tabular-nums">
      {new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function SkeletonRow() {
  return (
    <tr>
      {[64, 48, 72, 48, 72, 64, 72, 40].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

interface StatCardProps { label: string; count: number; color: string }
function StatCard({ label, count, color }: StatCardProps) {
  return (
    <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${color}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-2xl font-bold tabular-nums">{count}</span>
    </div>
  )
}

export default function EmployeeAttendancePage({ employee, onBack }: Props) {
  const [data, setData] = useState<AttendanceListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [editItem, setEditItem] = useState<Attendance | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listAttendances({
        page,
        size: 20,
        employee_id: employee.id,
        status: statusFilter || undefined,
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page, employee.id, statusFilter])

  useEffect(() => { load() }, [load])

  const stats = useMemo(() => ({
    present:    (data?.items ?? []).filter(a => a.status === 'present').length,
    late:       (data?.items ?? []).filter(a => a.status === 'late').length,
    absent:     (data?.items ?? []).filter(a => a.status === 'absent').length,
    left_early: (data?.items ?? []).filter(a => a.status === 'left_early').length,
  }), [data])

  async function handleUpdate(upd: AttendanceUpdate) {
    if (!editItem) return
    await updateAttendance(editItem.id, upd)
    await load()
  }

  async function handleDelete() {
    if (deleteId === null) return
    setDeleteLoading(true)
    try { await deleteAttendance(deleteId); setDeleteId(null); await load() }
    finally { setDeleteLoading(false) }
  }

  function getRowDate(a: Attendance) {
    if (a.enter_time) return fmtDate(a.enter_time)
    if (a.exit_time)  return fmtDate(a.exit_time)
    return fmtDate(a.created_at)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Orqaga
        </button>
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 truncate">
            {employee.last_name} {employee.first_name}
          </h1>
          <p className="text-sm text-gray-400">{employee.middle_name}</p>
        </div>
        {!loading && data && (
          <span className="ml-auto text-sm text-gray-400">{data.total} ta yozuv</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Keldi"      count={stats.present}    color="bg-green-50 text-green-800 ring-1 ring-inset ring-green-200" />
          <StatCard label="Kech keldi" count={stats.late}       color="bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-200" />
          <StatCard label="Erta ketdi" count={stats.left_early} color="bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-200" />
          <StatCard label="Kelmadi"    count={stats.absent}     color="bg-red-50 text-red-800 ring-1 ring-inset ring-red-200" />
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
          <select
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={statusFilter}
            onChange={e => { setPage(1); setStatusFilter(e.target.value) }}
          >
            <option value="">Barcha holatlar</option>
            <option value="present">Keldi</option>
            <option value="absent">Kelmadi</option>
            <option value="late">Kech keldi</option>
            <option value="left_early">Erta ketdi</option>
          </select>
          {statusFilter && (
            <button
              onClick={() => { setStatusFilter(''); setPage(1) }}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              Tozalash
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Sana', 'Kirish', 'Kirish kamerasi', 'Chiqish', 'Chiqish kamerasi', 'Holat', 'Mavjudlik', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <span className="text-3xl">📋</span>
                      <p className="text-sm text-gray-400">Davomat yozuvlari topilmadi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 group transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium tabular-nums whitespace-nowrap">
                      {getRowDate(a)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmt(a.enter_time)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {a.enter_camera?.ip_address ?? <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmt(a.exit_time)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {a.exit_camera?.ip_address ?? <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {a.presence_status
                        ? <Badge variant={PRESENCE_VARIANT[a.presence_status]}>{PRESENCE_LABEL[a.presence_status]}</Badge>
                        : <span className="text-gray-200 select-none">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PermissionGate code="attendances:write">
                          <button
                            onClick={() => setEditItem(a)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Tahrirlash
                          </button>
                        </PermissionGate>
                        <PermissionGate code="attendances:write">
                          <button
                            onClick={() => setDeleteId(a.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            O'chirish
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <Pagination page={page} pages={data?.pages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      {editItem && (
        <AttendanceModal
          attendance={editItem}
          onClose={() => setEditItem(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleteId !== null && (
        <DeleteDialog
          title="Yozuvni o'chirish"
          description={`#${deleteId} davomat yozuvini o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
