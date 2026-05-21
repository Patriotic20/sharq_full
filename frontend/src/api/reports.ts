import { request, tokenStore } from './client'
import type { TabelData } from '../types/tabel'

const BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:8000/api/v1'

export interface TabelGridParams {
  year: number
  month: number
  department_id?: number
}

export function fetchTabelGrid({ year, month, department_id }: TabelGridParams): Promise<TabelData> {
  const q = new URLSearchParams({ year: String(year), month: String(month) })
  if (department_id) q.set('department_id', String(department_id))
  return request<TabelData>(`/reports/tabel?${q}`)
}

export interface TabelParams {
  year: number
  month: number
  department_id?: number
}

export async function downloadTabel({ year, month, department_id }: TabelParams): Promise<{ blob: Blob; filename: string }> {
  const q = new URLSearchParams({ year: String(year), month: String(month) })
  if (department_id) q.set('department_id', String(department_id))

  const token = tokenStore.getAccess()
  const res = await fetch(`${BASE}/reports/tabel.xlsx?${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Tabel yuklab olishda xatolik' }))
    throw new Error(err.detail ?? 'Tabel yuklab olishda xatolik')
  }
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition') ?? ''
  const match = cd.match(/filename="?([^";]+)"?/i)
  const filename = match?.[1] ?? `tabel_${year}_${String(month).padStart(2, '0')}.xlsx`
  return { blob, filename }
}
