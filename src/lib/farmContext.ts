import type { NavigateFunction } from "react-router-dom"

import store from "@/store"
import { setActiveFarm } from "@/store/AuthenticationSlice"
import { clearStoredFarm } from "@/lib/request"

export function goToFarmSelection(navigate: NavigateFunction) {
  clearStoredFarm()
  store.dispatch(setActiveFarm(null))
  navigate("/farm-selection")
}
