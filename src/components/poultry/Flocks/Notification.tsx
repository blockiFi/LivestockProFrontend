

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, X, Shield, Pill, AlertTriangle, Clock, Users, ChevronRight, Settings } from "lucide-react"

interface Notification {
  id: string
  type: "vaccination" | "medication" | "feeding" | "inspection" | "alert"
  title: string
  message: string
  priority: "high" | "medium" | "low"
  daysUntil: number
  scheduledDate: string
  flockName?: string
  actionRequired: boolean
  estimatedCost?: number
  icon: React.ReactNode
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "vaccination",
    title: "IBD Vaccine - Booster Due",
    message: "Second dose required for Flock Bro-001 to maintain immunity",
    priority: "high",
    daysUntil: 2,
    scheduledDate: "2025-01-04",
    flockName: "Bro-001",
    actionRequired: true,
    estimatedCost: 450.0,
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: "2",
    type: "medication",
    title: "Amprolium Treatment",
    message: "Preventive coccidiosis treatment scheduled",
    priority: "medium",
    daysUntil: 5,
    scheduledDate: "2025-01-07",
    flockName: "Bro-001",
    actionRequired: true,
    estimatedCost: 125.5,
    icon: <Pill className="h-4 w-4" />,
  },
  {
    id: "3",
    type: "inspection",
    title: "Weekly Health Inspection",
    message: "Routine flock health and mortality check",
    priority: "medium",
    daysUntil: 1,
    scheduledDate: "2025-01-03",
    flockName: "Bro-001",
    actionRequired: false,
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "4",
    type: "alert",
    title: "Feed Stock Running Low",
    message: "Finisher feed inventory below minimum threshold",
    priority: "high",
    daysUntil: 0,
    scheduledDate: "2025-01-02",
    actionRequired: true,
    icon: <AlertTriangle className="h-4 w-4" />,
  },
]

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
}

const typeColors = {
  vaccination: "bg-blue-100 text-blue-600",
  medication: "bg-purple-100 text-purple-600",
  feeding: "bg-green-100 text-green-600",
  inspection: "bg-orange-100 text-orange-600",
  alert: "bg-red-100 text-red-600",
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)

  useEffect(() => {
    // Simulate receiving notifications after component mounts
    const timer = setTimeout(() => {
      setNotifications(mockNotifications)
      setHasNewNotifications(true)
      setIsVisible(true)
    }, 3000) // Show notifications after 3 seconds

    return () => clearTimeout(timer)
  }, [])

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    if (notifications.length === 1) {
      setIsVisible(false)
      setHasNewNotifications(false)
    }
  }

  const dismissAll = () => {
    setNotifications([])
    setIsVisible(false)
    setHasNewNotifications(false)
  }

  const getUrgencyText = (daysUntil: number) => {
    if (daysUntil === 0) return "Today"
    if (daysUntil === 1) return "Tomorrow"
    return `${daysUntil} days`
  }

  const getUrgencyColor = (daysUntil: number, priority: string) => {
    if (daysUntil === 0) return "text-red-600 font-bold"
    if (daysUntil <= 2 && priority === "high") return "text-red-600 font-semibold"
    if (daysUntil <= 5) return "text-orange-600 font-medium"
    return "text-gray-600"
  }

  if (!isVisible || notifications.length === 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className={`relative ${hasNewNotifications ? "animate-pulse bg-red-50 border-red-200" : ""}`}
          onClick={() => setIsVisible(true)}
        >
          <Bell className="h-4 w-4" />
          {hasNewNotifications && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <Card className="shadow-2xl border-2 border-blue-200 bg-white animate-in slide-in-from-right-full duration-500">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Upcoming Activities</h3>
                <p className="text-xs text-gray-500">{notifications.length} items require attention</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  index === 0 ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${typeColors[notification.type]}`}>{notification.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 text-sm leading-tight">{notification.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">{notification.message}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${priorityColors[notification.priority]} text-xs font-medium`}>
                        {notification.priority.toUpperCase()}
                      </Badge>
                      {notification.flockName && (
                        <Badge variant="outline" className="text-xs">
                          {notification.flockName}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className={getUrgencyColor(notification.daysUntil, notification.priority)}>
                            {getUrgencyText(notification.daysUntil)}
                          </span>
                        </div>
                        {notification.estimatedCost && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">$</span>
                            <span className="font-medium text-gray-600">{notification.estimatedCost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {notification.actionRequired && (
                        <Button size="sm" className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700">
                          Action
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={dismissAll} className="text-xs text-gray-600 h-7">
              Dismiss All
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Button>
              <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700">
                Schedule Management
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
