import { useState } from "react"
import { CalendarCog, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  FormField,
  FormModal,
  FormSection,
  ModalFooterActions,
  formInputClass,
} from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"

const  BatchScheduleDialog = ({handleClick } : {handleClick:  () => void}) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => {
          handleClick()
          setOpen(true)
        }}
        variant="outline"
        size="sm"
        className="hidden sm:inline-flex bg-secondary-100 hover:bg-secondary-200 text-secondary-800"
      >
        <span className="hidden sm:inline ">Schedule Management</span>
        <span className="sm:hidden">Schedule</span>
      </Button>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Edit profile"
        description="Make changes to your profile here. Click save when you're done."
        icon={CalendarCog}
        tone="schedule"
        size="md"
        onSubmit={(e) => e.preventDefault()}
        footer={<ModalFooterActions onCancel={() => setOpen(false)} submitLabel="Save changes" />}
      >
        <FormSection icon={UserRound} title="Profile" description="Your display details.">
          <div className="grid gap-4">
            <FormField label="Name" htmlFor="name-1">
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" className={formInputClass()} />
            </FormField>
            <FormField label="Username" htmlFor="username-1">
              <Input id="username-1" name="username" defaultValue="@peduarte" className={formInputClass()} />
            </FormField>
          </div>
        </FormSection>
      </FormModal>
    </>
  )
}

export default BatchScheduleDialog;
