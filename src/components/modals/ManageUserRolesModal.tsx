"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, KeyRound, Loader2, Shield, UserRound, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormModal, FormSection, modalTone } from "@/components/ui/form-modal"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Role, FarmUserRoleSummary } from "@/lib/types"
import { syncUserRoles } from "@/lib/request"
import { toast } from "react-toastify"
import { LoadFarmPermissions } from "@/lib/loader"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { usePermissions } from "@/hooks/usePermissions"

interface ManageUserRolesModalProps {
  user: FarmUserRoleSummary | null
  allRoles: Role[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  farmId: number
  token: string
}

export function ManageUserRolesModal({
  user,
  allRoles,
  open,
  onOpenChange,
  onSuccess,
  farmId,
  token,
}: ManageUserRolesModalProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const { canAny } = usePermissions()
  const canManage = canAny([...ACTIONS.users.manage])

  // Initialize selected roles from user when user changes or modal opens
  useEffect(() => {
    if (!user || !open) {
      setSelectedRoleIds([])
      return
    }
    const currentRoleIds = user.roles.map((r) => r.id)
    setSelectedRoleIds(currentRoleIds)
  }, [user, open])

  // Compute effective permissions from selected roles
  const effectivePermissions = useMemo(() => {
    if (!allRoles || selectedRoleIds.length === 0) return []
    const permissionSet = new Set<string>()
    allRoles
      .filter((role) => selectedRoleIds.includes(role.id))
      .forEach((role) => {
        if (role.permissions) {
          role.permissions.forEach((perm) => {
            if (typeof perm === "string") {
              permissionSet.add(perm)
            } else if (perm && typeof perm === "object" && "name" in perm) {
              permissionSet.add(perm.name)
            }
          })
        }
      })
    return Array.from(permissionSet).sort()
  }, [allRoles, selectedRoleIds])

  const toggleRole = (roleId: number) => {
    if (!canManage) return
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId))
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId])
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await syncUserRoles(token, farmId, user.id, selectedRoleIds)
      if (response.success) {
        toast.success("User roles updated successfully")
        await LoadFarmPermissions(true)
        toast.info("Permissions updated")
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast.error(response.error?.[0] || "Failed to update user roles")
      }
    } catch (error) {
      console.error("Error syncing user roles:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = useMemo(() => {
    if (!user) return false
    const currentRoleIds = user.roles.map((r) => r.id).sort()
    const newRoleIds = [...selectedRoleIds].sort()
    return JSON.stringify(currentRoleIds) !== JSON.stringify(newRoleIds)
  }, [user, selectedRoleIds])

  if (!user) return null

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Manage Roles for ${user.name}`}
      description="Assign or remove roles for this user. Changes will affect their permissions immediately."
      icon={Users}
      tone="settings"
      size="lg"
      busy={loading}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl">
            Cancel
          </Button>
          <ActionGate anyOf={ACTIONS.users.manage}>
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className={cn("gap-2 rounded-xl text-white", modalTone("settings").button)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </ActionGate>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <UserRound className="h-5 w-5 text-slate-700" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <FormSection
        icon={Shield}
        title="Available Roles"
        description="Select every role this user should hold."
        action={
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {selectedRoleIds.length} selected
          </span>
        }
      >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allRoles.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No roles available</p>
              ) : (
                allRoles.map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id)
                  return (
                    <div
                      key={role.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        canManage ? "cursor-pointer" : "cursor-default"
                      } ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                      onClick={() => toggleRole(role.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? "bg-green-600 border-green-600"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{role.name}</span>
                        </div>
                      </div>
                      {role.permissions && role.permissions.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  )
                })
              )}
            </div>
      </FormSection>

      {effectivePermissions.length > 0 && (
        <FormSection
          icon={KeyRound}
          title={`Effective Permissions (${effectivePermissions.length})`}
          description="Combined permissions granted by the selected roles."
        >
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {effectivePermissions.map((perm, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-slate-100 text-slate-700 border-slate-200 text-xs"
              >
                {perm}
              </Badge>
            ))}
          </div>
        </FormSection>
      )}
    </FormModal>
  )
}
