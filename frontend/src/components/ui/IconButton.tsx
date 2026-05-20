import type { LucideIcon } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'neutral' | 'danger'

interface BaseProps {
  icon: LucideIcon
  label: string
  variant?: Variant
}

interface ButtonProps extends BaseProps {
  to?: undefined
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}

interface LinkProps extends BaseProps {
  to: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

type IconButtonProps = ButtonProps | LinkProps

const VARIANTS: Record<Variant, string> = {
  neutral: 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
  danger: 'text-gray-400 hover:text-red-600 hover:bg-red-50',
}

const BASE = 'inline-flex items-center justify-center p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none'

export function IconButton(props: IconButtonProps) {
  const { icon: Icon, label, variant = 'neutral' } = props
  const className = `${BASE} ${VARIANTS[variant]}`

  if ('to' in props && props.to !== undefined) {
    return (
      <Link
        to={props.to}
        title={label}
        aria-label={label}
        onClick={props.onClick}
        className={className}
      >
        <Icon size={16} strokeWidth={1.75} />
      </Link>
    )
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={props.onClick}
      disabled={props.disabled}
      className={className}
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  )
}
