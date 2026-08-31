import { useMemo } from "react"
import { useSelector } from "react-redux"

import type { RootState } from "@/store"

/**
 * Plan entitlements for the active farm. Used to gate AI features and warn
 * about seat/batch limits before the user hits a server error.
 */
export function useSubscription() {
  const subscription = useSelector((state: RootState) => state.authentication.subscription)
  const subscriptionFarmId = useSelector((state: RootState) => state.authentication.subscriptionFarmId)
  const activeFarmId = useSelector((state: RootState) => state.authentication.activeFarm?.id ?? null)

  return useMemo(() => {
    const isLoaded = subscription !== null && subscriptionFarmId === activeFarmId

    return {
      subscription: isLoaded ? subscription : null,
      isLoaded,
      // Until the subscription loads we assume AI is unavailable so buttons
      // never flash as enabled for farms that cannot use them.
      aiEnabled: isLoaded ? subscription.ai_enabled : false,
      isReadOnly: isLoaded ? subscription.is_read_only : false,
      planName: isLoaded ? subscription.plan.name : null,
    }
  }, [subscription, subscriptionFarmId, activeFarmId])
}
