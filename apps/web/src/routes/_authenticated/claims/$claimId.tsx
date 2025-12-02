import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/claims/$claimId')({
  component: ClaimDetailComponent,
})

function ClaimDetailComponent() {
  const { claimId } = Route.useParams()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Claim #{claimId}</h1>
      <p className="text-muted-foreground">Claim details will appear here.</p>
    </div>
  )
}
