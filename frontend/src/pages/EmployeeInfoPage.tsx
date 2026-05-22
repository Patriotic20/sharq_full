import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { listDepartments } from '../api/department'
import {
  createEmployeeInfo,
  deleteEmployeeInfo,
  listEmployeeInfo,
  updateEmployeeInfo,
} from '../api/employeInfo'
import EmployeeInfoModal from '../components/EmployeeInfoModal'
import { PermissionGate } from '../components/PermissionGate'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import type { Department } from '../types/department'
import type {
  EmployeeInfo,
  EmployeeInfoCreate,
  EmployeeInfoListResponse,
  EmployeeInfoUpdate,
} from '../types/employeInfo'

function SkeletonRow() {
  return (
    <tr>
      {[28, 160, 120, 100, 90, 80, 72, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function EmployeeInfoPage() {
  const [data, setData] = useState<EmployeeInfoListResponse | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [searchInput, setSearchInput] = useState({ full_name: '', department_id: '' })
  const search = useDebounce(searchInput)

  const [modalInfo, setModalInfo] = useState<EmployeeInfo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listEmployeeInfo({
        page,
        size: 10,
        order,
        full_name: search.full_name || undefined,
        department_id: search.department_id ? Number(search.department_id) : undefined,
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page, order, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    listDepartments({ page: 1, size: 100, order: 'asc' })
      .then(res => setDepartments(res.items))
      .catch(() => setDepartments([]))
  }, [])

  async function handleSubmit(payload: EmployeeInfoCreate | EmployeeInfoUpdate) {
    if (modalInfo) {
      await updateEmployeeInfo(modalInfo.id, payload as EmployeeInfoUpdate)
    } else {
      await createEmployeeInfo(payload as EmployeeInfoCreate)
    }
    await load()
  }

  async function handleDelete() {
    if (deleteId === null) return
    setDeleteLoading(true)
    try { await deleteEmployeeInfo(deleteId); setDeleteId(null); await load() }
    finally { setDeleteLoading(false) }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Xodimlar ma'lumoti</h1>
          {!loading && data && (
            <p className="text-sm text-gray-400 mt-0.5">{data.total} ta yozuv</p>
          )}
        </div>
        <PermissionGate code="employe_info:write">
          <button
            onClick={() => { setModalInfo(null); setModalOpen(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Qo'shish
          </button>
        </PermissionGate>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-auto">

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[200px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="F.I.O bo'yicha..."
            value={searchInput.full_name}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, full_name: e.target.value })) }}
          />
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            value={searchInput.department_id}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, department_id: e.target.value })) }}
          >
            <option value="">Barcha bo'limlar</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            value={order}
            onChange={e => { setPage(1); setOrder(e.target.value as 'asc' | 'desc') }}
          >
            <option value="desc">Yangi avval</option>
            <option value="asc">Eski avval</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['ID', "F.I.O", 'Lavozim', "Bo'lim", 'Telefon', 'Tug. sana', "Ma'lumoti", ''].map((h, i, arr) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === arr.length - 1 ? 'text-right' : 'text-left'}`}
                    >
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
                        <span className="text-3xl">👤</span>
                        <p className="text-sm text-gray-400">Yozuvlar topilmadi</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.items.map(info => (
                    <tr key={info.id} className="hover:bg-primary-50/50 group transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{info.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{info.full_name}</p>
                        <p className="text-xs text-gray-400">xodim #{info.employee_id}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {info.position?.name || <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {info.department
                          ? <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">{info.department.name}</span>
                          : <span className="text-gray-200 select-none">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {info.phone_number || <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">
                        {info.birth_date
                          ? new Date(info.birth_date).toLocaleDateString('uz-UZ')
                          : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {info.education || <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <PermissionGate code="employe_info:update">
                            <IconButton
                              icon={Pencil}
                              label="Редактировать"
                              onClick={e => { e.stopPropagation(); setModalInfo(info); setModalOpen(true) }}
                            />
                          </PermissionGate>
                          <PermissionGate code="employe_info:delete">
                            <IconButton
                              icon={Trash2}
                              label="Удалить"
                              variant="danger"
                              onClick={e => { e.stopPropagation(); setDeleteId(info.id) }}
                            />
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={data?.pages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      {modalOpen && (
        <EmployeeInfoModal
          info={modalInfo}
          onClose={() => { setModalOpen(false); setModalInfo(null) }}
          onSubmit={handleSubmit}
        />
      )}

      {deleteId !== null && (
        <DeleteDialog
          title="Yozuvni o'chirish"
          description={`Xodim ma'lumoti #${deleteId} o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
