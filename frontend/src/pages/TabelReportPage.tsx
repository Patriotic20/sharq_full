import { Download, FileSpreadsheet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createAttendance, deleteAttendance, updateAttendance } from '../api/attendance'
import { listDepartments } from '../api/department'
import { downloadTabel, fetchTabelGrid } from '../api/reports'
import TabelCellPopover from '../components/TabelCellPopover'
import { cn } from '../lib/utils'
import type { Department } from '../types/department'
import {
  CODE_TO_STATE,
  type TabelCode,
  type TabelData,
  type TabelDayCell,
} from '../types/tabel'

const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]

const LEGEND: { code: TabelCode | 'A'; label: string }[] = [
  { code: 'B',  label: 'Haqiqatda ishlangan kunlar' },
  { code: 'O',  label: 'Bayramda ishlangan kunlar' },
  { code: 'A',  label: 'Dam olish va bayram kunlari' },
  { code: 'F',  label: 'Mehnatga layoqatsizlik' },
  { code: 'V',  label: "Ma'muriyat ruxsati bilan" },
  { code: 'G',  label: "O'quv ta'tili" },
  { code: 'N',  label: "O'qish bo'yicha dam olishlar" },
  { code: 'RP', label: "Yillik mehnat ta'tili" },
  { code: 'R',  label: "Tug'ish bilan bog'liq ta'tillar" },
  { code: 'OU', label: 'Davlat oldidagi majburiyatlar' },
  { code: 'P',  label: 'Progullar' },
]

function cellClass(cell: TabelDayCell): string {
  if (cell.is_holiday) return 'bg-gray-200 text-gray-700'
  if (['B', 'O'].includes(cell.code)) return 'bg-green-100 text-green-800'
  if (cell.code === 'P') return 'bg-red-100 text-red-800'
  if (['F', 'V', 'G', 'N', 'RP', 'R', 'OU'].includes(cell.code)) return 'bg-yellow-100 text-yellow-800'
  if (cell.is_weekend) return 'bg-gray-100 text-gray-500'
  return 'bg-white text-gray-400'
}

export default function TabelReportPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [grid, setGrid] = useState<TabelData | null>(null)
  const [loadingGrid, setLoadingGrid] = useState(false)
  const [loadingDl, setLoadingDl] = useState(false)
  const [error, setError] = useState('')
  const [openCell, setOpenCell] = useState<{ empId: number; date: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listDepartments({ size: 100 })
      .then(res => setDepartments(res.items))
      .catch(() => {})
  }, [])

  const loadGrid = useCallback(async () => {
    setLoadingGrid(true)
    setError('')
    try {
      const data = await fetchTabelGrid({
        year,
        month,
        department_id: departmentId === '' ? undefined : departmentId,
      })
      setGrid(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoadingGrid(false)
    }
  }, [year, month, departmentId])

  useEffect(() => { loadGrid() }, [loadGrid])

  const handleDownload = useCallback(async () => {
    setLoadingDl(true)
    setError('')
    try {
      const { blob, filename } = await downloadTabel({
        year,
        month,
        department_id: departmentId === '' ? undefined : departmentId,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yuklab olishda xatolik')
    } finally {
      setLoadingDl(false)
    }
  }, [year, month, departmentId])

  async function applyEdit(empId: number, cell: TabelDayCell, newCode: TabelCode | null) {
    setSaving(true)
    setError('')
    try {
      if (newCode === null) {
        if (cell.attendance_id !== null) {
          await deleteAttendance(cell.attendance_id)
        }
      } else {
        const { status, leave_type } = CODE_TO_STATE[newCode]
        if (cell.attendance_id !== null) {
          await updateAttendance(cell.attendance_id, { status, leave_type })
        } else {
          await createAttendance({
            employee_id: empId,
            date: cell.date,
            status,
            leave_type,
          })
        }
      }
      setOpenCell(null)
      await loadGrid()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
  const days = grid ? grid.days_in_month : 31

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <FileSpreadsheet className="w-6 h-6 text-primary-600" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">TABEL hisobot</h1>
          <p className="text-sm text-gray-400 mt-0.5">Oylik ish vaqti hisobi (ko'rish + tahrirlash + Excel eksport)</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">

        {/* Selectors + download */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Oy</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
              >
                {MONTHS_UZ.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Yil</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bo'lim</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Barcha xodimlar</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button
              onClick={handleDownload}
              disabled={loadingDl}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {loadingDl ? 'Yuklanmoqda…' : 'Yuklab olish (.xlsx)'}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>
        )}

        {/* Grid */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loadingGrid && !grid ? (
            <div className="p-10 text-center text-sm text-gray-400">Yuklanmoqda…</div>
          ) : !grid || grid.employees.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              Bu oyda xodimlar topilmadi
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm">
                  <span className="font-semibold text-gray-800">{grid.kafedra_name}</span>
                  <span className="text-gray-400 ml-2">— {grid.month_name} {grid.year}, ish kunlari: {grid.working_days}</span>
                </div>
                {saving && <span className="text-xs text-gray-400">Saqlanmoqda…</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-center font-semibold text-gray-400 border-b border-gray-200 w-10">№</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-400 border-b border-gray-200 min-w-[180px]">F.I.O</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-400 border-b border-gray-200 min-w-[110px]">Lavozim</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-400 border-b border-gray-200 w-12">St.</th>
                      {Array.from({ length: days }, (_, i) => {
                        const d = new Date(grid.year, grid.month - 1, i + 1)
                        const isHoliday = grid.holiday_dates.includes(
                          `${grid.year}-${String(grid.month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`,
                        )
                        const isWknd = d.getDay() === 0 || d.getDay() === 6
                        return (
                          <th
                            key={i}
                            className={cn(
                              'px-1 py-2 text-center font-semibold text-gray-500 border-b border-gray-200 w-8 tabular-nums',
                              isHoliday && 'bg-gray-200',
                              !isHoliday && isWknd && 'bg-gray-100',
                            )}
                          >
                            {i + 1}
                          </th>
                        )
                      })}
                      <th className="px-2 py-2 text-center font-semibold text-gray-400 border-b border-gray-200 w-12">Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grid.employees.map((emp, rowIdx) => (
                      <tr key={emp.employee_id} className="hover:bg-gray-50/50">
                        <td className="px-2 py-1.5 text-center text-gray-400 border-b border-gray-50">{rowIdx + 1}</td>
                        <td className="px-3 py-1.5 text-gray-800 font-medium border-b border-gray-50 whitespace-nowrap">{emp.full_name}</td>
                        <td className="px-2 py-1.5 text-gray-500 border-b border-gray-50 whitespace-nowrap">{emp.position ?? '—'}</td>
                        <td className="px-2 py-1.5 text-center text-gray-500 tabular-nums border-b border-gray-50">{emp.employment_rate}</td>
                        {emp.days.map(cell => {
                          const isOpen = openCell?.empId === emp.employee_id && openCell.date === cell.date
                          return (
                            <td
                              key={cell.date}
                              className="border-b border-gray-50 p-0 relative"
                            >
                              <button
                                type="button"
                                onClick={() => setOpenCell({ empId: emp.employee_id, date: cell.date })}
                                className={cn(
                                  'w-full h-7 text-center text-xs font-bold transition-colors',
                                  cellClass(cell),
                                  isOpen && 'ring-2 ring-primary-500 ring-inset',
                                )}
                                title={cell.code || '—'}
                              >
                                {cell.code || ''}
                              </button>
                              {isOpen && (
                                <TabelCellPopover
                                  currentCode={cell.code}
                                  onSelect={code => applyEdit(emp.employee_id, cell, code)}
                                  onClose={() => setOpenCell(null)}
                                />
                              )}
                            </td>
                          )
                        })}
                        <td className="px-2 py-1.5 text-center font-bold text-gray-800 tabular-nums border-b border-gray-50">{emp.worked_days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Shartli belgilar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {LEGEND.map(({ code, label }) => (
              <div key={code} className="flex items-baseline gap-3 text-sm">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono font-semibold text-xs">{code}</span>
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
