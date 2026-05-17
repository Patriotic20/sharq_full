interface PaginationProps {
  page: number
  pages: number
  onPageChange: (page: number) => void
}

type PageItem = number | 'dots'

function getPageItems(page: number, pages: number): PageItem[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)

  const items: PageItem[] = [1]
  if (page > 3) items.push('dots')

  const start = Math.max(2, page - 1)
  const end = Math.min(pages - 1, page + 1)
  for (let i = start; i <= end; i++) items.push(i)

  if (page < pages - 2) items.push('dots')
  items.push(pages)
  return items
}

export function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) return null

  const items = getPageItems(page, pages)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        {page} / {pages} sahifa
      </p>
      <div className="flex gap-1">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Oldingi
        </button>
        {items.map((item, idx) =>
          item === 'dots' ? (
            <span
              key={`dots-${idx}`}
              className="px-2 py-1.5 text-xs text-gray-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`px-3 py-1.5 text-xs rounded-lg border ${
                item === page
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          disabled={page === pages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Keyingi
        </button>
      </div>
    </div>
  )
}
