import { useEffect, useRef } from "react"
import { useBlocker } from "react-router-dom"

import { Button } from "@/components/ui/button"

interface SettingsSaveBarProps {
  dirty: boolean
  saving?: boolean
  onSave: () => void | Promise<void>
  onDiscard: () => void
}

export function SettingsSaveBar({ dirty, saving = false, onSave, onDiscard }: SettingsSaveBarProps) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname
  )
  const blockerRef = useRef(blocker)
  blockerRef.current = blocker

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [dirty])

  useEffect(() => {
    if (blocker.state !== "blocked") return

    const confirmed = window.confirm("You have unsaved changes. Leave this page without saving?")
    if (confirmed) {
      blockerRef.current.proceed()
    } else {
      blockerRef.current.reset()
    }
  }, [blocker.state])

  if (!dirty) return null

  return (
    <div className="sticky bottom-4 z-20">
      <div className="mx-auto mt-6 flex max-w-3xl items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 shadow-lg">
        <div>
          <p className="text-sm font-medium text-foreground">You have unsaved changes</p>
          <p className="text-xs text-muted-foreground">Save your updates or discard them before leaving.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
