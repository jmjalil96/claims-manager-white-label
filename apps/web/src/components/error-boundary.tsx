import { Component, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // Future: Send to error tracking service (Sentry, etc.)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="w-full max-w-sm space-y-8 text-center">
            {/* Icon */}
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="size-8 text-red-600" />
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Algo salió mal
              </h1>
              <p className="text-base text-slate-500">
                Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
              </p>
            </div>

            {/* Error details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-left">
                <p className="font-mono text-xs text-red-600">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw size={18} />
                Reintentar
              </Button>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <Home size={18} />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
