import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { deleteAttendance, listAttendances, updateAttendance } from '../api/attendance'
import AttendanceEventsTimeline from '../components/AttendanceEventsTimeline'
import AttendanceModal from '../components/AttendanceModal'
import { PermissionGate } from '../components/PermissionGate'
import { Badge, PRESENCE_LABEL, PRESENCE_VARIANT, STATUS_LABEL, STATUS_VARIANT } from '../components/ui/Badge'
import { Calendar } from '../components/ui/Calendar'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import { APP_TZ, cn, formatWorked, todayYMDInAppTZ } from '../lib/utils'
import type { Attendance, AttendanceListResponse, AttendanceUpdate } from '../types/attendance'

const COLUMN_COUNT = 9


function fmt(iso: string | null) {
  if (!iso) return <span className="text-gray-200 select-none">—</span>
  return (
    <span className="tabular-nums">
      {new Date(iso).toLocaleTimeString('uz-UZ', {
        hour: '2-digit', minute: '2-digit', timeZone: APP_TZ,
      })}
    </span>
  )
}

interface StatRowProps { label: string; count: number; dotClass: string }
function StatRow({ label, count, dotClass }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotClass)} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900 tabular-nums">{count}</span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-2 py-3">
        <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-1" />
        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
      </td>
      {[48, 72, 48, 72, 48, 64, 72, 40].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [date, setDate] = useState(() => todayYMDInAppTZ())
  const [statusFilter, setStatusFilter] = useState('')
  const [presenceFilter, setPresenceFilter] = useState('')
  const [editItem, setEditItem] = useState<Attendance | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listAttendances({
        page, size: 50,
        date: date || undefined,
        status: statusFilter || undefined,
        presence_status: presenceFilter || undefined,
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page, date, statusFilter, presenceFilter])

  useEffect(() => { load() }, [load])

  function handleDateChange(ymd: string) {
    setDate(ymd); setPage(1); setStatusFilter(''); setPresenceFilter('')
  }

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

  const formattedDate = date
    ? new Date(date + 'T12:00:00+05:00').toLocaleDateString('uz-UZ', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: APP_TZ,
      })
    : 'Barcha kunlar'

  const hasFilters = !!statusFilter || !!presenceFilter

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Davomat</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 items-start" style={{ gridTemplateColumns: '280px 1fr' }}>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <div className="space-y-4 sticky top-0">

            {/* Calendar */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <Calendar selected={date} onChange={handleDateChange} />
            </div>

            {/* Day stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Kunlik xulosa
              </p>

              {loading ? (
                <div className="space-y-0 mt-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-100 animate-pulse" />
                        <div className="h-3.5 w-20 bg-gray-100 rounded animate-pulse" />
                      </div>
                      <div className="h-3.5 w-4 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  <StatRow label="Keldi"       count={stats.present}    dotClass="bg-green-400" />
                  <StatRow label="Kelmadi"     count={stats.absent}     dotClass="bg-red-400" />
                  <StatRow label="Kech keldi"  count={stats.late}       dotClass="bg-yellow-400" />
                  <StatRow label="Erta ketdi"  count={stats.left_early} dotClass="bg-orange-400" />
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Jami</span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {loading ? '—' : (data?.total ?? 0)}
                </span>
              </div>

              {hasFilters && (
                <p className="mt-2 text-xs text-gray-400">* Filtr qo'llanilgan</p>
              )}
            </div>
          </div>

          {/* ── Main ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Day header + filters */}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate capitalize">
                  {formattedDate}
                </h2>
                {!loading && data && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data.total} ta yozuv{hasFilters ? ' (filtrlangan)' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
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

                <select
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={presenceFilter}
                  onChange={e => { setPage(1); setPresenceFilter(e.target.value) }}
                >
                  <option value="">Barcha mavjudlik</option>
                  <option value="complete">To'liq</option>
                  <option value="no_exit">Chiqmagan</option>
                  <option value="no_entry">Kirmagan</option>
                </select>

                {hasFilters && (
                  <button
                    onClick={() => { setStatusFilter(''); setPresenceFilter('') }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                  >
                    Tozalash
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {error && (
                <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
              )}

              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="w-8 px-2 py-3" />
                    {['Xodim', 'Kirish', 'Kirish kamerasi', 'Chiqish', 'Chiqish kamerasi', 'Jami', 'Holat', 'Mavjudlik', ''].map((h, i) => (
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
                      <td colSpan={COLUMN_COUNT + 1} className="px-4 py-16 text-center">
                        <div className="inline-flex flex-col items-center gap-2">
                          <span className="text-3xl">📋</span>
                          <p className="text-sm text-gray-400">Bu kun uchun ma'lumot yo'q</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data?.items.map(a => {
                      const expanded = expandedId === a.id
                      return (
                        <Fragment key={a.id}>
                          <tr
                            className={cn(
                              'hover:bg-primary-50/40 group transition-colors cursor-pointer',
                              expanded && 'bg-primary-50/30'
                            )}
                            onClick={() => setExpandedId(expanded ? null : a.id)}
                          >
                            <td className="px-2 py-3 text-gray-400">
                              {expanded
                                ? <ChevronDown size={16} />
                                : <ChevronRight size={16} />
                              }
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900 leading-tight">
                                {a.employee.last_name} {a.employee.first_name}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{a.employee.middle_name}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{fmt(a.enter_time)}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-400">
                              {a.enter_camera?.ip_address ?? <span className="text-gray-200">—</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{fmt(a.exit_time)}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-400">
                              {a.exit_camera?.ip_address ?? <span className="text-gray-200">—</span>}
                            </td>
                            <td className="px-4 py-3 font-mono text-sm tabular-nums text-gray-800">
                              {formatWorked(a.worked_seconds)}
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
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-1 justify-end">
                                <PermissionGate code="attendances:update">
                                  <IconButton
                                    icon={Pencil}
                                    label="Tahrirlash"
                                    onClick={() => setEditItem(a)}
                                  />
                                </PermissionGate>
                                <PermissionGate code="attendances:delete">
                                  <IconButton
                                    icon={Trash2}
                                    label="O'chirish"
                                    variant="danger"
                                    onClick={() => setDeleteId(a.id)}
                                  />
                                </PermissionGate>
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={COLUMN_COUNT + 1} className="px-6 py-4">
                                <AttendanceEventsTimeline
                                  events={a.events}
                                  workedSeconds={a.worked_seconds}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>

              <Pagination page={page} pages={data?.pages ?? 1} onPageChange={setPage} />
            </div>
          </div>
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
