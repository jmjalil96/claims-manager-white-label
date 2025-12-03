import { Spinner } from './spinner'

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" className="text-teal-600" />
    </div>
  )
}
