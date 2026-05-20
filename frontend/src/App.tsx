import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequirePermission } from './components/RequirePermission'
import { AuthProvider, useAuth } from './context/AuthContext'
import { cn } from './lib/utils'
import AttendanceRoute from './pages/AttendanceRoute'
import CameraPage from './pages/CameraPage'
import EmployeePage from './pages/EmployeePage'
import ForbiddenPage from './pages/ForbiddenPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RoleDetailPage from './pages/RoleDetailPage'
import RolesPage from './pages/RolesPage'
import SettingsPage from './pages/SettingsPage'
import UsersPage from './pages/UsersPage'

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

const ShieldIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const KeyIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/davomat',   label: 'Davomat',         icon: <ClipboardIcon />, permission: 'attendances:read' },
  { to: '/kameralar', label: 'Kameralar',       icon: <VideoIcon />,     permission: 'cameras:read' },
  { to: '/xodimlar',  label: 'Xodimlar',        icon: <UsersIcon />,     permission: 'employees:read' },
  { to: '/users',     label: 'Foydalanuvchilar', icon: <UserIcon />,     permission: 'users:read' },
  { to: '/roles',     label: 'Rollar',          icon: <ShieldIcon />,    permission: 'roles:read' },
  { to: '/sozlamalar', label: 'Sozlamalar',     icon: <SettingsIcon />,  permission: 'work_schedules:read' },
  { to: '/profile',   label: 'Profil',          icon: <KeyIcon /> },
]

function Sidebar() {
  const { user, permissions, logout } = useAuth()
  const navigate = useNavigate()

  const visible = NAV_ITEMS.filter(it => !it.permission || permissions.has(it.permission))

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col">
      <div className="px-5 py-6 flex items-center gap-3">
        <img
          src="/logo.jpg"
          alt="Sharq Universiteti"
          className="w-9 h-9 rounded-xl flex-shrink-0 object-contain bg-white/5"
        />
        <div>
          <p className="text-white font-bold text-base leading-tight">Sharq University</p>
          <p className="text-slate-500 text-xs leading-tight">Monitoring</p>
        </div>
      </div>

      <div className="mx-5 border-t border-slate-800 mb-3" />

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {visible.map(it => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            )}
          >
            {it.icon}
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-slate-800">
        {user && (
          <div className="px-2 py-2 mb-2">
            <p className="text-sm text-white font-medium truncate">{user.full_name ?? user.username}</p>
            <p className="text-xs text-slate-500 truncate">
              {user.role?.name ?? '—'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogoutIcon />
          Chiqish
        </button>
      </div>
    </aside>
  )
}

function AppShell() {
  const navigate = useNavigate()
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/davomat" element={
            <RequirePermission code="attendances:read"><AttendanceRoute /></RequirePermission>
          } />
          <Route path="/kameralar" element={
            <RequirePermission code="cameras:read"><CameraPage /></RequirePermission>
          } />
          <Route path="/xodimlar" element={
            <RequirePermission code="employees:read">
              <EmployeePage onViewAttendance={emp => navigate('/davomat', { state: { employee: emp } })} />
            </RequirePermission>
          } />
          <Route path="/sozlamalar" element={
            <RequirePermission code="work_schedules:read"><SettingsPage /></RequirePermission>
          } />
          <Route path="/users" element={
            <RequirePermission code="users:read"><UsersPage /></RequirePermission>
          } />
          <Route path="/roles" element={
            <RequirePermission code="roles:read"><RolesPage /></RequirePermission>
          } />
          <Route path="/roles/:id" element={
            <RequirePermission code="roles:read"><RoleDetailPage /></RequirePermission>
          } />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<Navigate to="/davomat" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
