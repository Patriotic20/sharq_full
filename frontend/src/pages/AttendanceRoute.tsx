import { useLocation, useNavigate } from 'react-router-dom'
import AttendancePage from './AttendancePage'
import EmployeeAttendancePage from './EmployeeAttendancePage'
import type { Employee } from '../types/employee'

interface LocationState {
  employee?: Employee
}

export default function AttendanceRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null
  const employee = state?.employee ?? null

  if (employee) {
    return (
      <EmployeeAttendancePage
        employee={employee}
        onBack={() => navigate('/davomat', { replace: true })}
      />
    )
  }
  return <AttendancePage />
}
