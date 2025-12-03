import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import { signIn } from '@/lib/auth-client'
import { loginSchema, type LoginInput } from '@/features/auth/schemas'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert } from '@/components/ui/alert'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginInput) => {
    setError('')

    const result = await signIn.email({
      email: data.email,
      password: data.password,
    })

    if (result.error) {
      setError(result.error.message ?? 'Sign in failed')
    } else {
      void navigate({ to: '/dashboard' })
    }
  }

  const isLoading = form.formState.isSubmitting

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <span className="text-2xl font-bold tracking-tight text-teal-600">ClaimsManager360</span>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Bienvenido
            </h1>
            <p className="text-base text-slate-500">Ingresa tus credenciales para continuar.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-6">
          {error && <Alert>{error}</Alert>}

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              disabled={isLoading}
              leftIcon={<Mail size={18} />}
              error={!!form.formState.errors.email}
              aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p id="email-error" className="text-xs text-red-600">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isLoading}
              leftIcon={<Lock size={18} />}
              error={!!form.formState.errors.password}
              aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p id="password-error" className="text-xs text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember-me" />
              <label
                htmlFor="remember-me"
                className="cursor-pointer select-none text-sm font-normal text-slate-600"
              >
                Recordarme
              </label>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-500"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            loading={isLoading}
            rightIcon={<ArrowRight size={18} />}
            className="w-full"
          >
            Ingresar
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <a href="#" className="font-medium text-teal-600 transition-colors hover:text-teal-500">
            Solicitar acceso
          </a>
        </p>
      </div>
    </AuthLayout>
  )
}
