"use client"

import { useState, useMemo, useEffect } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PermissionGroup } from "@/lib/types"
import { GetToken, createRole } from "@/lib/request"
import { toast } from 'react-toastify'
import { useSelector } from "react-redux"
import type { RootState } from "@/store"


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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a new role and assign permissions. Currently {selectedPermissions.length} of{" "}
            {groupedPermissions.flatMap((g) => g.permissions ?? []).length} permissions selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role Name Input */}
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              placeholder="Enter role name (e.g., Manager, Worker)"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Permissions Selection */}
          <div className="space-y-4">
            <Label>Select Permissions</Label>
            <div className="space-y-6">
              {groupedPermissions.map((group) => (
                <div key={group.id} className="space-y-3">
                  <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">
                    {(group as any).module ?? group.name}
                  </h3>
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
                          disabled={loading}
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
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !roleName.trim() || selectedPermissions.length === 0} className="gap-2">
            {loading ? "Creating..." : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


