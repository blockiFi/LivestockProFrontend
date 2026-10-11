"use client"

import { useState, useMemo, useEffect } from "react"
import { Check, KeyRound, Loader2, ShieldPlus, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormField, FormModal, FormSection, formInputClass, modalTone } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import type { PermissionGroup } from "@/lib/types"
import { GetToken, createRole } from "@/lib/request"
import { toast } from 'react-toastify'
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { cn } from "@/lib/utils"


interface CreateRoleModalProps {
  open: boolean
  GroupPermissions: PermissionGroup[],
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateRoleModal({ open, onOpenChange, GroupPermissions, onSuccess }: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id);

  // derive groups: include all permissions from GroupPermissions
  const groupedPermissions = useMemo(() => {
    if (!GroupPermissions || GroupPermissions.length === 0) return [] as PermissionGroup[]
    // ensure permissions array exists on each group
    return GroupPermissions.map((g) => ({ ...g, permissions: g.permissions ?? [] }))
  }, [GroupPermissions])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setRoleName("")
      setSelectedPermissions([])
    }
  }, [open])

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleCreate = async () => {
    if (!roleName.trim()) {
      toast.error('Please enter a role name')
      return
    }

    if (selectedPermissions.length === 0) {
      toast.error('Please select at least one permission')
      return
    }

    if (!farmId) {
      toast.error('No farm selected')
      return
    }

    setLoading(true)
    try {
      const token = GetToken()
      if (!token) throw new Error('No auth token')
      
      const res = await createRole(token, roleName, farmId, selectedPermissions)
      if (!res.success) {
        toast.error((res as any).error?.[0] || 'Failed to create role')
        return
      }
      
      toast.success('Role created successfully')
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      console.error('Error creating role:', err)
      toast.error('Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  const totalPermissions = groupedPermissions.flatMap((g) => g.permissions ?? []).length

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Role"
      description={
        <>
          Create a new role and assign permissions. Currently {selectedPermissions.length} of {totalPermissions}{" "}
          permissions selected.
        </>
      }
      icon={ShieldPlus}
      tone="settings"
      size="xl"
      busy={loading}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl">
            Cancel
          </Button>
          <ActionGate anyOf={ACTIONS.roles.create}>
            <Button
              onClick={handleCreate}
              disabled={loading || !roleName.trim() || selectedPermissions.length === 0}
              className={cn("gap-2 rounded-xl text-white", modalTone("settings").button)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Role"}
            </Button>
          </ActionGate>
        </>
      }
    >
      <FormSection step={1} icon={Tag} title="Role details" description="Give the role a clear, recognisable name.">
        <FormField label="Role Name" htmlFor="role-name" required>
          <Input
            id="role-name"
            placeholder="Enter role name (e.g., Manager, Worker)"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            disabled={loading}
            className={formInputClass()}
          />
        </FormField>
      </FormSection>

      <FormSection
        step={2}
        icon={KeyRound}
        title="Select Permissions"
        description="Choose what members with this role can do."
        action={
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {selectedPermissions.length}/{totalPermissions}
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groupedPermissions.map((group) => (
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
                      disabled={loading}
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
