import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authenticated/claims/')({
  component: ClaimsListComponent,
})

function ClaimsListComponent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Claims</h1>
        <Button asChild>
          <Link to="/claims/new">New Claim</Link>
        </Button>
      </div>
      <p className="text-muted-foreground">Claims list will appear here. No claims yet.</p>
    </div>
  )
}
