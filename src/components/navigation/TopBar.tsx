import { useEffect, useRef } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from 'lucide-react'
import avater from "@/assets/avater.png"
import Logo from './Logo'
import NotificationBell from "@/components/notifications/NotificationBell"
import ImpersonationBanner from "@/components/general/ImpersonationBanner"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/store"
import { logout } from "@/store/AuthenticationSlice"
import { useNavigate } from "react-router-dom"
import { LoadFarmPermissions } from "@/lib/loader"

const TopBar = ({ children }: { children?: React.ReactNode }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.authentication.user)
  const activeFarmId = useSelector((state: RootState) => state.authentication.activeFarm?.id)
  const prevFarmIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (
      prevFarmIdRef.current !== undefined &&
      activeFarmId !== undefined &&
      prevFarmIdRef.current !== activeFarmId
    ) {
      void LoadFarmPermissions(true)
    }
    prevFarmIdRef.current = activeFarmId
  }, [activeFarmId])

  const userName =
    (user as any)?.name ||
    (user as any)?.full_name ||
    (user as any)?.username ||
    "Account"

  const userRole =
    (user as any)?.role ||
    (user as any)?.user_type ||
    "User"

  const handleLogout = () => {
    // Clear persisted auth + farm context
    localStorage.removeItem("authToken")
    localStorage.removeItem("activeFarm")
    dispatch(logout())
    navigate("/login")
  }

  return (
    <>
    <ImpersonationBanner user={user} />
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm">
    <div className="mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className='block md:hidden'>
            {children}
            </div>
             
            <Logo style='gap-1  md:hidden' />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <img
                  src={avater}
                  alt="Avatar"
                  className="rounded-full border"
                  height="32"
                  width="32"
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">{userName}</div>
                  <div className="text-xs text-muted-foreground">{userRole}</div>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => navigate("/dashboard/settings/profile")}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => navigate("/dashboard/settings/profile")}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="gap-2 text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </header>
  </>
  )
}

export default TopBar
