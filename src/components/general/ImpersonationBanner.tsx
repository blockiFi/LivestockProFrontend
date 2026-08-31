import type { User } from "@/lib/types"

type Props = {
  user: User | null
}

export default function ImpersonationBanner({ user }: Props) {
  const impersonation = user?.impersonation

  if (!impersonation?.active) {
    return null
  }

  const adminName = impersonation.impersonated_by?.name || "a platform admin"

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
      Support impersonation active — viewing as <strong>{user?.name}</strong>
      {impersonation.impersonated_by ? (
        <>
          {" "}
          (started by {adminName})
        </>
      ) : null}
      {impersonation.expires_at ? (
        <span className="text-amber-800">
          {" "}
          · session expires {new Date(impersonation.expires_at).toLocaleTimeString()}
        </span>
      ) : null}
    </div>
  )
}
