import { useEffect, useState } from 'react'
import { listDepartments } from '../api/department'
import { listEmployees } from '../api/employee'
import { listPositions } from '../api/position'
import type { Department } from '../types/department'
import type { Employee } from '../types/employee'
import type {
  EmployeeInfo,
  EmployeeInfoCreate,
  EmployeeInfoUpdate,
} from '../types/employeInfo'
import type { Position } from '../types/position'

interface Props {
  info: EmployeeInfo | null
  onClose: () => void
  onSubmit: (data: EmployeeInfoCreate | EmployeeInfoUpdate) => Promise<void>
}

const EMPTY = {
  employee_id: '',
  full_name: '',
  nationality: '',
  gender: '',
  birth_date: '',
  birth_place: '',
  residence_address: '',
  education: '',
  graduated_from: '',
  scientific_degree: '',
  scientific_title: '',
  work_experience: '',
  department_id: '',
  position_id: '',
  employment_rate: '',
  state_awards: '',
  foreign_languages: '',
  party_membership: '',
  email: '',
  phone_number: '',
}

export default function EmployeeInfoModal({ info, onClose, onSubmit }: Props) {
  const isEdit = info !== null
  const [form, setForm] = useState(EMPTY)
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (info) {
      setForm({
        employee_id:       String(info.employee_id),
        full_name:         info.full_name ?? '',
        nationality:       info.nationality ?? '',
        gender:            info.gender ?? '',
        birth_date:        info.birth_date ?? '',
        birth_place:       info.birth_place ?? '',
        residence_address: info.residence_address ?? '',
        education:         info.education ?? '',
        graduated_from:    info.graduated_from ?? '',
        scientific_degree: info.scientific_degree ?? '',
        scientific_title:  info.scientific_title ?? '',
        work_experience:   info.work_experience ?? '',
        department_id:     info.department_id != null ? String(info.department_id) : '',
        position_id:       info.position_id != null ? String(info.position_id) : '',
        employment_rate:   info.employment_rate != null ? String(info.employment_rate) : '',
        state_awards:      info.state_awards ?? '',
        foreign_languages: info.foreign_languages ?? '',
        party_membership:  info.party_membership ?? '',
        email:             info.email ?? '',
        phone_number:      info.phone_number ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [info])

  useEffect(() => {
    listDepartments({ page: 1, size: 100, order: 'asc' })
      .then(res => setDepartments(res.items))
      .catch(() => setDepartments([]))
    listEmployees({ page: 1, size: 200, order: 'asc' })
      .then(res => setEmployees(res.items))
      .catch(() => setEmployees([]))
    listPositions({ page: 1, size: 200, order: 'asc' })
      .then(res => setPositions(res.items))
      .catch(() => setPositions([]))
  }, [])

  const set = (field: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const basePayload = {
        full_name:         form.full_name,
        nationality:       form.nationality       || null,
        gender:            form.gender            || null,
        birth_date:        form.birth_date        || null,
        birth_place:       form.birth_place       || null,
        residence_address: form.residence_address || null,
        education:         form.education         || null,
        graduated_from:    form.graduated_from    || null,
        scientific_degree: form.scientific_degree || null,
        scientific_title:  form.scientific_title  || null,
        work_experience:   form.work_experience   || null,
        department_id:     form.department_id     ? Number(form.department_id) : null,
        position_id:       form.position_id       ? Number(form.position_id) : null,
        employment_rate:   form.employment_rate   ? Number(form.employment_rate) : null,
        state_awards:      form.state_awards      || null,
        foreign_languages: form.foreign_languages || null,
        party_membership:  form.party_membership  || null,
        email:             form.email             || null,
        phone_number:      form.phone_number      || null,
      }
      if (isEdit) {
        await onSubmit(basePayload as EmployeeInfoUpdate)
      } else {
        if (!form.employee_id) {
          setError('Xodimni tanlang')
          setLoading(false)
          return
        }
        await onSubmit({
          ...basePayload,
          employee_id: Number(form.employee_id),
        } as EmployeeInfoCreate)
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {isEdit ? "Xodim ma'lumotini tahrirlash" : "Yangi xodim ma'lumoti"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {!isEdit && (
              <div className="md:col-span-2">
                <label className={labelClass}>Xodim *</label>
                <select
                  className={fieldClass}
                  value={form.employee_id}
                  onChange={e => set('employee_id', e.target.value)}
                  required
                >
                  <option value="">— Xodimni tanlang —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.last_name} {emp.first_name} {emp.middle_name} (#{emp.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className={labelClass}>To'liq F.I.O *</label>
              <input
                className={fieldClass}
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Millati</label>
              <input className={fieldClass} value={form.nationality}
                onChange={e => set('nationality', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Jinsi</label>
              <select
                className={fieldClass}
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
              >
                <option value="">—</option>
                <option value="erkak">erkak</option>
                <option value="ayol">ayol</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Tug'ilgan sanasi</label>
              <input
                type="date"
                className={fieldClass}
                value={form.birth_date}
                onChange={e => set('birth_date', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Ma'lumoti</label>
              <input className={fieldClass} value={form.education}
                onChange={e => set('education', e.target.value)}
                placeholder="oliy / O'rta-maxsus / ..." />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Tug'ilgan manzili</label>
              <input className={fieldClass} value={form.birth_place}
                onChange={e => set('birth_place', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Yashash manzili</label>
              <input className={fieldClass} value={form.residence_address}
                onChange={e => set('residence_address', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Tamomlagan</label>
              <input className={fieldClass} value={form.graduated_from}
                onChange={e => set('graduated_from', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Ilmiy darajasi</label>
              <input className={fieldClass} value={form.scientific_degree}
                onChange={e => set('scientific_degree', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Ilmiy unvon</label>
              <input className={fieldClass} value={form.scientific_title}
                onChange={e => set('scientific_title', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Mehnat faoliyati</label>
              <textarea className={`${fieldClass} min-h-[80px]`} value={form.work_experience}
                onChange={e => set('work_experience', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Bo'lim</label>
              <select
                className={fieldClass}
                value={form.department_id}
                onChange={e => set('department_id', e.target.value)}
              >
                <option value="">— Bo'limsiz —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Lavozim</label>
              <select
                className={fieldClass}
                value={form.position_id}
                onChange={e => set('position_id', e.target.value)}
              >
                <option value="">— Lavozimsiz —</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Ish stavkasi</label>
              <input type="number" step="0.25" min="0" max="9.99"
                className={fieldClass} value={form.employment_rate}
                onChange={e => set('employment_rate', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Partiyaviyligi</label>
              <input className={fieldClass} value={form.party_membership}
                onChange={e => set('party_membership', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Davlat mukofotlari</label>
              <textarea className={`${fieldClass} min-h-[60px]`} value={form.state_awards}
                onChange={e => set('state_awards', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Chet tillari</label>
              <input className={fieldClass} value={form.foreign_languages}
                onChange={e => set('foreign_languages', e.target.value)}
                placeholder="masalan: Ingliz tili, Rus tili" />
            </div>

            <div>
              <label className={labelClass}>Elektron pochta</label>
              <input type="email" className={fieldClass} value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>

            <div>
              <label className={labelClass}>Telefon raqami</label>
              <input className={fieldClass} value={form.phone_number}
                onChange={e => set('phone_number', e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
