import { useNavigation } from "react-router-dom"
import { usePermissions } from "@/hooks/usePermissions"

export function useRouteLoading() {
  const navigation = useNavigation()
  const { isLoading: permissionsLoading, isLoaded } = usePermissions()

  const isNavigating = navigation.state === "loading"
  const isRouteLoading = isNavigating || (permissionsLoading && !isLoaded)
  const loadingLabel = isNavigating ? "Loading page…" : "Loading permissions…"

  return {
    isNavigating,
    isRouteLoading,
    loadingLabel,
  }
}
