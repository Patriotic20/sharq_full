import { useCallback, useEffect, useState } from 'react'
import { createCamera, deleteCamera, listCameras, updateCamera } from '../api/camera'
import CameraModal from '../components/CameraModal'
import { PermissionGate } from '../components/PermissionGate'
import { Badge, CAMERA_TYPE_LABEL, CAMERA_TYPE_VARIANT } from '../components/ui/Badge'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import type { Camera, CameraCreate, CameraListResponse, CameraUpdate } from '../types/camera'

function SkeletonRow() {
  return (
    <tr>
      {[28, 100, 72, 56, 72, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function CameraPage() {
  const [data, setData] = useState<CameraListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState({ ip_address: '', login: '', type: '' })
  const search = useDebounce(searchInput)

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Camera | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listCameras({ page, size: 10, ...search })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  function openEdit(camera: Camera) { setSelected(camera); setModal('edit') }
  function closeModal() { setModal(null); setSelected(null) }

  async function handleCreate(data: CameraCreate | CameraUpdate) {
    await createCamera(data as CameraCreate)
    await load()
  }
  async function handleUpdate(data: CameraCreate | CameraUpdate) {
    if (!selected) return
    await updateCamera(selected.id, data as CameraUpdate)
    await load()
  }
  async function handleDelete() {
    if (deleteId === null) return
    setDeleteLoading(true)
    try { await deleteCamera(deleteId); setDeleteId(null); await load() }
    finally { setDeleteLoading(false) }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kameralar</h1>
          {!loading && data && (
            <p className="text-sm text-gray-400 mt-0.5">{data.total} ta kamera</p>
          )}
        </div>
        <PermissionGate code="cameras:write">
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Kamera qo'shish
          </button>
        </PermissionGate>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-4 overflow-auto">

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[160px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="IP bo'yicha qidirish..."
            value={searchInput.ip_address}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, ip_address: e.target.value })) }}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[160px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="Login bo'yicha qidirish..."
            value={searchInput.login}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, login: e.target.value })) }}
          />
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchInput.type}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, type: e.target.value })) }}
          >
            <option value="">Barcha turlar</option>
            <option value="enter">Kirish</option>
            <option value="exit">Chiqish</option>
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
                {['ID', 'IP Manzil', 'Login', 'Tur', 'Yaratilgan', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <span className="text-3xl">📷</span>
                      <p className="text-sm text-gray-400">Kameralar topilmadi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map(camera => (
                  <tr key={camera.id} className="hover:bg-gray-50 group transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{camera.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 font-mono">{camera.ip_address}</td>
                    <td className="px-4 py-3 text-gray-600">{camera.login}</td>
                    <td className="px-4 py-3">
                      <Badge variant={CAMERA_TYPE_VARIANT[camera.type]}>
                        {CAMERA_TYPE_LABEL[camera.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">
                      {new Date(camera.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PermissionGate code="cameras:write">
                          <button
                            onClick={() => openEdit(camera)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Tahrirlash
                          </button>
                        </PermissionGate>
                        <PermissionGate code="cameras:write">
                          <button
                            onClick={() => setDeleteId(camera.id)}
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

      {modal === 'create' && <CameraModal onClose={closeModal} onSubmit={handleCreate} />}
      {modal === 'edit' && selected && <CameraModal camera={selected} onClose={closeModal} onSubmit={handleUpdate} />}

      {deleteId !== null && (
        <DeleteDialog
          title="Kamerani o'chirish"
          description={`#${deleteId} kamerani o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
