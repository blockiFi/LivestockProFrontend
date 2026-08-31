import { useState } from "react"
import { useLoaderData, useRevalidator } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"
import { AlertTriangle, Check, Gift, Sparkles, Users, Wheat } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePermissions } from "@/hooks/usePermissions"
import { ACTIONS } from "@/lib/actionPermissions"
import { cancelSubscription, changeSubscriptionPlan, startSubscriptionCheckout } from "@/lib/request"
import { setSubscription } from "@/store/AuthenticationSlice"
import { Naira, cn, formatCurrency, formatDate } from "@/lib/utils"
import type { RootState } from "@/store"
import type { Farm, FarmSubscriptionSummary, SubscriptionPlan, SubscriptionStatus, SubscriptionTransaction } from "@/lib/types"

type LoaderData = {
  currentFarm: Farm | null
  subscription: FarmSubscriptionSummary | null
  plans: SubscriptionPlan[]
  transactions: SubscriptionTransaction[]
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Free trial",
  active: "Active",
  waived: "Complimentary",
  past_due: "Payment failed",
  grace: "Grace period",
  read_only: "Expired",
  cancelled: "Cancelled",
}

const STATUS_VARIANTS: Record<SubscriptionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  trialing: "secondary",
  active: "default",
  waived: "secondary",
  past_due: "destructive",
  grace: "destructive",
  read_only: "destructive",
  cancelled: "outline",
}

function limitLabel(limit: number | null): string {
  return limit === null ? "Unlimited" : String(limit)
}

function usagePercent(used: number, limit: number | null): number {
  if (limit === null || limit === 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

export default function BillingSettingsPage() {
  const { currentFarm, subscription, plans, transactions } = useLoaderData() as LoaderData
  const token = useSelector((state: RootState) => state.authentication.token)
  const dispatch = useDispatch()
  const revalidator = useRevalidator()
  const { canAny } = usePermissions()
  const canManage = canAny([...ACTIONS.billing.manage])
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  if (!currentFarm || !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Select a farm to manage its subscription.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { plan, usage, status } = subscription
  const isWaived = status === "waived"

  const handleSelectPlan = async (target: SubscriptionPlan) => {
    if (!canManage) return
    setBusyPlan(target.slug)

    // Downgrades and waiver-period switches never need a fresh payment.
    const isDowngrade = target.price_kobo < plan.price_kobo
    const action = isDowngrade || isWaived
      ? changeSubscriptionPlan(token, currentFarm.id, target.slug)
      : startSubscriptionCheckout(token, currentFarm.id, target.slug)

    const response = await action
    setBusyPlan(null)

    if (!response.success) {
      toast.error(response.error?.[0] ?? "Could not update the plan")
      return
    }

    if (isDowngrade || isWaived) {
      dispatch(setSubscription(response.data as FarmSubscriptionSummary))
      toast.success(`Moved to the ${target.name} plan`)
      revalidator.revalidate()
      return
    }

    const checkout = response.data as { authorization_url?: string }
    if (checkout?.authorization_url) {
      window.location.href = checkout.authorization_url
      return
    }

    toast.error("The payment provider did not return a checkout link")
  }

  const handleCancel = async () => {
    if (!canManage) return
    setCancelling(true)
    const response = await cancelSubscription(token, currentFarm.id)
    setCancelling(false)

    if (!response.success) {
      toast.error(response.error?.[0] ?? "Could not cancel the subscription")
      return
    }

    dispatch(setSubscription(response.data ?? null))
    toast.success("Subscription cancelled. Access continues until the end of the paid period.")
    revalidator.revalidate()
  }

  return (
    <div className="space-y-6">
      {subscription.is_read_only && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-base text-destructive">This farm is read-only</CardTitle>
              <CardDescription>
                You can still view your records, but adding or editing data is paused until a plan is active.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {isWaived && subscription.waived_until && (
        <Card className="border-emerald-500/40 bg-emerald-50">
          <CardHeader className="flex flex-row items-start gap-3">
            <Gift className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-base text-emerald-900">
                Complimentary {subscription.waiver?.plan_name ?? plan.name} access
              </CardTitle>
              <CardDescription className="text-emerald-800">
                Granted by the LiveStockPro team until {formatDate(subscription.waived_until)}. No payment is needed
                until then.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                {plan.name} plan
                <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
              </CardTitle>
              <CardDescription>
                {Naira}
                {formatCurrency(plan.price)} per month, billed for this farm.
              </CardDescription>
            </div>
            {status === "trialing" && subscription.trial_ends_at && (
              <p className="text-sm text-muted-foreground">
                Trial ends {formatDate(subscription.trial_ends_at)}
              </p>
            )}
            {status === "active" && subscription.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Renews {formatDate(subscription.current_period_end)}
              </p>
            )}
            {status === "cancelled" && subscription.ends_at && (
              <p className="text-sm text-muted-foreground">Access ends {formatDate(subscription.ends_at)}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Team members
                </span>
                <span className="text-muted-foreground">
                  {usage.user_seats_used} / {limitLabel(usage.max_users)}
                </span>
              </div>
              <Progress value={usagePercent(usage.user_seats_used, usage.max_users)} />
              {usage.pending_invitations > 0 && (
                <p className="text-xs text-muted-foreground">
                  Includes {usage.pending_invitations} pending invitation
                  {usage.pending_invitations === 1 ? "" : "s"}.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Wheat className="h-4 w-4 text-muted-foreground" />
                  Active batches
                </span>
                <span className="text-muted-foreground">
                  {usage.active_flocks} / {limitLabel(usage.max_active_flocks)}
                </span>
              </div>
              <Progress value={usagePercent(usage.active_flocks, usage.max_active_flocks)} />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-3 text-sm">
            <Sparkles className={cn("h-4 w-4", subscription.ai_enabled ? "text-emerald-600" : "text-muted-foreground")} />
            <span>
              {subscription.ai_enabled
                ? "AI features are unlocked on this farm."
                : "AI features are not included on this plan. Upgrade to Premium to unlock them."}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((option) => {
          const isCurrent = option.slug === plan.slug
          return (
            <Card key={option.slug} className={cn(isCurrent && "border-primary shadow-md")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {option.name}
                  {isCurrent && <Badge>Current</Badge>}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-semibold text-slate-900">
                    {Naira}
                    {formatCurrency(option.price)}
                  </span>
                  <span className="text-muted-foreground"> /month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    {limitLabel(option.max_users)} {option.max_users === 1 ? "user" : "users"}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    {limitLabel(option.max_active_flocks)} active{" "}
                    {option.max_active_flocks === 1 ? "batch" : "batches"}
                  </li>
                  <li className="flex items-start gap-2">
                    {option.ai_enabled ? (
                      <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    ) : (
                      <span className="mt-0.5 h-4 w-4 text-center text-muted-foreground">–</span>
                    )}
                    <span className={cn(!option.ai_enabled && "text-muted-foreground")}>All AI features</span>
                  </li>
                </ul>

                {!isCurrent && (
                  <Button
                    className="w-full"
                    variant={option.price_kobo > plan.price_kobo ? "default" : "outline"}
                    disabled={!canManage || busyPlan !== null}
                    onClick={() => handleSelectPlan(option)}
                  >
                    {busyPlan === option.slug
                      ? "Please wait…"
                      : option.price_kobo > plan.price_kobo
                        ? `Upgrade to ${option.name}`
                        : `Switch to ${option.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Charges, plan changes, and complimentary access granted to this farm.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No billing activity yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>{transaction.event ?? transaction.source}</TableCell>
                    <TableCell>{transaction.plan?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {transaction.amount_kobo
                        ? `${Naira}${formatCurrency(transaction.amount_kobo / 100)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canManage && status !== "cancelled" && !isWaived && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancel subscription</CardTitle>
            <CardDescription>
              Your farm keeps full access until the end of the period you have already paid for, then becomes
              read-only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled={cancelling} onClick={handleCancel}>
              {cancelling ? "Cancelling…" : "Cancel subscription"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
