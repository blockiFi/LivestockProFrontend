import { useEffect, useMemo, useState } from "react"

export function useSettingsForm<T>(initialValue: T) {
  const [initial, setInitial] = useState(initialValue)
  const [form, setForm] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setInitial(initialValue)
    setForm(initialValue)
  }, [initialValue])

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
