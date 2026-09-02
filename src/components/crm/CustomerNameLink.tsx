import { Link } from "react-router-dom"

type Props = {
  customerId?: number | null
  name?: string | null
  className?: string
}

export function CustomerNameLink({ customerId, name, className }: Props) {
  const display = name?.trim() || "—"
  if (!customerId || !name?.trim()) {
    return <span className={className}>{display}</span>
  }

  return (
    <Link
      to={`/dashboard/crm/customers/${customerId}`}
      className={`text-emerald-700 hover:underline ${className ?? ""}`}
    >
      {display}
    </Link>
  )
}
