import { useMemo } from 'react'
import { cn, todayYMDInAppTZ, toYMD } from '../lib/utils'
import { STATUS_LABEL } from './ui/Badge'
import type { Attendance } from '../types/attendance'

const DOW = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
export const MONTHS_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]

const CELL_STYLE: Record<string, string> = {
  present:    'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 hover:bg-green-200',
  late:       'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 hover:bg-yellow-200',
  left_early: 'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200 hover:bg-orange-200',
  absent:     'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-200',
}

function buildDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const lead = (first.getDay() + 6) % 7
  const days: Date[] = []
  for (let i = lead - 1; i >= 0; i--) days.push(new Date(year, month, -i))
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  for (let n = 1; days.length < 42; n++) days.push(new Date(year, month + 1, n))
  return days
}

function getItemYMD(a: Attendance): string {
  const iso = a.enter_time ?? a.exit_time ?? a.created_at
  const d = new Date(iso)
  return toYMD(d)
}

interface Props {
  year: number
  month: number
  items: Attendance[]
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDayClick: (a: Attendance) => void
}

export function AttendanceCalendar({
  year, month, items, onPrevMonth, onNextMonth, onToday, onDayClick,
}: Props) {
  const todayYMD = todayYMDInAppTZ()
  const days = buildDays(year, month)
  const now = new Date()
  const showTodayBtn = year !== now.getFullYear() || month !== now.getMonth()

  const byDay = useMemo(() => {
    const map = new Map<string, Attendance>()
    for (const a of items) map.set(getItemYMD(a), a)
    return map
  }, [items])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          aria-label="Oldingi oy"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl transition-colors"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {MONTHS_UZ[month]} {year}
          </span>
          {showTodayBtn && (
            <button
              onClick={onToday}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Bugun
            </button>
          )}
        </div>
        <button
          onClick={onNextMonth}
          aria-label="Keyingi oy"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl transition-colors"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DOW.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const ymd = toYMD(day)
          const inMonth = day.getMonth() === month
          const isToday = ymd === todayYMD
          const rec = inMonth ? byDay.get(ymd) : undefined
          const style = rec ? CELL_STYLE[rec.status] : ''

          return (
            <button
              key={i}
              disabled={!inMonth || !rec}
              onClick={() => rec && onDayClick(rec)}
              title={rec ? STATUS_LABEL[rec.status] : ''}
              className={cn(
                'h-16 rounded-lg flex flex-col items-start justify-between p-2 text-left transition-colors',
                !inMonth && 'text-gray-200 cursor-default',
                inMonth && !rec && 'bg-gray-50 text-gray-400',
                inMonth && rec && 'cursor-pointer',
                style,
                isToday && inMonth && 'ring-2 ring-primary-400'
              )}
            >
              <span className={cn(
                'text-sm font-semibold tabular-nums',
                isToday && inMonth && 'text-primary-700'
              )}>
                {day.getDate()}
              </span>
              {rec && (
                <span className="text-[10px] font-medium leading-tight truncate w-full">
                  {STATUS_LABEL[rec.status]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <Legend color="bg-green-100 ring-green-200" label="Keldi" />
        <Legend color="bg-yellow-100 ring-yellow-200" label="Kech keldi" />
        <Legend color="bg-orange-100 ring-orange-200" label="Erta ketdi" />
        <Legend color="bg-red-100 ring-red-200" label="Kelmadi" />
        <Legend color="bg-gray-50 ring-gray-200" label="Ma'lumot yo'q" />
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-3 h-3 rounded ring-1 ring-inset', color)} />
      {label}
    </span>
  )
}
