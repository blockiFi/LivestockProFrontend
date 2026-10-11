import { useCallback, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import type { DetailedFlockRecord, FlockAiInsights, FlockProfitLoss } from "@/lib/types"
import { FormModal, modalTone } from "@/components/ui/form-modal"
import { Button } from "@/components/ui/button"
import FlockMetricsDashboard from "@/components/poultry/Flocks/FlockMetricsDashboard"
import FlockComparativeReportModal from "@/components/modals/FlockComparativeReportModal"
import { exportFlockMetricsPdf, printFlockMetrics } from "@/lib/print-flock-metrics"
import { BarChart3, FileDown, Printer } from "lucide-react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"

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
      <FormModal
        open={open}
        onOpenChange={onOpenChange}
        title="Flock Metrics"
        description={<>AI-powered performance analysis for {flock.name} (Batch {flock.batch_number})</>}
        icon={BarChart3}
        tone="report"
        size="full"
        footer={
          <>
            <div className="mr-auto flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => setComparativeOpen(true)} className={cn("rounded-xl text-white", modalTone("report").button)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Detailed Comparison
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf} className="rounded-xl">
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Close
            </Button>
          </>
        }
      >
        <FlockMetricsDashboard
          flock={flock}
          profitLoss={profitLoss}
          daysInFlock={daysInFlock}
          currentAge={currentAge}
          onInsightsChange={handleInsightsChange}
        />
      </FormModal>

      <FlockComparativeReportModal
        open={comparativeOpen}
        onOpenChange={setComparativeOpen}
        flock={flock}
      />
    </>
  )
}
