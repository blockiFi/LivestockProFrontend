"use client"

import { useState, useMemo } from "react"
import { Users, Search, Shield, Settings, Key, TrendingUp, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLoaderData, useRevalidator } from "react-router-dom"
import type { FarmUserRoleSummary, Role, Farm } from "@/lib/types"
import { ManageUserRolesModal } from "@/components/modals/ManageUserRolesModal"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { toast } from "react-toastify"
import { addUserToFarm, inviteUserToFarm } from "@/lib/request"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"
import { UpgradeModal, isUpgradeCode } from "@/components/general/UpgradeModal"

interface UserRoleManagementPageProps {
  embedded?: boolean
  usersData?: FarmUserRoleSummary[] | null
  rolesData?: Role[] | null
  currentFarmData?: Farm | null
}

const UserRoleManagementPage = ({
  embedded = false,
  usersData,
  rolesData,
  currentFarmData,
}: UserRoleManagementPageProps = {}) => {
  const loaderData = useLoaderData() as
    | {
        users?: FarmUserRoleSummary[] | null
        roles?: Role[] | null
        currentFarm?: Farm | null
      }
    | undefined
  const users = usersData ?? loaderData?.users ?? null
  const roles = rolesData ?? loaderData?.roles ?? null
  const currentFarm = currentFarmData ?? loaderData?.currentFarm ?? null
  const token = useSelector((state: RootState) => state.authentication.token)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all")
  const [activeUser, setActiveUser] = useState<FarmUserRoleSummary | null>(null)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState<"owner" | "manager" | "worker">("worker")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"owner" | "manager" | "worker">("worker")
  const [isInviting, setIsInviting] = useState(false)
  const [upgrade, setUpgrade] = useState<{ code?: string; message?: string } | null>(null)
  const revalidator = useRevalidator()

  const filteredUsers = useMemo(() => {
    if (!users) return []
    let filtered = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole =
        selectedRoleFilter === "all" ||
        user.roles.some((r) => r.id.toString() === selectedRoleFilter)
      return matchesSearch && matchesRole
    })
    return filtered
  }, [users, searchTerm, selectedRoleFilter])

  const stats = useMemo(() => {
    if (!users || !roles) {
      return {
        totalUsers: 0,
        usersWithRoles: 0,
        totalRoles: 0,
        avgRolesPerUser: "0.0",
      }
    }
    const usersWithRoles = users.filter((u) => u.roles.length > 0).length
    const totalRoleAssignments = users.reduce((sum, u) => sum + u.roles.length, 0)
    const avgRolesPerUser = users.length > 0 ? (totalRoleAssignments / users.length).toFixed(1) : "0.0"
    return {
      totalUsers: users.length,
      usersWithRoles,
      totalRoles: roles.length,
      avgRolesPerUser,
    }
  }, [users, roles])

  const handleManageRoles = (user: FarmUserRoleSummary) => {
    setActiveUser(user)
    setIsManageModalOpen(true)
  }

  const handleModalSuccess = async () => {
    await revalidator.revalidate()
    setIsManageModalOpen(false)
    setActiveUser(null)
  }

  if (!users || !roles || !currentFarm) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading user role data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8"}>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {!embedded && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">User Role Management</h1>
            <p className="text-gray-600 text-lg">
              Manage roles and permissions for users in{" "}
              <span className="font-semibold">{currentFarm.name}</span>
            </p>
          </div>
        )}
        <ActionGate anyOf={ACTIONS.users.create}>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/30"
            disabled={isAddingUser}
            onClick={async () => {
              if (!token || !currentFarm?.id) {
                toast.error("Missing authentication or farm context")
                return
              }
              if (!newUserEmail.trim()) {
                toast.error("Enter the user email you want to add")
                return
              }
              setIsAddingUser(true)
              const res = await addUserToFarm(token, currentFarm.id, {
                email: newUserEmail.trim(),
                role: newUserRole,
              })
              setIsAddingUser(false)
              if (res.success) {
                toast.success("User added to business successfully")
                setNewUserEmail("")
                await revalidator.revalidate()
              } else {
                const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error)
                if (isUpgradeCode(res.code)) {
                  setUpgrade({ code: res.code, message: msg })
                } else {
                  toast.error(msg)
                }
              }
            }}
          >
            <Users className="w-4 h-4 mr-2" />
            {isAddingUser ? "Adding..." : "Add User to Business"}
          </Button>
        </ActionGate>
      </div>

      {/* Management cards: Add existing user + Invite by email */}
      <ActionGate anyOf={ACTIONS.users.create}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Quick add existing user */}
        <Card className="p-4 border-gray-200 shadow-sm">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Add Existing User to Business
              </p>
              <p className="text-xs text-gray-500">
                Attach an existing platform user to <span className="font-semibold">{currentFarm.name}</span> by their email.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-3 items-center">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="max-w-xs"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "owner" | "manager" | "worker")}
                  className="px-3 py-2 h-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="worker">Worker</option>
                </select>
              </div>
              <p className="text-[11px] text-gray-500">
                This links an existing user account (by email) to this business and assigns the selected role.
              </p>
            </div>
          </div>
        </Card>

        {/* Invite by email */}
        <Card className="p-4 border-gray-200 shadow-sm">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Invite User by Email
              </p>
              <p className="text-xs text-gray-500">
                Send an invitation for a new or existing user to join <span className="font-semibold">{currentFarm.name}</span> with a specified role.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-3 items-center">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="max-w-xs"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "owner" | "manager" | "worker")}
                  className="px-3 py-2 h-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="worker">Worker</option>
                </select>
              </div>
              <Button
                size="sm"
                disabled={isInviting || !inviteEmail.trim() || !token}
                className="w-fit bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/30"
                onClick={async () => {
                  if (!token || !currentFarm?.id) {
                    toast.error("Missing authentication or farm context")
                    return
                  }
                  if (!inviteEmail.trim()) {
                    toast.error("Enter an email to invite")
                    return
                  }
                  setIsInviting(true)
                  const res = await inviteUserToFarm(token, currentFarm.id, {
                    email: inviteEmail.trim(),
                    role: inviteRole,
                  })
                  setIsInviting(false)
                  if (res.success) {
                    toast.success("Invitation sent successfully")
                    setInviteEmail("")
                    await revalidator.revalidate()
                  } else {
                    const msg = Array.isArray(res.error) ? res.error.join(", ") : String(res.error)
                    if (isUpgradeCode(res.code)) {
                      setUpgrade({ code: res.code, message: msg })
                    } else {
                      toast.error(msg)
                    }
                  }
                }}
              >
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
              <p className="text-[11px] text-gray-500">
                The invited user will appear here once they accept or are linked through your onboarding flow.
              </p>
            </div>
          </div>
        </Card>
        </div>
      </ActionGate>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Users with Roles</p>
              <p className="text-3xl font-bold text-green-900">{stats.usersWithRoles}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Total Roles</p>
              <p className="text-3xl font-bold text-purple-900">{stats.totalRoles}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Avg Roles/User</p>
              <p className="text-3xl font-bold text-orange-900">{stats.avgRolesPerUser}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 mb-6 border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-4 py-2.5 h-11 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id.toString()}>
                {role.name}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-500 whitespace-nowrap">
            Showing {filteredUsers.length} of {users?.length || 0} users
          </div>
        </div>
      </Card>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card className="p-16 text-center border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedRoleFilter !== "all"
              ? "No users found"
              : "No users in this farm"}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || selectedRoleFilter !== "all"
              ? "Try adjusting your search or filter criteria to find users."
              : "No users have been added to this farm yet."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredUsers.map((user) => {
            const colorVariants = [
              "from-blue-500 to-blue-600",
              "from-purple-500 to-purple-600",
              "from-green-500 to-green-600",
              "from-orange-500 to-orange-600",
              "from-pink-500 to-pink-600",
              "from-indigo-500 to-indigo-600",
            ]
            const colorIndex = user.id % colorVariants.length
            const gradient = colorVariants[colorIndex]

            return (
              <Card
                key={user.id}
                className="group hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Users className="w-7 h-7 text-white" />
                      </div>
    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Assigned Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant="outline"
                            className="bg-white border-gray-300 text-gray-700 font-medium"
                          >
                            <Shield className="w-3 h-3 mr-1.5" />
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">No roles assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Permissions Count */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Total Permissions</span>
                      </div>
                      <Badge variant="secondary" className="bg-gray-200 text-gray-700 font-semibold">
                        {user.permissions.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <ActionGate anyOf={ACTIONS.users.manage}>
                    <Button
                      variant="outline"
                      onClick={() => handleManageRoles(user)}
                      className="w-full gap-2 border-gray-300 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      Manage Roles & Permissions
                    </Button>
                  </ActionGate>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Manage Roles Modal */}
      {activeUser && (
        <ManageUserRolesModal
          user={activeUser}
          allRoles={roles}
          open={isManageModalOpen}
          onOpenChange={setIsManageModalOpen}
          onSuccess={handleModalSuccess}
          farmId={currentFarm.id}
          token={token}
        />
      )}
      <UpgradeModal
        open={upgrade !== null}
        onOpenChange={(open) => { if (!open) setUpgrade(null) }}
        code={upgrade?.code}
        message={upgrade?.message}
      />
    </div>
  )
}

export default UserRoleManagementPage
