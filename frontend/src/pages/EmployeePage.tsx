import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { deleteEmployee, listEmployees, updateEmployee } from '../api/employee'
import EmployeeModal from '../components/EmployeeModal'
import { PermissionGate } from '../components/PermissionGate'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import type { Employee, EmployeeListResponse, EmployeeUpdate } from '../types/employee'

interface Props {
  onViewAttendance: (emp: Employee) => void
}

function SkeletonRow() {
  return (
    <tr>
      {[28, 140, 100, 100, 80, 72, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function EmployeePage({ onViewAttendance }: Props) {
  const [data, setData] = useState<EmployeeListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [searchInput, setSearchInput] = useState({ first_name: '', last_name: '', camera_user_id: '' })
  const search = useDebounce(searchInput)

  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listEmployees({ page, size: 10, order, ...search })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page, order, search])

  useEffect(() => { load() }, [load])

  async function handleUpdate(data: EmployeeUpdate) {
    if (!editEmployee) return
    await updateEmployee(editEmployee.id, data)
    await load()
  }

  async function handleDelete() {
    if (deleteId === null) return
    setDeleteLoading(true)
    try { await deleteEmployee(deleteId); setDeleteId(null); await load() }
    finally { setDeleteLoading(false) }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Xodimlar</h1>
          {!loading && data && (
            <p className="text-sm text-gray-400 mt-0.5">{data.total} ta xodim</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-4 overflow-auto">

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[150px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="Ism bo'yicha..."
            value={searchInput.first_name}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, first_name: e.target.value })) }}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[150px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="Familiya bo'yicha..."
            value={searchInput.last_name}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, last_name: e.target.value })) }}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[150px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="Kamera ID bo'yicha..."
            value={searchInput.camera_user_id}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, camera_user_id: e.target.value })) }}
          />
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            value={order}
            onChange={e => { setPage(1); setOrder(e.target.value as 'asc' | 'desc') }}
          >
            <option value="desc">Yangi avval</option>
            <option value="asc">Eski avval</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', "To'liq ism", 'Otasining ismi', "Bo'lim", 'Kamera ID', 'Yaratilgan', ''].map((h, i, arr) => (
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
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <span className="text-3xl">👤</span>
                      <p className="text-sm text-gray-400">Xodimlar topilmadi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map(emp => (
                  <tr
                    key={emp.id}
                    onClick={() => onViewAttendance(emp)}
                    className="hover:bg-primary-50/50 group transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{emp.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{emp.last_name} {emp.first_name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{emp.middle_name}</td>
                    <td className="px-4 py-3">
                      {emp.department
                        ? <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">{emp.department.name}</span>
                        : <span className="text-gray-200 select-none">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {emp.camera_user_id
                        ? <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{emp.camera_user_id}</span>
                        : <span className="text-gray-200 select-none">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">
                      {new Date(emp.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <PermissionGate code="employees:update">
                          <IconButton
                            icon={Pencil}
                            label="Редактировать"
                            onClick={e => { e.stopPropagation(); setEditEmployee(emp) }}
                          />
                        </PermissionGate>
                        <PermissionGate code="employees:delete">
                          <IconButton
                            icon={Trash2}
                            label="Удалить"
                            variant="danger"
                            onClick={e => { e.stopPropagation(); setDeleteId(emp.id) }}
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
      </div>

      {editEmployee && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleteId !== null && (
        <DeleteDialog
          title="Удалить сотрудника"
          description={`Удалить сотрудника #${deleteId}? Это действие необратимо.`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
