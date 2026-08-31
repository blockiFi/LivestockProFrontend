import { useCallback, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import type { DetailedFlockRecord, FlockAiInsights, FlockProfitLoss } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import FlockMetricsDashboard from "@/components/poultry/Flocks/FlockMetricsDashboard"
import FlockComparativeReportModal from "@/components/modals/FlockComparativeReportModal"
import { exportFlockMetricsPdf, printFlockMetrics } from "@/lib/print-flock-metrics"
import { BarChart3, FileDown, Printer } from "lucide-react"
import { toast } from "react-toastify"

interface FlockMetricsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flock: DetailedFlockRecord
  profitLoss?: FlockProfitLoss | null
  daysInFlock: number
  currentAge: number
}

export default function FlockMetricsModal({
  open,
  onOpenChange,
  flock,
  profitLoss,
  daysInFlock,
  currentAge,
}: FlockMetricsModalProps) {
  const farmName = useSelector((state: RootState) => state.authentication.activeFarm?.name)
  const [aiInsights, setAiInsights] = useState<FlockAiInsights | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)
  const [comparativeOpen, setComparativeOpen] = useState(false)

  const handleInsightsChange = useCallback(
    (payload: {
      insights: FlockAiInsights | null
      analysis: string | null
      generatedAt: Date | null
    }) => {
      setAiInsights(payload.insights)
      setAiAnalysis(payload.analysis)
      setLastGenerated(payload.generatedAt)
    },
    []
  )

  const buildPrintInput = () => ({
    flock,
    profitLoss,
    daysInFlock,
    currentAge,
    farmName,
    aiInsights,
    aiAnalysis,
    generatedAt: lastGenerated ?? new Date(),
  })

  const handlePrint = () => {
    printFlockMetrics(buildPrintInput())
  }

  const handleExportPdf = () => {
    exportFlockMetricsPdf(buildPrintInput())
    toast.info("Choose 'Save as PDF' in the print dialog to download the report.")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[92vh] w-[min(100vw-1.5rem,72rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <div className="border-b border-slate-200 bg-white px-6 py-4 pr-14">
          <DialogHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div className="space-y-1">
              <DialogTitle className="text-xl">Flock Metrics</DialogTitle>
              <DialogDescription>
                AI-powered performance analysis for {flock.name} (Batch {flock.batch_number})
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button variant="default" size="sm" onClick={() => setComparativeOpen(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Detailed Comparison
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf} className="bg-white">
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <FlockMetricsDashboard
            flock={flock}
            profitLoss={profitLoss}
            daysInFlock={daysInFlock}
            currentAge={currentAge}
            onInsightsChange={handleInsightsChange}
          />
        </div>
      </DialogContent>
      </Dialog>

      <FlockComparativeReportModal
        open={comparativeOpen}
        onOpenChange={setComparativeOpen}
        flock={flock}
      />
    </>
  )
}
