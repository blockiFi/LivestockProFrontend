"use client"

import { useState, useMemo, useEffect } from "react"
import { Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { PermissionGroup, Role } from "@/lib/types"
import { GetToken, updateRolePermissions, removePermissionFromRole } from "@/lib/request"
import { toast } from 'react-toastify'
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { usePermissions } from "@/hooks/usePermissions"


interface ManageRolePermissionsModalProps {
  role: Role | null
  open: boolean
  GroupPermissions: PermissionGroup[],
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ManageRolePermissionsModal({ role, open, onOpenChange, GroupPermissions , onSuccess }: ManageRolePermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState("")
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);
  const { canAny } = usePermissions()
  const canManage = canAny([...ACTIONS.roles.manage])
  // helper: role.permissions may be number[] or Permission[]; normalize to ids
  const extractIds = (arr: any[] | undefined) => {
    if (!arr) return [] as number[]
    return arr.map((p) => (typeof p === 'number' ? p : (p?.id ?? undefined))).filter(Boolean) as number[]
  }

  // initialize selected permissions from role when role changes/open
  useEffect(() => {
    if (!role) {
      setSelectedPermissions([])
      return
    }
    setSelectedPermissions(extractIds(role.permissions as any[]))
  }, [role])

  // derive groups: include all permissions from GroupPermissions; mark checked for those the role already has
  const groupedPermissions = useMemo(() => {
    if (!GroupPermissions || GroupPermissions.length === 0) return [] as PermissionGroup[]
    // ensure permissions array exists on each group
    return GroupPermissions.map((g) => ({ ...g, permissions: g.permissions ?? [] }))
  }, [GroupPermissions])

  const filteredGroupedPermissions = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase()
    if (!q) return groupedPermissions
    return groupedPermissions
      .map((g) => ({
        ...g,
        permissions: (g.permissions ?? []).filter((p: any) =>
          String(p?.name ?? "").toLowerCase().includes(q)
        ),
      }))
      .filter((g) => (g.permissions ?? []).length > 0)
  }, [groupedPermissions, permissionSearch])

  const togglePermission = async (permissionId: number) => {
    if (!role || !canManage) return
    const prev = selectedPermissions
    // Check if we're adding (permission not in list) or removing (permission in list)
    const isAdding = !prev.includes(permissionId)
    const newSelected = isAdding ? [...prev, permissionId] : prev.filter((id) => id !== permissionId)
    // optimistic UI update - update UI immediately for better UX
    setSelectedPermissions(newSelected)

    // persist change immediately to backend
    try {
      const token = GetToken()
      if (!token) throw new Error('No auth token')
      
      if (isAdding) {
        // ADD: Permission is being checked/added
        // Use add-permissions-to-role endpoint
        const res = await updateRolePermissions(token, role.id, farmId, [permissionId])
        if (!res.success) {
          // revert UI state on error
          setSelectedPermissions(prev)
          toast.error((res as any).error?.[0] || 'Failed to add permission')
        } else {
          // Show success toast when permission is successfully added
          toast.success('Permission added successfully')
          // Trigger onSuccess callback to refresh the parent page
          onSuccess?.()
        }
      } else {
        // REMOVE: Permission is being unchecked/removed
        // Use remove-permission-from-role endpoint
        const res = await removePermissionFromRole(token, role.id, farmId, [permissionId])
        if (!res.success) {
          // revert UI state on error
          setSelectedPermissions(prev)
          toast.error((res as any).error?.[0] || 'Failed to remove permission')
        } else {
          // Show success toast when permission is successfully removed
          toast.success('Permission removed successfully')
          // Trigger onSuccess callback to refresh the parent page
          onSuccess?.()
        }
      }
    } catch (err) {
      console.error('Error updating permissions:', err)
      // revert UI state on exception
      setSelectedPermissions(prev)
      toast.error('Failed to update permissions')
    }
  }

  const handleSave = async () => {
    if (!role) return
    setLoading(true)
    try {
      const token = GetToken()
      if (!token) throw new Error('No auth token')
      const res = await updateRolePermissions(token, role.id, farmId, selectedPermissions)
      if (!res.success) {
        toast.error((res as any).error?.[0] || 'Failed to update permissions')
        return
      }
      // refresh local state
      setSelectedPermissions(selectedPermissions)
      toast.success('Permissions updated successfully')
      onSuccess?.()
      // Don't close modal - user should manually close it
    } catch (err) {
      console.error('Failed saving permissions', err)
      toast.error('Failed to update permissions')
    } finally {
      setLoading(false)
    }
  }

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {role.name}</DialogTitle>
          <DialogDescription>
            Select permissions to assign to this role. Currently {selectedPermissions.length} of{" "}
            {groupedPermissions.flatMap((g) => g.permissions ?? []).length} permissions selected.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={permissionSearch}
            onChange={(e) => setPermissionSearch(e.target.value)}
            placeholder="Search permissions…"
            className="pl-9"
          />
        </div>

        <div className="space-y-6 py-4">
          {filteredGroupedPermissions.length === 0 ? (
            <div className="text-sm text-gray-500 py-6 text-center">
              No permissions match “{permissionSearch}”.
            </div>
          ) : null}

          {filteredGroupedPermissions.map((group) => (
            <div key={group.id} className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">{(group as any).module ?? group.name}</h3>
              <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                {(group.permissions ?? []).map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      disabled={!canManage}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{permission.name}</p>
                    </div>
                    {selectedPermissions.includes(permission.id) && (
                      <Check className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <ActionGate anyOf={ACTIONS.roles.manage}>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading ? "Saving..." : "Save Permissions"}
            </Button>
          </ActionGate>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
