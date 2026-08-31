"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Roles for {user.name}
          </DialogTitle>
          <DialogDescription>
            Assign or remove roles for this user. Changes will affect their permissions immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Roles Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Roles</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {allRoles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No roles available</p>
              ) : (
                allRoles.map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id)
                  return (
                    <div
                      key={role.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        canManage ? "cursor-pointer" : "cursor-default"
                      } ${
                        isSelected
                          ? "bg-green-50 border-green-300"
                          : "bg-white border-gray-200 hover:bg-gray-50"
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
          </div>

          {/* Effective Permissions Preview */}
          {effectivePermissions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Effective Permissions ({effectivePermissions.length})
              </h3>
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 max-h-40 overflow-y-auto">
                {effectivePermissions.map((perm, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 border-blue-200 text-xs"
                  >
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <ActionGate anyOf={ACTIONS.users.manage}>
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </ActionGate>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
