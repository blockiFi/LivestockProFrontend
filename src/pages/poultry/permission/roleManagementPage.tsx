"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Eye, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StatCard } from "@/components/general/StatCard"
import { useLoaderData, useRevalidator } from "react-router-dom"
import type { Role } from "@/lib/types"
import { ManageRolePermissionsModal } from "@/components/modals/ManageRole"
import { CreateRoleModal } from "@/components/modals/CreateRoleModal"
import { LoadPermissionGroups } from "@/lib/loader"
import type { PermissionGroup } from "@/lib/types"



function roleManagementPage() {

  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeRole, setActiveRole] = useState<Role | null>(null)
    const [viewRole, setViewRole] = useState(false)
  const [groupPermissions, setGroupPermissions] = useState<PermissionGroup[]>([])
  const revalidator = useRevalidator()

  const {roles} = useLoaderData() as { roles: Role[] };

console.log("Roles loaded: ", roles);

  const filteredRoles = roles.filter((role) => role.name.toLowerCase().includes(searchTerm.toLowerCase()))

  useEffect(() => {
    let mounted = true
    const fetchGroups = async () => {
      try {
        const { PermissionGroups } = await LoadPermissionGroups()
        if (!mounted) return
        setGroupPermissions(PermissionGroups ?? [])
      } catch (err) {
        console.error('Failed to load permission groups', err)
      }
    }
    fetchGroups()
    return () => { mounted = false }
  }, [])

 

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Roles Management</h2>
        <p className="text-muted-foreground">Create and manage user roles with permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Roles" value={roles.length} icon={Shield} color="blue" />
        <StatCard
          title="Active Roles"
          value={roles.filter((r) => (r.permissions?.length ?? 0) > 0).length}
          icon={Shield}
          color="green"
        />
        <StatCard
          title="Total Permissions"
          value={new Set(roles.flatMap((r) => r.permissions ?? [])).size}
          icon={Shield}
          color="purple"
        />
        <StatCard
          title="Avg Permissions/Role"
          value={roles.length ? (roles.reduce((sum, r) => sum + (r.permissions?.length ?? 0), 0) / roles.length).toFixed(1) : "0.0"}
          icon={Shield}
          color="blue"
        />
      </div>

      {/* Search and Action */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Create Role
        </Button>
      </div>

      {/* Roles List */}
      {filteredRoles.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No roles found</p>
          <Button onClick={() => setShowCreateModal(true)} variant="outline">
            Create your first role
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="p-6 hover:shadow-lg transition-shadow border border-border">
              <div className="flex items-start justify-between gap-6">
                {/* Left Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{role.name}</h3>
                    </div>
                  </div>

                  {/* Permissions Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(role.permissions ?? []).slice(0, 3).map((permissions, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {permissions.name}
                      </span>
                    ))}
                    {(role.permissions ?? []).length > 3 && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                        +{(role.permissions ?? []).length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setActiveRole(role); setViewRole(true); }} className="gap-2">
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button variant="outline" size="sm"  className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateRoleModal
        open={showCreateModal}
        GroupPermissions={groupPermissions}
        onOpenChange={(open: boolean) => setShowCreateModal(open)}
        onSuccess={async () => {
          // Refresh the page data to show updated roles
          await revalidator.revalidate()
        }}
      />

      <ManageRolePermissionsModal
        role={activeRole}
        open={viewRole}
        GroupPermissions={groupPermissions}
        onOpenChange={(open: boolean) => setViewRole(open)}
        onSuccess={async () => {
          // Refresh the page data to show updated roles
          // Don't close modal - user should manually close it
          await revalidator.revalidate()
        }}
      />

      
    </div>
  )
}


export default roleManagementPage;