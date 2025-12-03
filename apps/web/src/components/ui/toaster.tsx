import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      visibleToasts={3}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'border rounded-lg shadow-lg p-3 gap-3',
          title: 'font-medium',
          description: 'text-sm',
          actionButton: 'bg-teal-600 text-white hover:bg-teal-700',
          cancelButton: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
          success: 'border-green-200 bg-green-50 text-green-600',
          error: 'border-red-200 bg-red-50 text-red-600',
          warning: 'border-amber-200 bg-amber-50 text-amber-600',
          info: 'border-blue-200 bg-blue-50 text-blue-600',
        },
      }}
    />
  )
}
