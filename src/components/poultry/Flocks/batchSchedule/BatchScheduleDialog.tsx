import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const  BatchScheduleDialog = ({handleClick } : {handleClick:  () => void}) => {
  return (
    <Dialog >
      <form>
        <DialogTrigger asChild>
        <Button onClick={handleClick} variant="outline" size="sm" className="hidden sm:inline-flex bg-secondary-100 hover:bg-secondary-200 text-secondary-800">
                  <span className="hidden sm:inline ">Schedule Management</span>
                  <span className="sm:hidden">Schedule</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[90%] h-[80%] max-w-none p-10 bg-white dark:bg-zinc-900 rounded-none">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">Username</Label>
              <Input id="username-1" name="username" defaultValue="@peduarte" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default BatchScheduleDialog;
