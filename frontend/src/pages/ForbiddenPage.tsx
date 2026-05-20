import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 bg-gray-50">
      <span className="text-5xl">🔒</span>
      <h1 className="text-xl font-semibold text-gray-900">Ruxsat yo'q</h1>
      <p className="text-sm text-gray-500">Bu sahifaga kirish uchun ruxsatingiz yo'q</p>
      <Link to="/davomat" className="mt-2 text-sm text-primary-600 hover:underline">
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
