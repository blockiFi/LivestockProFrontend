import type { PoultryMedicationRecord } from "@/lib/types"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle, Download, Eye, Factory, Package2, Pill } from "lucide-react"
import { formatDate, Naira } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import chicken from "@/assets/chicken.png"
const MedicationRecordView = ({ records }: { records: PoultryMedicationRecord[] }) =>{
  const [dateFilter, setDateFilter] = useState("")
  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filteredRecords = useMemo(() => {
    if (!dateFilter) return records
    return records.filter((record) => record.date.includes(dateFilter))
  }, [records, dateFilter])

  // Paginate filtered records
  const paginatedRecords = filteredRecords.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalMedications = records.length
  const totalCost = records.reduce((sum, record) => sum +record.cost, 0)
  const uniqueMedications = new Set(records.map((r) => r.medication.name)).size

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Administrations</p>
              <p className="text-2xl font-bold text-blue-600">{totalMedications}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="h-5 w-5 text-green-600" >{Naira}</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-green-600">{Naira}{totalCost.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Medications</p>
              <p className="text-2xl font-bold text-purple-600">{uniqueMedications}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="medication-date-filter">Filter by Date</Label>
          <Input
            id="medication-date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Administered By</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => {
              const isExpiringSoon =
                new Date(record.medication_inventory.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.medication.name}</p>
                      <p className="text-xs text-gray-500">{record.medication.description}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs {Naira}{
                          record.medication.type === "vaccine" ? "border-blue-200 text-blue-700" : "border-gray-200"
                        }`}
                      >
                        {record.medication.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {record.dosage} {record.dosage_unit}
                    </span>
                  </TableCell>
                  <TableCell>{record.quantity.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">{Naira}{record.cost.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img src={chicken} className="h-4 w-4 text-gray-400" />
                      {record.administered_by}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.administration_method.name}</p>
                      <p className="text-xs text-gray-500">{record.administration_method.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-gray-400" />
                      {record.medication_inventory.manufacturer}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm">{record.medication_inventory.batch_number}</span>
                      </div>
                      <div
                        className={`text-xs mt-1 {Naira}{isExpiringSoon ? "text-orange-600 font-medium" : "text-gray-500"}`}
                      >
                        Exp: {formatDate(record.medication_inventory.expiry_date)}
                        {isExpiringSoon && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span>Expiring Soon</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`{Naira}{medicationStatusColors[record.medication_inventory.status]} font-medium text-xs`}
                    >
                      {record.medication_inventory.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.notes && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Eye className="h-4 w-4 text-gray-400 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{record.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-end items-center gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page} of {Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage))}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage((p) => Math.min(Math.ceil(filteredRecords.length / rowsPerPage), p + 1))}
          disabled={page === Math.ceil(filteredRecords.length / rowsPerPage) || filteredRecords.length === 0}
        >
          Next
        </Button>
      </div>

      {/* Medication Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Usage Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(records.map((r) => r.medication.name))).map((medicationName) => {
              const medRecords = records.filter((r) => r.medication.name === medicationName)
              const medQuantity = medRecords.reduce((sum, r) => sum + r.quantity, 0)
              const medCost = medRecords.reduce((sum, r) => sum + r.cost, 0)
              const medication = medRecords[0].medication
              const lastAdministered = medRecords.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
              )[0]

              return (
                <Card key={medicationName} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold">{medicationName}</h4>
                    </div>
                    <p className="text-xs text-gray-600">{medication.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Total Quantity</p>
                        <p className="font-medium">{medQuantity.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Cost</p>
                        <p className="font-medium">{Naira}{medCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Administrations</p>
                        <p className="font-medium">{medRecords.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Given</p>
                        <p className="font-medium text-xs">{formatDate(lastAdministered.date)}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        medication.type === "vaccine" ? "border-blue-200 text-blue-700" : "border-gray-200"
                      }`}
                    >
                      {medication.type}
                    </Badge>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MedicationRecordView
