import { useState } from 'react'
import AttendancePage from './pages/AttendancePage'
import CameraPage from './pages/CameraPage'
import EmployeeAttendancePage from './pages/EmployeeAttendancePage'
import EmployeePage from './pages/EmployeePage'
import SettingsPage from './pages/SettingsPage'
import { cn } from './lib/utils'
import type { Employee } from './types/employee'

type Tab = 'attendance' | 'cameras' | 'employees' | 'settings'

const ClipboardIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const VideoIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.828v6.344a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'attendance', label: 'Davomat',    icon: <ClipboardIcon /> },
  { key: 'cameras',   label: 'Kameralar',   icon: <VideoIcon /> },
  { key: 'employees', label: 'Xodimlar',    icon: <UsersIcon /> },
  { key: 'settings',  label: 'Sozlamalar',  icon: <SettingsIcon /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('attendance')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  function handleViewAttendance(emp: Employee) {
    setSelectedEmployee(emp)
    setTab('attendance')
  }

  function handleBackFromEmployee() {
    setSelectedEmployee(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col">

        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base leading-none">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Sharq</p>
            <p className="text-slate-500 text-xs leading-tight">Nazorat tizimi</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-slate-800 mb-3" />

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedEmployee(null) }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                tab === t.key
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-600">v1.0.0 · Sharq &copy; 2026</p>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'attendance' && selectedEmployee
          ? <EmployeeAttendancePage employee={selectedEmployee} onBack={handleBackFromEmployee} />
          : tab === 'attendance'
          ? <AttendancePage />
          : tab === 'cameras'
          ? <CameraPage />
          : tab === 'employees'
          ? <EmployeePage onViewAttendance={handleViewAttendance} />
          : <SettingsPage />
        }
      </main>
    </div>
  )
}
