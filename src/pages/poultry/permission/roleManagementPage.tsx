"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Eye, Shield, Search, Users, Key, TrendingUp, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLoaderData, useRevalidator } from "react-router-dom"
import type { Role } from "@/lib/types"
import { ManageRolePermissionsModal } from "@/components/modals/ManageRole"
import { CreateRoleModal } from "@/components/modals/CreateRoleModal"
import { LoadFarmPermissions, LoadPermissionGroups } from "@/lib/loader"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import type { PermissionGroup } from "@/lib/types"
import { GetToken } from "@/lib/request"
import { toast } from "react-toastify"
import { AlertDialog } from "@/components/ui/alert-dialog"

interface RoleManagementPageProps {
  embedded?: boolean
  rolesData?: Role[] | null
  permissionGroupsData?: PermissionGroup[] | null
}

function roleManagementPage({ embedded = false, rolesData, permissionGroupsData }: RoleManagementPageProps = {}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeRole, setActiveRole] = useState<Role | null>(null)
  const [viewRole, setViewRole] = useState(false)
  const [groupPermissions, setGroupPermissions] = useState<PermissionGroup[]>([])
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null)
  const [pendingDeleteRole, setPendingDeleteRole] = useState<Role | null>(null)
  const revalidator = useRevalidator()
  const token = GetToken()

  const loaderData = useLoaderData() as { roles?: Role[] | null } | undefined
  const roles = rolesData ?? loaderData?.roles ?? []

  const filteredRoles = roles.filter((role) => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPermissions = new Set(roles.flatMap((r) => r.permissions ?? [])).size
  const activeRolesCount = roles.filter((r) => (r.permissions?.length ?? 0) > 0).length
  const avgPermissions = roles.length 
    ? (roles.reduce((sum, r) => sum + (r.permissions?.length ?? 0), 0) / roles.length).toFixed(1)
    : "0.0"

  const refreshPermissions = async () => {
    await LoadFarmPermissions(true)
    toast.info("Permissions updated")
  }

  const handleDelete = async (roleId: number) => {
    setDeletingRoleId(roleId)
    try {
      const axios = (await import("axios")).default
      const response = await axios.delete(
        `/api/permissions/roles/${roleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.status === 200 || response.status === 204) {
        toast.success("Role deleted successfully")
        await revalidator.revalidate()
        await refreshPermissions()
      } else {
        toast.error("Failed to delete role")
      }
    } catch (error: any) {
      console.error("Error deleting role:", error)
      toast.error(error.response?.data?.message || "An unexpected error occurred")
    } finally {
      setDeletingRoleId(null)
    }
  }

  useEffect(() => {
    let mounted = true
    const fetchGroups = async () => {
      if (permissionGroupsData) {
        setGroupPermissions(permissionGroupsData)
        return
      }

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
  }, [permissionGroupsData])

 

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8"}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {!embedded && (
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Role Management</h1>
              <p className="text-gray-600 text-lg">Create and manage user roles with granular permissions</p>
            </div>
          )}
          <ActionGate anyOf={ACTIONS.roles.create}>
            <Button 
              onClick={() => setShowCreateModal(true)} 
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 px-6 py-6 text-base font-semibold"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              Create New Role
            </Button>
          </ActionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Roles</p>
              <p className="text-3xl font-bold text-blue-900">{roles.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Active Roles</p>
              <p className="text-3xl font-bold text-green-900">{activeRolesCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Total Permissions</p>
              <p className="text-3xl font-bold text-purple-900">{totalPermissions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Avg Permissions</p>
              <p className="text-3xl font-bold text-orange-900">{avgPermissions}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4 mb-6 border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search roles by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredRoles.length} of {roles.length} roles
          </div>
        </div>
      </Card>

      {/* Roles List */}
      {filteredRoles.length === 0 ? (
        <Card className="p-16 text-center border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? "No roles found" : "No roles yet"}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? "Try adjusting your search terms to find what you're looking for."
              : "Get started by creating your first role. Roles help you organize permissions and manage user access efficiently."}
          </p>
          {!searchTerm && (
            <ActionGate anyOf={ACTIONS.roles.create}>
              <Button 
                onClick={() => setShowCreateModal(true)} 
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                <Plus className="w-4 h-4" />
                Create Your First Role
              </Button>
            </ActionGate>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRoles.map((role) => {
            const permissionCount = (role.permissions ?? []).length
            const colorVariants = [
              "from-blue-500 to-blue-600",
              "from-purple-500 to-purple-600",
              "from-green-500 to-green-600",
              "from-orange-500 to-orange-600",
              "from-pink-500 to-pink-600",
              "from-indigo-500 to-indigo-600",
            ]
            const colorIndex = role.id % colorVariants.length
            const gradient = colorVariants[colorIndex]

            return (
              <Card 
                key={role.id} 
                className="group hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{role.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium">
                            {permissionCount} {permissionCount === 1 ? 'permission' : 'permissions'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => { setActiveRole(role); setViewRole(true); }}
                          className="gap-2 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          View Permissions
                        </DropdownMenuItem>
                        <ActionGate anyOf={ACTIONS.roles.update}>
                          <DropdownMenuItem 
                            onClick={() => { setActiveRole(role); setViewRole(true); }}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Role
                          </DropdownMenuItem>
                        </ActionGate>
                        <ActionGate anyOf={ACTIONS.roles.delete}>
                          <DropdownMenuItem 
                            onClick={() => setPendingDeleteRole(role)}
                            className="gap-2 text-red-600 cursor-pointer focus:text-red-600"
                            disabled={deletingRoleId === role.id}
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingRoleId === role.id ? "Deleting..." : "Delete Role"}
                          </DropdownMenuItem>
                        </ActionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Permissions Preview */}
                  {permissionCount > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Permissions Preview</p>
                      <div className="flex flex-wrap gap-2">
                        {(role.permissions ?? []).slice(0, 4).map((permission, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-white border-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1"
                          >
                            {permission.name}
                          </Badge>
                        ))}
                        {permissionCount > 4 && (
                          <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-600 text-xs font-medium px-2.5 py-1">
                            +{permissionCount - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setActiveRole(role); setViewRole(true); }}
                      className="flex-1 gap-2 border-gray-300 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                    <ActionGate anyOf={ACTIONS.roles.update}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setActiveRole(role); setViewRole(true); }}
                        className="flex-1 gap-2 border-gray-300 hover:bg-gray-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                    </ActionGate>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <CreateRoleModal
        open={showCreateModal}
        GroupPermissions={groupPermissions}
        onOpenChange={(open: boolean) => setShowCreateModal(open)}
        onSuccess={async () => {
          await revalidator.revalidate()
          await refreshPermissions()
        }}
      />

      <ManageRolePermissionsModal
        role={activeRole}
        open={viewRole}
        GroupPermissions={groupPermissions}
        onOpenChange={(open: boolean) => setViewRole(open)}
        onSuccess={async () => {
          await revalidator.revalidate()
          await refreshPermissions()
        }}
      />

      <AlertDialog
        isOpen={pendingDeleteRole !== null}
        onClose={() => setPendingDeleteRole(null)}
        title="Delete role?"
        description="This action cannot be undone and will remove the role from future assignments."
        type="warning"
        confirmText="Delete role"
        showCancel
        onConfirm={() => {
          if (pendingDeleteRole) {
            void handleDelete(pendingDeleteRole.id)
          }
        }}
      />

      
    </div>
  )
}


export default roleManagementPage;