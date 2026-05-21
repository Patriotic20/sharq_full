import {
  Badge,
  CAMERA_TYPE_LABEL,
  CAMERA_TYPE_VARIANT,
} from './ui/Badge'
import { formatEventTime, formatWorked } from '../lib/utils'
import type { AttendanceEvent } from '../types/attendance'

interface Props {
  events: AttendanceEvent[]
  workedSeconds: number
}

export default function AttendanceEventsTimeline({ events, workedSeconds }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-xs text-gray-500">
        O'tishlar yo'q
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">
        O'tishlar ({events.length})
      </div>
      <ol className="space-y-1.5">
        {events.map((ev, idx) => (
          <li
            key={ev.id}
            className="flex items-center gap-3 text-sm bg-white rounded-md px-3 py-2 border border-gray-100"
          >
            <span className="text-xs font-mono text-gray-400 w-6 tabular-nums">
              {idx + 1}.
            </span>
            <Badge variant={CAMERA_TYPE_VARIANT[ev.type] ?? 'gray'}>
              {CAMERA_TYPE_LABEL[ev.type] ?? ev.type}
            </Badge>
            <span className="font-mono tabular-nums text-gray-800">
              {formatEventTime(ev.event_time)}
            </span>
            <span className="text-gray-400 text-xs ml-auto">
              {ev.camera?.ip_address ?? '—'}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-baseline">
        <span className="text-xs text-gray-500">Jami ish vaqti</span>
        <span className="text-sm font-semibold text-gray-900 tabular-nums">
          {formatWorked(workedSeconds)}
        </span>
      </div>
    </div>
  )
}
