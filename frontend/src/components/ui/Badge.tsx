import { cn } from '../../lib/utils'

export type BadgeVariant = 'green' | 'red' | 'yellow' | 'orange' | 'blue' | 'gray'

const VARIANT: Record<BadgeVariant, string> = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-gray-100 text-gray-600',
}

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', VARIANT[variant], className)}>
      {children}
    </span>
  )
}

export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  present:    'green',
  absent:     'red',
  late:       'yellow',
  left_early: 'orange',
}

export const STATUS_LABEL: Record<string, string> = {
  present:    'Keldi',
  absent:     'Kelmadi',
  late:       'Kech keldi',
  left_early: 'Erta ketdi',
}

export const PRESENCE_VARIANT: Record<string, BadgeVariant> = {
  complete:  'blue',
  no_exit:   'orange',
  no_entry:  'red',
}

export const PRESENCE_LABEL: Record<string, string> = {
  complete:  'To\'liq',
  no_exit:   'Chiqmagan',
  no_entry:  'Kirmagan',
}

export const CAMERA_TYPE_VARIANT: Record<string, BadgeVariant> = {
  enter: 'green',
  exit:  'red',
}

export const CAMERA_TYPE_LABEL: Record<string, string> = {
  enter: 'Kirish',
  exit:  'Chiqish',
}
