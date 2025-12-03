import { ParticleNetwork } from '@/components/ui/effects/particle-network'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen font-sans text-slate-800">
      {/* Left Side - Form Section */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center bg-white px-4 sm:px-6 lg:px-20 xl:px-24">
        {children}

        <div className="absolute bottom-6 text-xs text-slate-400">
          © 2024 ClaimsManager360 Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side - Visual Section */}
      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        {/* The Particle Effect */}
        <ParticleNetwork />

        {/* Gradient Overlay for better text readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#051124] via-transparent to-transparent opacity-80" />

        {/* Content Overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-12">
          <div className="max-w-md">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-teal-400">
              Tu portal de beneficios
            </p>
            <h2 className="mb-4 text-3xl font-bold leading-tight text-white">
              Gestiona tus reembolsos de salud de forma simple.
            </h2>
            <p className="text-base leading-relaxed text-slate-400">
              Presenta tus reclamos, consulta el estado de tus solicitudes y accede a tu historial
              desde un solo lugar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
