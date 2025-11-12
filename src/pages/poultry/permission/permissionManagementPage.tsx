"use client"

import { useState, useEffect, useMemo } from "react"
import { Lock, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StatCard } from "@/components/general/StatCard"
import { useLoaderData } from "react-router-dom"
import type { Permission, PermissionGroup } from "@/lib/types"


export default function permissionManagementPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { PermissionGroups } = useLoaderData() as { PermissionGroups: PermissionGroup[] | null };

  useEffect(() => {
    if (PermissionGroups) {
      const allPermissions = PermissionGroups.flatMap((group) => group.permissions)
      setPermissions(allPermissions)
    }
    setLoading(false)
  }, [PermissionGroups])

  const [moduleFilter, setModuleFilter] = useState<string>("all")

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Permissions</h2>
        <p className="text-muted-foreground">View and manage all available permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Permissions" value={permissions.length} icon={Lock} color="blue" />
        <StatCard title="Modules" value={modules.length} icon={Lock} color="green" />
        <StatCard title="Filtered Results" value={filteredPermissions.length} icon={Lock} color="purple" />
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      
      </div>

      {/* Permissions List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      ) : filteredPermissions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No permissions found</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) => {
            const moduleName = (group as any).module ?? (group as any).name ?? "Module";
            const perms = (group as any).permissions ?? [];
            return (
              <div key={moduleName}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  <h3 className="text-lg font-semibold text-foreground">{moduleName}</h3>
                  <span className="ml-auto text-sm text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                    {perms.length} permissions
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Description:{" "}
                  <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">{group.description}</code>
                </p>
                <div className="grid gap-3">
                  {perms.map((permission: any) => (
                    <Card key={permission.id} className="p-4 hover:shadow-md transition-shadow border border-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{permission.name}</h4>
                            <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded">
                              {group.name}
                            </span>
                          </div>
                        
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}

