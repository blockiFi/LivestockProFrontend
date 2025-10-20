import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import logo from "@/assets/livestockpro1.png"
import avater from "@/assets/avater.png"
import Logo from './Logo'
const TopBar = ({ children }: { children?: React.ReactNode }) => {
  return (
    <header className="bg-white border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className='block md:hidden'>
            {children}
            </div>
             
            <Logo style='gap-1  md:hidden' />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-400 text-[10px] text-primary-400-foreground">
              3
            </span>
          </Button>
          <div className="flex items-center gap-2">
            <img
              src={avater}
              alt="Avatar"
              className="rounded-full border"
              height="32"
              width="32"
            />
            <div className="hidden md:block">
              <div className="text-sm font-medium">John Doe</div>
              <div className="text-xs text-muted-foreground">Farm Owner</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
  )
}

export default TopBar
