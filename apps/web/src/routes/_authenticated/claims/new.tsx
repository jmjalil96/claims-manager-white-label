import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authenticated/claims/new')({
  component: NewClaimComponent,
})

function NewClaimComponent() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Claim</h1>
      <p className="text-muted-foreground">Claim creation form will appear here.</p>
      <Button>Create Claim</Button>
    </div>
  )
}
