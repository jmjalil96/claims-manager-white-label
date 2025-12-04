import { cn } from '@/lib/utils'

interface DetailSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  columns?: 1 | 2 | 3
}

export function DetailSection({
  title,
  icon,
  children,
  className,
  columns = 2,
}: DetailSectionProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <section className={cn('rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5', className)}>
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        {icon && <span className="text-slate-500">{icon}</span>}
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      </header>
      <div className={cn('grid gap-4 p-4', gridCols[columns])}>
        {children}
      </div>
    </section>
  )
}
