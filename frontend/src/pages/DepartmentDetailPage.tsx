import { UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteDepartment,
  getDepartment,
  listDepartmentEmployees,
  updateDepartment,
} from '../api/department'
import { listEmployees, updateEmployee } from '../api/employee'
import DepartmentModal from '../components/DepartmentModal'
import { PermissionGate } from '../components/PermissionGate'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import type { Department, DepartmentUpdate } from '../types/department'
import type { Employee, EmployeeListResponse } from '../types/employee'

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const departmentId = Number(params.id)

  const [department, setDepartment] = useState<Department | null>(null)
  const [employees, setEmployees] = useState<EmployeeListResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [d, emps] = await Promise.all([
        getDepartment(departmentId),
        listDepartmentEmployees(departmentId, { page, size: 10 }),
      ])
      setDepartment(d)
      setEmployees(emps)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [departmentId, page])

  useEffect(() => { load() }, [load])

  async function handleUpdate(data: DepartmentUpdate) {
    await updateDepartment(departmentId, data)
    await load()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await deleteDepartment(departmentId)
      navigate('/bolimlar')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleRemove(emp: Employee) {
    setRemovingId(emp.id)
    try {
      await updateEmployee(emp.id, { department_id: null })
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleAdd(ids: number[]) {
    await Promise.all(
      ids.map(id => updateEmployee(id, { department_id: departmentId })),
    )
    await load()
  }

  if (loading && !department) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Yuklanmoqda...
      </div>
    )
  }

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-gray-500">Bo'lim topilmadi</p>
        <button onClick={() => navigate('/bolimlar')} className="text-sm text-primary-600 hover:underline">
          ← Bo'limlar ro'yxatiga
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <Link to="/bolimlar" className="text-xs text-gray-400 hover:text-primary-600">← Bo'limlar</Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">{department.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{department.employees_count} ta xodim</p>
        </div>
        <div className="flex gap-2">
          <PermissionGate code="departments:update">
            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Tahrirlash
            </button>
          </PermissionGate>
          <PermissionGate code="departments:delete">
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
            >
              O'chirish
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto space-y-4">

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Xodimlar</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Jami: {employees?.total ?? 0}
              </p>
            </div>
            <PermissionGate code="employees:update">
              <button
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700"
              >
                <UserPlus size={16} strokeWidth={1.75} />
                Xodim qo'shish
              </button>
            </PermissionGate>
          </div>

          {error && (
            <div className="px-6 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', "To'liq ism", 'Otasining ismi', 'Kamera ID', ''].map((h, i, arr) => (
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
              {employees?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <span className="text-3xl">👥</span>
                      <p className="text-sm text-gray-400">Bo'limda xodimlar yo'q</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees?.items.map(emp => (
                  <tr key={emp.id} className="hover:bg-primary-50/50 group transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{emp.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{emp.last_name} {emp.first_name}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.middle_name}</td>
                    <td className="px-4 py-3">
                      {emp.camera_user_id
                        ? <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{emp.camera_user_id}</span>
                        : <span className="text-gray-200 select-none">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <PermissionGate code="employees:update">
                          <IconButton
                            icon={X}
                            label="Olib tashlash"
                            variant="danger"
                            onClick={() => handleRemove(emp)}
                            disabled={removingId === emp.id}
                          />
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <Pagination page={page} pages={employees?.pages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      {editOpen && (
        <DepartmentModal
          department={department}
          onClose={() => setEditOpen(false)}
          onUpdate={handleUpdate}
        />
      )}
      {deleteOpen && (
        <DeleteDialog
          title="Удалить отдел"
          description={`Удалить отдел "${department.name}"? Сотрудники не будут удалены, но потеряют привязку к отделу.`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
      {pickerOpen && (
        <EmployeePicker
          excludeDepartmentId={departmentId}
          onClose={() => setPickerOpen(false)}
          onAdd={async ids => { await handleAdd(ids); setPickerOpen(false) }}
        />
      )}
    </div>
  )
}

interface PickerProps {
  excludeDepartmentId: number
  onClose: () => void
  onAdd: (ids: number[]) => Promise<void>
}

function EmployeePicker({ excludeDepartmentId, onClose, onAdd }: PickerProps) {
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query)
  const [items, setItems] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await listEmployees({
          page: 1,
          size: 20,
          last_name: debounced || undefined,
          order: 'asc',
        })
        if (!cancelled) {
          setItems(res.items.filter(e => e.department_id !== excludeDepartmentId))
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Xatolik')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [debounced, excludeDepartmentId])

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    if (selected.size === 0) return
    setSaving(true)
    setError('')
    try {
      await onAdd([...selected])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Xodim qo'shish</h2>

        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors mb-3"
          placeholder="Familiya bo'yicha qidirish..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />

        <div className="flex-1 overflow-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
          {loading ? (
            <p className="px-3 py-6 text-sm text-gray-400 text-center">Yuklanmoqda...</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-gray-400 text-center">Xodimlar topilmadi</p>
          ) : (
            items.map(emp => (
              <label key={emp.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary-600"
                  checked={selected.has(emp.id)}
                  onChange={() => toggle(emp.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{emp.last_name} {emp.first_name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {emp.middle_name}
                    {emp.department && <> · <span className="text-amber-600">Hozir: {emp.department.name}</span></>}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex justify-between items-center pt-4 mt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Tanlangan: {selected.size}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              Bekor qilish
            </button>
            <button type="button" onClick={handleSave} disabled={saving || selected.size === 0}
              className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Qo\'shilmoqda...' : "Qo'shish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
