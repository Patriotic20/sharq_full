import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEmployee } from '../api/employee'
import AttendancePage from './AttendancePage'
import EmployeeAttendancePage from './EmployeeAttendancePage'
import type { Employee } from '../types/employee'

export default function AttendanceRoute() {
  return <AttendancePage />
}

export function EmployeeAttendanceRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const employeeId = Number(id)
    if (!Number.isFinite(employeeId)) {
      navigate('/xodimlar', { replace: true })
      return
    }
    setLoading(true)
    getEmployee(employeeId)
      .then(setEmployee)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Xatolik yuz berdi'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Yuklanmoqda…
      </div>
    )
  }
  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-sm text-red-600">{error || 'Xodim topilmadi'}</p>
        <button
          onClick={() => navigate('/xodimlar')}
          className="text-sm text-primary-600 hover:text-primary-700 underline"
        >
          Xodimlarga qaytish
        </button>
      </div>
    )
  }

  return (
    <EmployeeAttendancePage
      employee={employee}
      onBack={() => navigate('/xodimlar')}
    />
  )
}
