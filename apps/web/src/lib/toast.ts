import { toast } from 'sonner'

export { toast }

export const showSuccess = (message: string, description?: string) =>
  toast.success(message, { description })

export const showError = (message: string, description?: string) =>
  toast.error(message, { description, duration: 6000 })

export const showWarning = (message: string, description?: string) =>
  toast.warning(message, { description })

export const showInfo = (message: string, description?: string) =>
  toast.info(message, { description })
