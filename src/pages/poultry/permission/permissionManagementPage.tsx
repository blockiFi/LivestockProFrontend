"use client"

import { useState, useEffect, useMemo } from "react"
import { Lock, Search, ChevronDown, ChevronUp, Key, FolderTree, Filter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLoaderData } from "react-router-dom"
import type { Permission, PermissionGroup } from "@/lib/types"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"

interface PermissionManagementPageProps {
  embedded?: boolean
  permissionGroups?: PermissionGroup[] | null
}

export default function permissionManagementPage({ embedded = false, permissionGroups }: PermissionManagementPageProps = {}) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const loaderData = useLoaderData() as { PermissionGroups?: PermissionGroup[] | null } | undefined
  const PermissionGroups = permissionGroups ?? loaderData?.PermissionGroups ?? null

  useEffect(() => {
    console.log("PermissionGroups from loader:", PermissionGroups);
    if (PermissionGroups && Array.isArray(PermissionGroups)) {
      const allPermissions = PermissionGroups.flatMap((group) => {
        // Handle both cases: group.permissions might be an array or undefined
        return Array.isArray(group.permissions) ? group.permissions : []
      })
      console.log("Extracted permissions:", allPermissions);
      setPermissions(allPermissions)
    } else {
      console.warn("PermissionGroups is null or not an array:", PermissionGroups);
      setPermissions([])
    }
    setLoading(false)
  }, [PermissionGroups])

  const [moduleFilter] = useState<string>("all")

  const modules = useMemo(() => {
    if (!PermissionGroups) return [] as string[]
    return Array.from(new Set(PermissionGroups.map((g) => (g as any).module ?? (g as any).name ?? "").filter(Boolean)))
  }, [PermissionGroups])

  const filteredGroups = useMemo(() => {
    if (!PermissionGroups) return [] as PermissionGroup[]
    const q = (searchTerm || "").trim().toLowerCase()

    return PermissionGroups.map((group) => {
      const perms = (group.permissions ?? []).filter((perm: any) => {
        const name = (perm.name ?? "").toString().toLowerCase()
        const key = (perm.key ?? "").toString().toLowerCase()
        const desc = (perm.description ?? "").toString().toLowerCase()
        const matchesQuery = !q || name.includes(q) || key.includes(q) || desc.includes(q)
        return matchesQuery
      })
      return { ...group, permissions: perms }
    })
      .filter((g) => (g.permissions ?? []).length > 0)
      .filter((g) => moduleFilter === "all" || ((g as any).module ?? (g as any).name ?? "") === moduleFilter)
  }, [PermissionGroups, searchTerm, moduleFilter])

  const filteredPermissions = useMemo(() => filteredGroups.flatMap((g) => g.permissions ?? []), [filteredGroups])

  // Initialize all groups as expanded by default
  useEffect(() => {
    if (PermissionGroups && PermissionGroups.length > 0) {
      const allGroupNames = PermissionGroups.map((g) => (g as any).name ?? (g as any).module ?? "")
      setExpandedGroups(new Set(allGroupNames))
    }
  }, [PermissionGroups])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupName)) {
        newSet.delete(groupName)
      } else {
        newSet.add(groupName)
      }
      return newSet
    })
  }

  const isGroupExpanded = (groupName: string) => expandedGroups.has(groupName)

  return (
    <ActionGate
      anyOf={ACTIONS.permissions.view}
      fallback={
        <div className={embedded ? "space-y-6" : "min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8"}>
          <Card className="p-12 text-center">
            <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-muted-foreground">You do not have permission to view permissions.</p>
          </Card>
        </div>
      }
    >
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6 md:p-8"}>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Permission Management</h1>
          <p className="text-gray-600 text-lg">View and manage all available permissions across your system</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Permissions</p>
              <p className="text-3xl font-bold text-blue-900">{permissions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Permission Groups</p>
              <p className="text-3xl font-bold text-green-900">{modules.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Filtered Results</p>
              <p className="text-3xl font-bold text-purple-900">{filteredPermissions.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Filter className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6 border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search permissions by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredPermissions.length} of {permissions.length} permissions
          </div>
        </div>
      </Card>

      {/* Permissions List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      ) : !PermissionGroups || PermissionGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-muted-foreground mb-2">No permission groups found</p>
          <p className="text-sm text-gray-500">
            {PermissionGroups === null 
              ? "Failed to load permissions. Please check your connection and try again."
              : "No permission groups are configured for this farm."}
          </p>
        </Card>
      ) : filteredPermissions.length === 0 ? (
        <Card className="p-16 text-center border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? "No permissions found" : "No permissions available"}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm 
              ? "Try adjusting your search terms to find what you're looking for."
              : "No permissions are configured for this farm."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const moduleName = (group as any).module ?? (group as any).name ?? "Module";
            const perms = (group as any).permissions ?? [];
            const isExpanded = isGroupExpanded(moduleName);
            const groupColor = (group as any).color ?? "#3B82F6";
            
            return (
              <Card 
                key={moduleName} 
                className="group hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
              >
                <div 
                  className="h-2"
                  style={{ background: `linear-gradient(to right, ${groupColor}, ${groupColor}dd)` }}
                ></div>
                <div 
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleGroup(moduleName)}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ backgroundColor: groupColor }}
                  >
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{moduleName}</h3>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium">
                        {perms.length} {perms.length === 1 ? 'permission' : 'permissions'}
                      </Badge>
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/50">
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {perms.map((permission: any) => (
                        <Card 
                          key={permission.id} 
                          className="p-4 hover:shadow-md transition-all duration-200 border border-gray-200 bg-white"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: groupColor }}
                            ></div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{permission.name}</h4>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs border-gray-300"
                              style={{ borderColor: groupColor, color: groupColor }}
                            >
                              {group.name}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
    </ActionGate>
  )
}

