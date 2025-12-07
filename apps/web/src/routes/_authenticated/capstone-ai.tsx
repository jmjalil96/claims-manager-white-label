import { createFileRoute } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/capstone-ai')({
  component: CapstoneAIComponent,
})

function CapstoneAIComponent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-purple-400" />
        <h1 className="text-3xl font-bold">CapstoneAI</h1>
      </div>
      <p className="text-muted-foreground">
        AI-powered claims processing assistant. Coming soon.
      </p>
    </div>
  )
}
