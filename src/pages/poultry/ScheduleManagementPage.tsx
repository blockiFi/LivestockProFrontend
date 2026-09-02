import ScheduleView from "@/components/poultry/Flocks/Schedule/ScheduleView"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { NewScheduleForm, PaginatedRequestType } from "@/lib/interfaces"
import { getSchedules, getFeedingSchedules, createFeedingSchedule } from "@/lib/request"
import type { DetailedSchedule, FeedingSchedule } from "@/lib/types"
import type { RootState } from "@/store"
import {
  Package,
  Pill,
  Plus,
  Search,
  Shield,
  Sparkles,
  Syringe,
  UtensilsCrossed,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useSelector } from "react-redux"
import axios from "@/lib/axios"
import Pagination from "@/components/general/Pagination"
import CreateSchedule from "@/components/modals/CreateSchedule"
import ImportScheduleFromDoc from "@/components/modals/ImportScheduleFromDoc"
import { AiGate } from "@/components/general/AiGate"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { ActionGate } from "@/components/general/ActionGate"
import { ACTIONS } from "@/lib/actionPermissions"

const createScheduleItems = async (
  token: string,
  farmId: number,
  scheduleType: "medication" | "vaccination",
  scheduleId: number,
  items: any[]
) => {
  try {
    const results = await Promise.all(
      items.map((item) =>
        axios.post(
          `/api/farms/${farmId}/${scheduleType}/schedule-items`,
          { ...item, schedule_id: scheduleId },
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        )
      )
    )
    return { success: true, data: results.map((r) => r.data?.data) }
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || "Network error"
    return { success: false, error: [message] }
  }
}

const createSchedule = async (
  token: string,
  farmId: number,
  scheduleType: "medication" | "vaccination",
  payload: { name: string; description?: string; poultry_type_id?: number; farm_id?: number }
) => {
  try {
    const res = await axios.post(
      `/api/farms/${farmId}/${scheduleType}/schedules`,
      {
        ...payload,
        farm_id: farmId,
        schedule_type: scheduleType,
      },
      { headers: { Authorization: token ? `Bearer ${token}` : "" } }
    )
    return { success: true, data: res.data?.data }
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || "Network error"
    return { success: false, error: [message] }
  }
}

function matchesSearch(schedule: any, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const name = String(schedule?.name ?? schedule?.title ?? "").toLowerCase()
  const description = String(schedule?.description ?? "").toLowerCase()
  return name.includes(q) || description.includes(q)
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
      <ActionGate anyOf={ACTIONS.schedules.create}>
        <Button onClick={onAction} className="mt-5 gap-2" size="sm">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      </ActionGate>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string
  value: number
  icon: ReactNode
  iconClass: string
}) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              iconClass
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ScheduleManagementPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const token = useSelector((state: RootState) => state.authentication.token)
  const farmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const [activeTab, setActiveTab] = useState("medication")
  const [searchTerm, setSearchTerm] = useState("")

  const [schedules, setSchedules] = useState<{
    medicationSchedules?: PaginatedRequestType<DetailedSchedule[]>
    vaccinationSchedules?: PaginatedRequestType<DetailedSchedule[]>
    feedingSchedules?: PaginatedRequestType<FeedingSchedule[]>
  }>({})
  const [medicationPage, setMedicationPage] = useState(1)
  const [medicationTotalPages, setMedicationTotalPages] = useState(1)
  const [vaccinationPage, setVaccinationPage] = useState(1)
  const [vaccinationTotalPages, setVaccinationTotalPages] = useState(1)
  const [feedingPage, setFeedingPage] = useState(1)
  const [feedingTotalPages, setFeedingTotalPages] = useState(1)
  const [isCreating, setIsCreating] = useState(false)

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    type: "success" | "error" | "warning" | "info"
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info",
  })

  const showAlert = (
    title: string,
    description: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setAlertDialog({ isOpen: true, title, description, type })
  }

  const closeAlert = () => {
    setAlertDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const fetchSchedules = useCallback(async () => {
    if (!token || !farmId) return

    try {
      const [medicationRes, vaccinationRes, feedingRes] = await Promise.all([
        getSchedules(token, farmId, "medication", true, medicationPage, 10),
        getSchedules(token, farmId, "vaccination", true, vaccinationPage, 10),
        getFeedingSchedules(token, farmId, true, feedingPage, 10),
      ])

      const updatedSchedules: typeof schedules = {} as any

      if ((medicationRes as any).success && (medicationRes as any).data) {
        updatedSchedules.medicationSchedules = medicationRes as any
        setMedicationTotalPages((medicationRes as any).total_pages || 1)
      }
      if ((vaccinationRes as any).success && (vaccinationRes as any).data) {
        updatedSchedules.vaccinationSchedules = vaccinationRes as any
        setVaccinationTotalPages((vaccinationRes as any).total_pages || 1)
      }
      if ((feedingRes as any).success && (feedingRes as any).data) {
        updatedSchedules.feedingSchedules = feedingRes as any
        setFeedingTotalPages((feedingRes as any).total_pages || 1)
      }

      setSchedules((prev) => ({ ...prev, ...updatedSchedules }))
    } catch (error) {
      console.error("Error fetching schedules:", error)
    }
  }, [token, farmId, medicationPage, vaccinationPage, feedingPage])

  const refreshAll = async () => {
    await fetchSchedules()
  }

  const handleCreateSchedule = async (scheduleData: NewScheduleForm<any>) => {
    if (!token || !farmId) {
      showAlert("Authentication Required", "Please log in to create schedules.", "error")
      return
    }

    setIsCreating(true)
    try {
      if (scheduleData.schedule_type === "feeding") {
        const feedingRes = await createFeedingSchedule(token, farmId, {
          title: scheduleData.name,
          description: scheduleData.description,
          poultry_type_id: Number(scheduleData.poultry_type_id),
          items: scheduleData.items.map((item: any) => {
            const startDay = Number(item.start_day ?? item.age_days ?? item.feeding_day ?? 1)
            const openEnded = Boolean(item.open_ended)
            const endDay = openEnded
              ? null
              : Number(item.end_day ?? item.start_day ?? item.age_days ?? item.feeding_day ?? startDay)
            return {
              feed_type_id: item.feed_type_id ?? item.feedTypeId ?? item.feed_type?.id,
              feeding_times: item.feeding_times ?? [],
              quantity: Number(item.quantity ?? 0),
              feeding_day: startDay,
              start_day: startDay,
              end_day: endDay,
              open_ended: openEnded,
            }
          }),
        })

        if (!feedingRes.success || !feedingRes.data) {
          const errMsg =
            typeof feedingRes.error === "object" && !Array.isArray(feedingRes.error)
              ? JSON.stringify(feedingRes.error)
              : feedingRes.error?.join?.(", ") ||
                "Unknown error occurred while creating the feeding schedule."
          showAlert("Schedule Creation Failed", errMsg, "error")
          setIsCreating(false)
          return
        }

        showAlert(
          "Schedule Created Successfully",
          `Feeding schedule "${scheduleData.name}" has been created successfully.`,
          "success"
        )
        setIsCreateModalOpen(false)
        await refreshAll()
        return
      }

      const scheduleResponse = await createSchedule(
        token,
        farmId,
        scheduleData.schedule_type as "medication" | "vaccination",
        {
          name: scheduleData.name,
          description: scheduleData.description,
          poultry_type_id: scheduleData.poultry_type_id,
          farm_id: farmId,
        }
      )

      if (!scheduleResponse.success || !scheduleResponse.data) {
        showAlert(
          "Schedule Creation Failed",
          scheduleResponse.error?.join(", ") ||
            "Unknown error occurred while creating the schedule.",
          "error"
        )
        setIsCreating(false)
        return
      }

      if (scheduleData.items.length > 0) {
        const itemsResponse = await createScheduleItems(
          token,
          farmId,
          scheduleData.schedule_type as "medication" | "vaccination",
          scheduleResponse.data.id,
          scheduleData.items.map((item) => ({
            age_days: item.age_days,
            is_recurring: item.is_recurring ?? false,
            interval_days: item.is_recurring ? item.interval_days ?? null : null,
            poultry_vaccine_id: item.vaccine_id,
            poultry_medication_id: item.medication_id,
            name: item.name,
            dose: item.dose || 1,
            withdrawal_period_days: item.withdrawal_period_days || 0,
            storage_instructions: item.storage_instructions || "",
            description: item.description || "",
          }))
        )

        if (!itemsResponse.success) {
          showAlert(
            "Items Creation Failed",
            `Schedule created but failed to add items: ${itemsResponse.error?.join(", ") || "Unknown error"}`,
            "error"
          )
          setIsCreating(false)
          return
        }
      }

      showAlert(
        "Schedule Created Successfully",
        `${scheduleData.schedule_type.charAt(0).toUpperCase() + scheduleData.schedule_type.slice(1)} schedule "${scheduleData.name}" has been created successfully.`,
        "success"
      )

      setIsCreateModalOpen(false)
      await refreshAll()
    } catch (error) {
      console.error("Error creating schedule:", error)
      showAlert("Creation Failed", "Failed to create schedule. Please try again.", "error")
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  useEffect(() => {
    setSearchTerm("")
  }, [activeTab])

  const medicationCount =
    schedules.medicationSchedules?.total_records ??
    schedules.medicationSchedules?.data?.length ??
    0
  const vaccinationCount =
    schedules.vaccinationSchedules?.total_records ??
    schedules.vaccinationSchedules?.data?.length ??
    0
  const feedingCount =
    schedules.feedingSchedules?.total_records ??
    schedules.feedingSchedules?.data?.length ??
    0
  const totalSchedules = medicationCount + vaccinationCount + feedingCount

  const medicationList = useMemo(
    () => (schedules.medicationSchedules?.data ?? []).filter((s) => matchesSearch(s, searchTerm)),
    [schedules.medicationSchedules?.data, searchTerm]
  )
  const vaccinationList = useMemo(
    () => (schedules.vaccinationSchedules?.data ?? []).filter((s) => matchesSearch(s, searchTerm)),
    [schedules.vaccinationSchedules?.data, searchTerm]
  )
  const feedingList = useMemo(
    () => (schedules.feedingSchedules?.data ?? []).filter((s) => matchesSearch(s, searchTerm)),
    [schedules.feedingSchedules?.data, searchTerm]
  )

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Schedule Management
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-500">
              Manage medication, vaccination, and feeding schedule templates
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <ActionGate anyOf={ACTIONS.schedules.create}>
              <AiGate fallback={null}>
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white gap-2"
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                  Import (AI)
                </Button>
              </AiGate>
            </ActionGate>
            <ActionGate anyOf={ACTIONS.schedules.create}>
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create schedule
              </Button>
            </ActionGate>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total"
            value={totalSchedules}
            icon={<Package className="h-5 w-5" />}
            iconClass="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="Medication"
            value={medicationCount}
            icon={<Pill className="h-5 w-5" />}
            iconClass="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Vaccination"
            value={vaccinationCount}
            icon={<Shield className="h-5 w-5" />}
            iconClass="bg-sky-50 text-sky-600"
          />
          <StatCard
            label="Feeding"
            value={feedingCount}
            icon={<UtensilsCrossed className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-700"
          />
        </div>

        {/* Tabs + list */}
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-5">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-slate-100 p-1 rounded-lg h-auto">
                  <TabsTrigger
                    value="medication"
                    className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-2"
                  >
                    <Syringe className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Medication</span>
                    <span className="sm:hidden">Med</span>
                    <span className="ml-0.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
                      {medicationCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="vaccination"
                    className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-2"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Vaccination</span>
                    <span className="sm:hidden">Vac</span>
                    <span className="ml-0.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
                      {vaccinationCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="feeding"
                    className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-2"
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Feeding</span>
                    <span className="sm:hidden">Feed</span>
                    <span className="ml-0.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
                      {feedingCount}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <div className="relative w-full lg:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search schedules…"
                    className="pl-9 bg-white border-slate-200"
                  />
                </div>
              </div>

              <TabsContent value="medication" className="mt-0 focus-visible:outline-none">
                {medicationCount === 0 ? (
                  <EmptyState
                    icon={<Syringe className="h-5 w-5" />}
                    title="No medication schedules"
                    description="Create a medication schedule template to assign when adding flocks."
                    actionLabel="Create medication schedule"
                    onAction={() => setIsCreateModalOpen(true)}
                  />
                ) : medicationList.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    No schedules match “{searchTerm}”.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {medicationList.map((schedule: any) => (
                      <ScheduleView
                        key={schedule.id}
                        type="medication"
                        schedule={schedule}
                        onUpdated={refreshAll}
                      />
                    ))}
                    {medicationTotalPages > 1 && (
                      <Pagination
                        currentPage={medicationPage}
                        totalPages={medicationTotalPages}
                        onPageChange={setMedicationPage}
                      />
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vaccination" className="mt-0 focus-visible:outline-none">
                {vaccinationCount === 0 ? (
                  <EmptyState
                    icon={<Shield className="h-5 w-5" />}
                    title="No vaccination schedules"
                    description="Create a vaccination schedule template to assign when adding flocks."
                    actionLabel="Create vaccination schedule"
                    onAction={() => setIsCreateModalOpen(true)}
                  />
                ) : vaccinationList.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    No schedules match “{searchTerm}”.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vaccinationList.map((schedule: any) => (
                      <ScheduleView
                        key={schedule.id}
                        type="vaccination"
                        schedule={schedule}
                        onUpdated={refreshAll}
                      />
                    ))}
                    {vaccinationTotalPages > 1 && (
                      <Pagination
                        currentPage={vaccinationPage}
                        totalPages={vaccinationTotalPages}
                        onPageChange={setVaccinationPage}
                      />
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="feeding" className="mt-0 focus-visible:outline-none">
                {feedingCount === 0 ? (
                  <EmptyState
                    icon={<UtensilsCrossed className="h-5 w-5" />}
                    title="No feeding schedules"
                    description="Create a feeding schedule with daily rates or day ranges."
                    actionLabel="Create feeding schedule"
                    onAction={() => setIsCreateModalOpen(true)}
                  />
                ) : feedingList.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    No schedules match “{searchTerm}”.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {feedingList.map((schedule: any) => (
                      <ScheduleView
                        key={schedule.id}
                        type="feeding"
                        schedule={schedule}
                        onUpdated={refreshAll}
                      />
                    ))}
                    {feedingTotalPages > 1 && (
                      <Pagination
                        currentPage={feedingPage}
                        totalPages={feedingTotalPages}
                        onPageChange={setFeedingPage}
                      />
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <CreateSchedule
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSchedule}
          isLoading={isCreating}
        />

        {token && farmId ? (
          <ImportScheduleFromDoc
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            farmId={farmId}
            onConfirmed={refreshAll}
          />
        ) : null}

        <AlertDialog
          isOpen={alertDialog.isOpen}
          onClose={closeAlert}
          title={alertDialog.title}
          description={alertDialog.description}
          type={alertDialog.type}
        />
      </div>
    </div>
  )
}

export default ScheduleManagementPage
