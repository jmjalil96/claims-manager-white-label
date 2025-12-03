import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { forgetPassword } from '@/lib/auth-client'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/features/auth/schemas'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { FormField } from '@/components/ui/form-field'

export const Route = createFileRoute('/_public/forgot-password')({
  component: ForgotPasswordComponent,
})

function ForgotPasswordComponent() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError('')

    try {
      const result = await forgetPassword({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (result?.error) {
        setError(result.error.message ?? 'No se pudo enviar el correo')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('No se pudo enviar el correo')
    }
  }

  const isLoading = form.formState.isSubmitting
  const { errors } = form.formState

  if (success) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="space-y-6">
            <span className="text-2xl font-bold tracking-tight text-teal-600">ClaimsManager360</span>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Correo enviado
              </h1>
              <p className="text-base text-slate-500">
                Revisa tu bandeja de entrada para continuar.
              </p>
            </div>
          </div>

          {/* Success Message */}
          <Alert variant="success" icon={<CheckCircle size={16} />}>
            Te enviamos un enlace para restablecer tu contraseña. Si no lo ves, revisa tu carpeta de
            spam.
          </Alert>

          {/* Back to Login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 transition-colors hover:text-teal-500"
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <span className="text-2xl font-bold tracking-tight text-teal-600">ClaimsManager360</span>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Recuperar contraseña
            </h1>
            <p className="text-base text-slate-500">
              Ingresa tu correo para recibir instrucciones.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-6">
          {error && <Alert>{error}</Alert>}

          <FormField
            label="Correo electrónico"
            name="email"
            error={errors.email?.message}
            required
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              disabled={isLoading}
              leftIcon={<Mail size={18} />}
              error={!!errors.email}
              {...form.register('email')}
            />
          </FormField>

          {/* Submit Button */}
          <Button
            type="submit"
            loading={isLoading}
            rightIcon={<ArrowRight size={18} />}
            className="w-full"
          >
            Enviar instrucciones
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500">
          ¿Recordaste tu contraseña?{' '}
          <Link
            to="/login"
            className="font-medium text-teal-600 transition-colors hover:text-teal-500"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
