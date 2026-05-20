import { useState } from 'react'
import { cn, todayYMDInAppTZ, toYMD } from '../../lib/utils'

const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function buildDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const lead  = (first.getDay() + 6) % 7 // 0 = Monday
  const days: Date[] = []
  for (let i = lead - 1; i >= 0; i--) days.push(new Date(year, month, -i))
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  for (let n = 1; days.length < 42; n++) days.push(new Date(year, month + 1, n))
  return days
}

interface CalendarProps {
  selected: string
  onChange: (ymd: string) => void
}

export function Calendar({ selected, onChange }: CalendarProps) {
  const todayYMD = todayYMDInAppTZ()
  const seed = selected ? new Date(selected + 'T00:00:00') : new Date()
  const [year, setYear] = useState(seed.getFullYear())
  const [month, setMonth] = useState(seed.getMonth())

  const days = buildDays(year, month)
  const now  = new Date()
  const showTodayBtn = year !== now.getFullYear() || month !== now.getMonth()

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    onChange(todayYMD)
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl transition-colors"
        >
          ‹
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {MONTHS[month]} {year}
          </span>
          {showTodayBtn && (
            <button
              onClick={goToday}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl transition-colors"
        >
          ›
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const ymd     = toYMD(day)
          const inMonth = day.getMonth() === month
          const isToday = ymd === todayYMD
          const isSel   = ymd === selected
          const isWknd  = day.getDay() === 0 || day.getDay() === 6

          return (
            <button
              key={i}
              disabled={!inMonth}
              onClick={() => onChange(ymd)}
              className={cn(
                'h-8 w-full flex items-center justify-center text-sm rounded-lg transition-colors',
                isSel
                  ? 'bg-primary-600 text-white font-semibold shadow-sm'
                  : isToday
                  ? 'bg-primary-50 text-primary-700 font-semibold ring-1 ring-inset ring-primary-200'
                  : !inMonth
                  ? 'text-gray-200 cursor-default'
                  : isWknd
                  ? 'text-gray-400 hover:bg-gray-100'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
