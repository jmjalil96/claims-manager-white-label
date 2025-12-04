import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import { z } from 'zod'
import { signIn } from '@/lib/auth-client'
import { loginSchema, type LoginInput } from '@/features/auth'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button, Input, PasswordInput, Checkbox, Alert, FormField, Label } from '@/components/ui'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/_public/login')({
  validateSearch: searchSchema,
  component: LoginComponent,
})

function LoginComponent() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
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
      void navigate({ to: redirect || '/dashboard' })
    }
  }

  const isLoading = form.formState.isSubmitting
  const { errors } = form.formState

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

          <FormField
            label="Contraseña"
            name="password"
            error={errors.password?.message}
            required
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isLoading}
              leftIcon={<Lock size={18} />}
              error={!!errors.password}
              {...form.register('password')}
            />
          </FormField>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember-me" />
              <Label htmlFor="remember-me" className="cursor-pointer font-normal text-slate-600">
                Recordarme
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-500"
            >
              ¿Olvidaste tu contraseña?
            </Link>
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
