"use client"

import { useState, useMemo, useEffect } from "react"
import { Check, KeyRound, Loader2, Search, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormModal, FormSection, formInputClass, modalTone } from "@/components/ui/form-modal"
import type { PermissionGroup, Role } from "@/lib/types"
import { GetToken, updateRolePermissions, removePermissionFromRole } from "@/lib/request"
import { toast } from 'react-toastify'
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { usePermissions } from "@/hooks/usePermissions"
import { cn } from "@/lib/utils"


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

  const totalPermissions = groupedPermissions.flatMap((g) => g.permissions ?? []).length

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Manage Permissions - ${role.name}`}
      description={
        <>
          Select permissions to assign to this role. Currently {selectedPermissions.length} of {totalPermissions}{" "}
          permissions selected.
        </>
      }
      icon={ShieldCheck}
      tone="settings"
      size="xl"
      busy={loading}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl">
            Cancel
          </Button>
          <ActionGate anyOf={ACTIONS.roles.manage}>
            <Button
              onClick={handleSave}
              disabled={loading}
              className={cn("gap-2 rounded-xl text-white", modalTone("settings").button)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save Permissions"}
            </Button>
          </ActionGate>
        </>
      }
    >
      <FormSection
        icon={KeyRound}
        title="Permissions"
        description="Changes are saved as you toggle each permission."
        action={
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {selectedPermissions.length}/{totalPermissions}
          </span>
        }
      >
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={permissionSearch}
            onChange={(e) => setPermissionSearch(e.target.value)}
            placeholder="Search permissions…"
            className={formInputClass(false, "pl-9")}
          />
        </div>

        {filteredGroupedPermissions.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            No permissions match “{permissionSearch}”.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredGroupedPermissions.map((group) => (
            <div key={group.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {(group as any).module ?? group.name}
              </h4>
              <div className="space-y-1">
                {(group.permissions ?? []).map((permission) => (
                  <label
                    key={permission.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      disabled={!canManage}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                    />
                    <p className="flex-1 text-sm font-medium text-slate-800">{permission.name}</p>
                    {selectedPermissions.includes(permission.id) && (
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </FormSection>
    </FormModal>
  )
}
