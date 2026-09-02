import { useEffect, useMemo, useRef, useState } from "react"

export function useSettingsForm<T>(initialValue: T) {
  const [initial, setInitial] = useState(initialValue)
  const [form, setForm] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const initialValueRef = useRef(initialValue)
  initialValueRef.current = initialValue

  // Compare by value so inline objects / new loader references do not retrigger endlessly.
  const initialKey = JSON.stringify(initialValue)

  useEffect(() => {
    const next = initialValueRef.current
    setInitial(next)
    setForm(next)
  }, [initialKey])

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])

  const reset = () => setForm(initial)
  const commit = (nextValue?: T) => {
    const value = nextValue ?? form
    setInitial(value)
    setForm(value)
  }

  return {
    form,
    setForm,
    saving,
    setSaving,
    dirty,
    reset,
    commit,
  }
}
