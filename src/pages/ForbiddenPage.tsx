import { Link, useSearchParams } from "react-router-dom"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForbiddenPage() {
  const [searchParams] = useSearchParams()
  const from = searchParams.get("from")

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg border-rose-200/80 bg-rose-50/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <ShieldX className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-slate-600">
          <p>You do not have permission to access this page on the current farm.</p>
          {from && (
            <p className="text-sm text-slate-500">
              Requested: <code className="rounded bg-white px-1.5 py-0.5 text-xs">{from}</code>
            </p>
          )}
          <p className="text-sm">Contact your farm administrator if you believe this is an error.</p>
          <Button asChild className="mt-2">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
