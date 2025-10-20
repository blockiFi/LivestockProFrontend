import { useSelector } from "react-redux";
import  store, { type RootState } from '../store/index';
import { useEffect, useState } from "react";
import { type Farm } from "@/lib/types";
import type { FarmRequestData } from "@/lib/interfaces";
import { getUserFarms, StoreFarm } from "@/lib/request";
import { setActiveFarm, setUser } from "@/store/AuthenticationSlice";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronRight, Fish, Layers, MapPin, PiggyBank, Plus, Search, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/navigation/TopBar";
function FarmSelection() {
    const navigate = useNavigate()
    const token = useSelector((state : RootState) => state.authentication.token);
    const CurrentUser = useSelector((state : RootState) => state.authentication.user);
    const [farms, setFarms] = useState<Farm[] | null>(CurrentUser?.farms ?? null);

    useEffect(  () => {
        const loadFarms = async (_token :string) : Promise<FarmRequestData>  => {
            const response  = await getUserFarms(token);
            if(response.success){
                console.log(response);
                if (CurrentUser) {
                    const updatedUser = {
                        ...CurrentUser,
                        farms: response.data
                    };
                    console.log(response.data);
                     setFarms(response.data ?? null);
                    store.dispatch(setUser(updatedUser));
                }
            }
            return response;

        }
        console.log("current User : " , CurrentUser)
        if (CurrentUser?.farms == null){
            console.log("gettting ");
            loadFarms(token); 
        }else{
            setFarms(CurrentUser?.farms);
        }
        console.log("here");
    } , [])
    
  const handleFarmSelect = (farmID : number) => {
    const activeFarm  = farms?.find(farm => farm.id === farmID);
    if(activeFarm){
        StoreFarm(activeFarm);
        store.dispatch(setActiveFarm(activeFarm));

    }
    navigate(`/dashboard`);

  }
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredFarms = farms?.filter((farm) => {
    const matchesSearch =
      farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" 
    return matchesSearch && matchesType
  })


  const getTypeIcon = (type: string) => {
    switch (type) {
      case "poultry":
        return <Layers className="h-5 w-5" />
      case "piggery":
        return <PiggyBank className="h-5 w-5" />
      case "fishery":
        return <Fish className="h-5 w-5" />
      default:
        return <Layers className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "bg-green-100 text-green-800"
      case 0:
        return "bg-gray-100 text-gray-800"
      case 0:
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TopBar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Farms</h1>
          <p className="text-gray-600">Select a farm to manage or create a new one</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search farms..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="poultry">Poultry</SelectItem>
              <SelectItem value="piggery">Piggery</SelectItem>
              <SelectItem value="fishery">Fishery</SelectItem>
            </SelectContent>
          </Select> */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary-500 hover:bg-primary-300">
                <Plus className="h-4 w-4 " />
                Add New Farm
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Farm</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="farm-name">Farm Name</Label>
                  <Input id="farm-name" placeholder="Enter farm name" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="farm-location">Location</Label>
                  <Input id="farm-location" placeholder="Enter location" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="farm-type">Farm Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farm type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="poultry">Poultry</SelectItem>
                      <SelectItem value="piggery">Piggery</SelectItem>
                      <SelectItem value="fishery">Fishery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="farm-size">Farm Size</Label>
                  <Input id="farm-size" placeholder="e.g., 100 acres" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="farm-description">Description</Label>
                  <Textarea id="farm-description" placeholder="Brief description of the farm" />
                </div>
                <div className="flex gap-2 pt-4 ">
                  <Button className="flex-1 bg-primary-500 hover:bg-primary-300">Create Farm</Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Farm Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarms?.map((farm) => (
            <Card
              key={farm.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleFarmSelect(farm.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-400/10 rounded-lg">{getTypeIcon("poultry")}</div>
                    <div>
                      <CardTitle className="text-lg">{farm.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        {farm.address}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(farm.status)} variant="secondary">
                    {farm.status == 1 ? "active" : "inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <div className="font-medium">{farm.size_hectares} Hecters</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Est:</span>
                    <div className="font-medium">
                      {farm.created_at ? new Date(farm.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Livestock Summary */}
                {/* <div className="space-y-2">
                  <span className="text-sm text-gray-500">Livestock:</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {farm.livestock.poultry > 0 && (
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <Layers className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                        <div className="font-medium">{farm.livestock.poultry.toLocaleString()}</div>
                        <div className="text-gray-500">Poultry</div>
                      </div>
                    )}
                    {farm.livestock.pigs > 0 && (
                      <div className="text-center p-2 bg-pink-50 rounded">
                        <PiggyBank className="h-4 w-4 mx-auto mb-1 text-pink-600" />
                        <div className="font-medium">{farm.livestock.pigs.toLocaleString()}</div>
                        <div className="text-gray-500">Pigs</div>
                      </div>
                    )}
                    {farm.livestock.fish > 0 && (
                      <div className="text-center p-2 bg-cyan-50 rounded">
                        <Fish className="h-4 w-4 mx-auto mb-1 text-cyan-600" />
                        <div className="font-medium">{farm.livestock.fish.toLocaleString()}</div>
                        <div className="text-gray-500">Fish</div>
                      </div>
                    )}
                  </div>
                </div> */}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-3 w-3" />
                    {/* {farm.manager} */}
                    Samuel
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {/* {farm.lastActivity} */}
                    Last Activity
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2" size="sm">
                  Manage Farm
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFarms?.length === 0 && (
          <div className="text-center py-12">
            <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No farms found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedType !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first farm"}
            </p>
            <Button  onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-primary-500">
              <Plus className="h-4 w-4" />
              Create Your First Farm
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
export default FarmSelection
