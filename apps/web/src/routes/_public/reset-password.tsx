import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, ArrowRight } from 'lucide-react'
import { z } from 'zod'
import { resetPassword } from '@/lib/auth-client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/auth'
import { toast } from '@/lib/toast'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button, PasswordInput, Alert, FormField } from '@/components/ui'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/_public/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordComponent,
})

function ResetPasswordComponent() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [error, setError] = useState('')

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setError('Token de recuperación no válido')
      return
    }

    setError('')

    try {
      const result = await resetPassword({
        newPassword: data.password,
        token,
      })

      if (result?.error) {
        const message = result.error?.message
        setError(message ?? 'No se pudo restablecer la contraseña')
      } else {
        toast.success('Contraseña actualizada', {
          description: 'Inicia sesión con tu nueva contraseña',
        })
        void navigate({ to: '/login' })
      }
    } catch {
      setError('No se pudo restablecer la contraseña')
    }
  }

  const isLoading = form.formState.isSubmitting
  const { errors } = form.formState

  if (!token) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="space-y-6">
            <span className="text-2xl font-bold tracking-tight text-teal-600">ClaimsManager360</span>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Enlace inválido
              </h1>
              <p className="text-base text-slate-500">
                El enlace de recuperación no es válido o ha expirado.
              </p>
            </div>
          </div>

          <Alert>Por favor solicita un nuevo enlace de recuperación.</Alert>

          {/* Back to Forgot Password */}
          <Link to="/forgot-password">
            <Button variant="outline" className="w-full">
              Solicitar nuevo enlace
            </Button>
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
              Nueva contraseña
            </h1>
            <p className="text-base text-slate-500">Crea una nueva contraseña segura.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-6">
          {error && <Alert>{error}</Alert>}

          <FormField
            label="Nueva contraseña"
            name="password"
            hint="Mínimo 8 caracteres"
            error={errors.password?.message}
            required
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isLoading}
              leftIcon={<Lock size={18} />}
              error={!!errors.password}
              {...form.register('password')}
            />
          </FormField>

          <FormField
            label="Confirmar contraseña"
            name="confirmPassword"
            error={errors.confirmPassword?.message}
            required
          >
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isLoading}
              leftIcon={<Lock size={18} />}
              error={!!errors.confirmPassword}
              {...form.register('confirmPassword')}
            />
          </FormField>

          {/* Submit Button */}
          <Button
            type="submit"
            loading={isLoading}
            rightIcon={<ArrowRight size={18} />}
            className="w-full"
          >
            Restablecer contraseña
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
