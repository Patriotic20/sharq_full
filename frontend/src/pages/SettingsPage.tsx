import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createWorkSchedule,
  deleteWorkSchedule,
  listWorkSchedules,
  recomputeStatuses,
  updateWorkSchedule,
} from '../api/settings'
import { PermissionGate } from '../components/PermissionGate'
import WorkScheduleModal from '../components/WorkScheduleModal'
import { Badge } from '../components/ui/Badge'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import type {
  WorkSchedule,
  WorkScheduleCreate,
  WorkScheduleListResponse,
  WorkScheduleUpdate,
} from '../types/settings'

function formatTime(v: string): string {
  return v.length >= 5 ? v.slice(0, 5) : v
}

function SkeletonRow() {
  return (
    <tr>
      {[28, 160, 120, 80, 100, 100, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function SettingsPage() {
  const [data, setData] = useState<WorkScheduleListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput)

  const [createOpen, setCreateOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<WorkSchedule | null>(null)
  const [deleteSchedule, setDeleteSchedule] = useState<WorkSchedule | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [confirmRecompute, setConfirmRecompute] = useState(false)
  const [recomputing, setRecomputing] = useState(false)
  const [recomputeMsg, setRecomputeMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listWorkSchedules({
        page,
        size: 10,
        name: search || undefined,
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(payload: WorkScheduleCreate) {
    await createWorkSchedule(payload)
    await load()
  }

  async function handleUpdate(payload: WorkScheduleUpdate) {
    if (!editSchedule) return
    await updateWorkSchedule(editSchedule.id, payload)
    await load()
  }

  async function handleDelete() {
    if (!deleteSchedule) return
    setDeleteLoading(true)
    try {
      await deleteWorkSchedule(deleteSchedule.id)
      setDeleteSchedule(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "O'chirishda xatolik")
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleRecompute() {
    setRecomputing(true)
    setRecomputeMsg('')
    setError('')
    try {
      const res = await recomputeStatuses()
      setRecomputeMsg(`${res.updated} ta yozuv yangilandi`)
      setConfirmRecompute(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Qayta hisoblashda xatolik')
    } finally {
      setRecomputing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ish jadvallari</h1>
          {!loading && data && (
            <p className="text-sm text-gray-400 mt-0.5">{data.total} ta jadval</p>
          )}
        </div>
        <PermissionGate code="work_schedules:write">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700"
          >
            + Yangi jadval
          </button>
        </PermissionGate>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full max-w-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="Nom bo'yicha qidirish..."
            value={searchInput}
            onChange={e => {
              setPage(1)
              setSearchInput(e.target.value)
            }}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
              {error}
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Nomi', 'Vaqti', 'Kechikish / Erta ketish', "Bo'limlar", 'Guruhlar', ''].map(
                  (h, i, arr) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                        i === arr.length - 1 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <span className="text-3xl">🕒</span>
                      <p className="text-sm text-gray-400">Jadvallar topilmadi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map(s => (
                  <tr
                    key={s.id}
                    className="hover:bg-primary-50/50 group transition-colors align-top"
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{s.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{s.name}</div>
                      {s.applies_to_all && (
                        <Badge variant="blue" className="mt-1">
                          Standart
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400">Kechikish:</span>{' '}
                        {s.late_threshold_minutes} daq
                      </div>
                      <div>
                        <span className="text-gray-400">Erta ketish:</span>{' '}
                        {s.early_leave_threshold_minutes} daq
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.departments.length === 0 ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.departments.slice(0, 3).map(d => (
                            <Badge key={d.id} variant="gray">
                              {d.name}
                            </Badge>
                          ))}
                          {s.departments.length > 3 && (
                            <Badge variant="gray">+{s.departments.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.groups.length === 0 ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {s.groups.slice(0, 3).map(g => (
                            <Badge key={g.id} variant="gray">
                              {g.name}
                            </Badge>
                          ))}
                          {s.groups.length > 3 && (
                            <Badge variant="gray">+{s.groups.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <PermissionGate code="work_schedules:update">
                          <IconButton
                            icon={Pencil}
                            label="Tahrirlash"
                            onClick={() => setEditSchedule(s)}
                          />
                        </PermissionGate>
                        <PermissionGate code="work_schedules:delete">
                          <IconButton
                            icon={Trash2}
                            label="O'chirish"
                            variant="danger"
                            disabled={s.applies_to_all}
                            onClick={() => !s.applies_to_all && setDeleteSchedule(s)}
                          />
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

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Mavjud yozuvlar uchun statuslarni qayta hisoblash
            </h2>
            <p className="text-xs text-gray-500">
              Joriy ish jadvallari bo'yicha barcha attendance yozuvlarining statusini qayta
              hisoblash. Yangi yozuvlar avtomatik tarzda hisoblanadi — bu tugma faqat eski
              yozuvlar uchun yoki jadvallar o'zgartirilgandan keyin kerak.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PermissionGate code="work_schedules:update">
              <button
                onClick={() => setConfirmRecompute(true)}
                disabled={recomputing}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Statuslarni qayta hisoblash
              </button>
            </PermissionGate>
            {recomputeMsg && (
              <span className="text-xs text-green-600">{recomputeMsg}</span>
            )}
          </div>
        </div>
      </div>

      {createOpen && (
        <WorkScheduleModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}
      {editSchedule && (
        <WorkScheduleModal
          schedule={editSchedule}
          onClose={() => setEditSchedule(null)}
          onUpdate={handleUpdate}
        />
      )}
      {deleteSchedule && (
        <DeleteDialog
          title="Jadvalni o'chirish"
          description={`"${deleteSchedule.name}" jadvalini o'chirish? Bo'limlar va guruhlar bilan bog'lanishlar o'chiriladi, davomat statuslari keyingi qayta hisoblashgacha o'zgarmaydi.`}
          loading={deleteLoading}
          confirmLabel="O'chirish"
          loadingLabel="O'chirilmoqda..."
          onConfirm={handleDelete}
          onCancel={() => setDeleteSchedule(null)}
        />
      )}
      {confirmRecompute && (
        <DeleteDialog
          title="Statuslarni qayta hisoblash"
          description="Barcha davomat yozuvlari uchun status joriy ish jadvallari bo'yicha qayta hisoblanadi. Davom etilsinmi?"
          confirmLabel="Qayta hisoblash"
          loadingLabel="Hisoblanmoqda..."
          confirmVariant="primary"
          loading={recomputing}
          onConfirm={handleRecompute}
          onCancel={() => setConfirmRecompute(false)}
        />
      )}
    </div>
  )
}
