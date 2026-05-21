import { CalendarDays, ChevronDown, ChevronRight, Pencil, Table as TableIcon, Trash2 } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { deleteAttendance, listAttendances, updateAttendance } from '../api/attendance'
import { AttendanceCalendar, MONTHS_UZ } from '../components/AttendanceCalendar'
import AttendanceEventsTimeline from '../components/AttendanceEventsTimeline'
import AttendanceModal from '../components/AttendanceModal'
import { PermissionGate } from '../components/PermissionGate'
import { Badge, PRESENCE_LABEL, PRESENCE_VARIANT, STATUS_LABEL, STATUS_VARIANT } from '../components/ui/Badge'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import { cn, formatWorked, toYMD } from '../lib/utils'

const EMPLOYEE_COL_COUNT = 10
import type { Employee } from '../types/employee'
import type { Attendance, AttendanceListResponse, AttendanceUpdate } from '../types/attendance'

interface Props {
  employee: Employee
  onBack: () => void
}

type ViewMode = 'table' | 'calendar'

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
      <td className="px-2 py-3">
        <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
      </td>
      {[64, 48, 72, 48, 72, 48, 64, 72, 40].map((w, i) => (
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

function getRowDate(a: Attendance) {
  if (a.enter_time) return fmtDate(a.enter_time)
  if (a.exit_time)  return fmtDate(a.exit_time)
  return fmtDate(a.created_at)
}

export default function EmployeeAttendancePage({ employee, onBack }: Props) {
  const now = new Date()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [calendarMonth, setCalendarMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  })

  const [data, setData] = useState<AttendanceListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [showAbsent, setShowAbsent] = useState(false)
  const [absentExpanded, setAbsentExpanded] = useState(false)

  const [editItem, setEditItem] = useState<Attendance | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (viewMode === 'calendar') {
        const { year, month } = calendarMonth
        const first = toYMD(new Date(year, month, 1))
        const last = toYMD(new Date(year, month + 1, 0))
        const res = await listAttendances({
          page: 1,
          size: 100,
          employee_id: employee.id,
          date_from: first,
          date_to: last,
        })
        setData(res)
      } else {
        const res = await listAttendances({
          page,
          size: 20,
          employee_id: employee.id,
          status: statusFilter || undefined,
        })
        setData(res)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [viewMode, calendarMonth, page, employee.id, statusFilter])

  useEffect(() => { load() }, [load])

  const items = data?.items ?? []

  const stats = useMemo(() => ({
    present:    items.filter(a => a.status === 'present').length,
    late:       items.filter(a => a.status === 'late').length,
    absent:     items.filter(a => a.status === 'absent').length,
    left_early: items.filter(a => a.status === 'left_early').length,
  }), [items])

  const monthLabel = useMemo(() => {
    if (viewMode === 'calendar') {
      return `${MONTHS_UZ[calendarMonth.month]} ${calendarMonth.year}`
    }
    return `${MONTHS_UZ[now.getMonth()]} ${now.getFullYear()}`
  }, [viewMode, calendarMonth, now])

  const visibleItems = useMemo(() => {
    if (statusFilter) return items
    if (showAbsent || absentExpanded) return items
    return items.filter(a => a.status !== 'absent')
  }, [items, statusFilter, showAbsent, absentExpanded])

  const hiddenAbsentCount = useMemo(
    () => (statusFilter || showAbsent || absentExpanded)
      ? 0
      : items.filter(a => a.status === 'absent').length,
    [items, statusFilter, showAbsent, absentExpanded],
  )

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

  function prevMonth() {
    setCalendarMonth(({ year, month }) => month === 0
      ? { year: year - 1, month: 11 }
      : { year, month: month - 1 })
  }
  function nextMonth() {
    setCalendarMonth(({ year, month }) => month === 11
      ? { year: year + 1, month: 0 }
      : { year, month: month + 1 })
  }
  function goToday() {
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() })
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

        {/* Monthly summary */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-2.5 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-800">{monthLabel}</span>
          <span className="text-gray-500 tabular-nums">
            <span className="text-green-700 font-medium">{stats.present}</span> keldi
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-yellow-700 font-medium">{stats.late}</span> kech
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-orange-700 font-medium">{stats.left_early}</span> erta
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-red-700 font-medium">{stats.absent}</span> kelmadi
          </span>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
          {viewMode === 'table' && (
            <>
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
              {!statusFilter && (
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showAbsent}
                    onChange={e => { setShowAbsent(e.target.checked); setAbsentExpanded(false) }}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Kelmadi kunlarini ko'rsatish
                </label>
              )}
            </>
          )}

          <div className="ml-auto inline-flex rounded-xl bg-gray-100 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <TableIcon className="w-4 h-4" />
              Jadval
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Kalendar
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>
        )}

        {viewMode === 'calendar' ? (
          loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              Yuklanmoqda…
            </div>
          ) : (
            <AttendanceCalendar
              year={calendarMonth.year}
              month={calendarMonth.month}
              items={items}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onToday={goToday}
              onDayClick={a => setEditItem(a)}
            />
          )
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-8 px-2 py-3" />
                  {['Sana', 'Kirish', 'Kirish kamerasi', 'Chiqish', 'Chiqish kamerasi', 'Jami', 'Holat', 'Mavjudlik', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : visibleItems.length === 0 && hiddenAbsentCount === 0 ? (
                  <tr>
                    <td colSpan={EMPLOYEE_COL_COUNT} className="px-4 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-2">
                        <span className="text-3xl">📋</span>
                        <p className="text-sm text-gray-400">Davomat yozuvlari topilmadi</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {visibleItems.map(a => {
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
                              <td colSpan={EMPLOYEE_COL_COUNT} className="px-6 py-4">
                                <AttendanceEventsTimeline
                                  events={a.events}
                                  workedSeconds={a.worked_seconds}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}

                    {hiddenAbsentCount > 0 && (
                      <tr className="bg-red-50/40 hover:bg-red-50 transition-colors">
                        <td colSpan={EMPLOYEE_COL_COUNT} className="px-4 py-2.5">
                          <button
                            onClick={() => setAbsentExpanded(v => !v)}
                            className="w-full flex items-center justify-between text-sm text-red-700 font-medium"
                          >
                            <span className="inline-flex items-center gap-2">
                              {absentExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              Kelmagan kunlar: {hiddenAbsentCount} ta
                            </span>
                            <span className="text-xs text-red-500 underline">
                              {absentExpanded ? 'Yashirish' : "Ko'rsatish"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>

            <Pagination page={page} pages={data?.pages ?? 1} onPageChange={setPage} />
          </div>
        )}
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
